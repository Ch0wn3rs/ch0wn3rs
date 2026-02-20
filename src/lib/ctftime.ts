import { get as getBlob, put as putBlob } from '@vercel/blob';

const CACHE_PATH_PREFIX = 'ctftime/cache';
const CACHE_CONTROL_SECONDS = 60;
export const DEFAULT_TEAM_ID = '408704';

export interface CtftimeData {
  colombiaRank: string;
  globalRank: string;
  rating: string;
  activeSince: string;
  updatedAt: string;
}

function fallbackStats(year: number): CtftimeData {
  return {
    colombiaRank: '#1 COLOMBIA',
    globalRank: '#131',
    rating: '45.81 pts',
    activeSince: String(year),
    updatedAt: new Date().toISOString(),
  };
}

function cachePath(teamId: string): string {
  return `${CACHE_PATH_PREFIX}/team-${teamId}.json`;
}

function hasBlobConfig(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_TOKEN);
}

function isCtftimeData(data: unknown): data is CtftimeData {
  if (!data || typeof data !== 'object') return false;

  const value = data as Record<string, unknown>;
  return (
    typeof value.colombiaRank === 'string' &&
    typeof value.globalRank === 'string' &&
    typeof value.rating === 'string' &&
    typeof value.activeSince === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

async function readCtftimeCache(teamId: string): Promise<CtftimeData | null> {
  if (!hasBlobConfig()) return null;

  try {
    const result = await getBlob(cachePath(teamId), { access: 'public' });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    const data = await new Response(result.stream).json();
    return isCtftimeData(data) ? data : null;
  } catch (error) {
    console.error('Failed to read CTFtime Blob cache:', error);
    return null;
  }
}

async function writeCtftimeCache(teamId: string, data: CtftimeData): Promise<void> {
  if (!hasBlobConfig()) return;

  try {
    await putBlob(cachePath(teamId), JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: CACHE_CONTROL_SECONDS,
    });
  } catch (error) {
    console.error('Failed to write CTFtime Blob cache:', error);
  }
}

export async function fetchCtftimeFromSource(teamId: string): Promise<CtftimeData> {
  const year = new Date().getFullYear();
  const fallback = fallbackStats(year);

  if (!teamId) return fallback;

  try {
    const teamRes = await fetch(`https://ctftime.org/api/v1/teams/${teamId}/`, {
      headers: { 'User-Agent': 'ch0wn3rs-website' },
    });
    if (!teamRes.ok) return fallback;
    const teamData = await teamRes.json();

    let colombiaRank = fallback.colombiaRank;
    try {
      const topRes = await fetch(`https://ctftime.org/api/v1/top/${year}/`, {
        headers: { 'User-Agent': 'ch0wn3rs-website' },
      });
      if (topRes.ok) {
        const topData = await topRes.json();
        const colombianTeams = Object.entries(topData)
          .map(([name, data]: [string, any]) => ({ name, ...data }))
          .filter((t: any) => {
            const country = t?.[year]?.country ?? t.country ?? t?.country_code ?? undefined;
            return country === 'CO' || country === 'COL' || country === 'Colombia';
          })
          .sort((a: any, b: any) => {
            const aPts = a?.[year]?.points ?? a?.points ?? 0;
            const bPts = b?.[year]?.points ?? b?.points ?? 0;
            return bPts - aPts;
          });

        const position = colombianTeams.findIndex((t: any) =>
          String(t.name).toLowerCase().includes('ch0wn3rs') || String(t?.team_id) === String(teamId)
        );
        if (position !== -1) colombiaRank = `#${position + 1} COLOMBIA`;
      }
    } catch (error) {
      console.error('Failed to compute Colombia rank from CTFtime:', error);
    }

    const currentYearRating = teamData.rating?.[String(year)] ?? teamData.rating?.[0] ?? {};
    const globalRank = currentYearRating?.rating_place ?? teamData.rating?.[0]?.rating_place ?? 'N/A';
    const ratingPoints = currentYearRating?.rating_points ?? teamData.rating?.[0]?.rating_points ?? null;
    const rating = ratingPoints != null ? `${Number(ratingPoints).toFixed(2)} pts` : 'N/A';

    return {
      colombiaRank,
      globalRank: `#${globalRank}`,
      rating,
      activeSince: String(year),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch CTFtime source:', error);
    return fallback;
  }
}

export async function refreshCtftimeCache(teamId: string): Promise<CtftimeData> {
  const fresh = await fetchCtftimeFromSource(teamId);
  await writeCtftimeCache(teamId, fresh);
  return fresh;
}

export async function fetchCtftime(teamId: string): Promise<CtftimeData> {
  const year = new Date().getFullYear();
  const fallback = fallbackStats(year);

  if (!teamId) return fallback;

  const cached = await readCtftimeCache(teamId);
  if (cached) return cached;

  return refreshCtftimeCache(teamId);
}

export function isCtftimeCacheEnabled(): boolean {
  return hasBlobConfig();
}
