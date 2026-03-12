import { get as getBlob, put as putBlob } from '@vercel/blob';

const CACHE_PATH_PREFIX = 'ctftime/cache';
const CACHE_CONTROL_SECONDS = 60;
export const DEFAULT_TEAM_ID = '408704';
const CTFTIME_HEADERS = { 'User-Agent': 'ch0wn3rs-website' };

export interface CtftimeCompetition {
  eventId: string;
  title: string;
  place: number;
  ctfPoints: string;
  ratingPoints: string;
  eventUrl: string;
  happenedAt: string;
  startAt: string;
  finishAt: string;
  dateLabel: string;
  modeLabel: string;
  logoUrl: string;
}

export interface CtftimeData {
  colombiaRank: string;
  globalRank: string;
  rating: string;
  activeSince: string;
  recentCompetitions: CtftimeCompetition[];
  updatedAt: string;
}

function fallbackStats(year: number): CtftimeData {
  return {
    colombiaRank: '#1 COLOMBIA',
    globalRank: '#131',
    rating: '45.81 pts',
    activeSince: String(year),
    recentCompetitions: [],
    updatedAt: new Date().toISOString(),
  };
}

function cachePath(teamId: string): string {
  return `${CACHE_PATH_PREFIX}/team-${teamId}.json`;
}

function hasBlobConfig(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_TOKEN);
}

function isCtftimeCompetition(data: unknown): data is CtftimeCompetition {
  if (!data || typeof data !== 'object') return false;

  const value = data as Record<string, unknown>;
  return (
    typeof value.eventId === 'string' &&
    typeof value.title === 'string' &&
    typeof value.place === 'number' &&
    typeof value.ctfPoints === 'string' &&
    typeof value.ratingPoints === 'string' &&
    typeof value.eventUrl === 'string' &&
    typeof value.happenedAt === 'string' &&
    typeof value.startAt === 'string' &&
    typeof value.finishAt === 'string' &&
    typeof value.dateLabel === 'string' &&
    typeof value.modeLabel === 'string' &&
    typeof value.logoUrl === 'string'
  );
}

function isCtftimeData(data: unknown): data is CtftimeData {
  if (!data || typeof data !== 'object') return false;

  const value = data as Record<string, unknown>;
  return (
    typeof value.colombiaRank === 'string' &&
    typeof value.globalRank === 'string' &&
    typeof value.rating === 'string' &&
    typeof value.activeSince === 'string' &&
    Array.isArray(value.recentCompetitions) &&
    value.recentCompetitions.every(isCtftimeCompetition) &&
    typeof value.updatedAt === 'string'
  );
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeScore(value: unknown, fractionDigits: number): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(fractionDigits) : 'N/A';
}

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function formatDateParts(value: string): { month: string; day: string; year: number } {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      timeZone: 'UTC',
    }).format(date),
    day: ordinal(Number(new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date))),
    year: Number(new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)),
  };
}

function formatDateRange(startAt: string, finishAt: string): string {
  const start = formatDateParts(startAt);
  const finish = formatDateParts(finishAt);

  if (start.year !== finish.year) {
    return `${start.month} ${start.day}, ${start.year} - ${finish.month} ${finish.day}, ${finish.year}`;
  }

  if (start.month === finish.month) {
    return `${start.month} ${start.day} - ${finish.day}, ${start.year}`;
  }

  return `${start.month} ${start.day} - ${finish.month} ${finish.day}, ${start.year}`;
}

interface CtftimeEventDetails {
  ctftime_url?: string;
  finish?: string;
  logo?: string;
  location?: string;
  onsite?: boolean;
  start?: string;
  title?: string;
}

interface CtftimeCompetitionRatingRow {
  ctfPoints: string;
  eventId: string;
  eventUrl: string;
  place: number;
  ratingPoints: string;
  title: string;
}

function parseCompetitionRatings(html: string): Map<string, CtftimeCompetitionRatingRow> {
  const rows = new Map<string, CtftimeCompetitionRatingRow>();
  const rowPattern =
    /<tr><td class="place_ico">[\s\S]*?<\/td><td class="place">\s*(\d+)\s*<\/td><td><a href="\/event\/(\d+)">([\s\S]*?)<\/a><\/td><td>\s*([\d.]+)\s*<\/td><td>\s*([\d.]+)\s*<\/td><\/tr>/g;

  for (const match of html.matchAll(rowPattern)) {
    const [, place, eventId, rawTitle, ctfPoints, ratingPoints] = match;
    rows.set(eventId, {
      eventId,
      title: decodeHtmlEntities(rawTitle),
      place: Number(place),
      ctfPoints,
      ratingPoints,
      eventUrl: `https://ctftime.org/event/${eventId}`,
    });
  }

  return rows;
}

async function fetchRecentCompetitions(teamId: string, year: number): Promise<CtftimeCompetition[]> {
  try {
    const [resultsRes, teamPageRes] = await Promise.all([
      fetch(`https://ctftime.org/api/v1/results/${year}/`, { headers: CTFTIME_HEADERS }),
      fetch(`https://ctftime.org/team/${teamId}/`, { headers: CTFTIME_HEADERS }),
    ]);

    if (!resultsRes.ok || !teamPageRes.ok) return [];

    const [resultsData, teamPageHtml] = await Promise.all([
      resultsRes.json(),
      teamPageRes.text(),
    ]);

    const ratingRows = parseCompetitionRatings(teamPageHtml);
    const topCompetitions = Object.entries(resultsData as Record<string, any>)
      .map(([eventId, event]) => {
        const score = Array.isArray(event?.scores)
          ? event.scores.find((entry: any) => String(entry?.team_id) === String(teamId))
          : null;

        const place = Number(score?.place);
        if (!score || !Number.isFinite(place) || place > 30) return null;

        return {
          eventId,
          title: decodeHtmlEntities(String(event?.title ?? 'Unknown event')),
          time: Number(event?.time ?? 0),
          place,
          scorePoints: normalizeScore(score.points, 4),
        };
      })
      .filter(
        (
          competition
        ): competition is {
          eventId: string;
          title: string;
          time: number;
          place: number;
          scorePoints: string;
        } => competition !== null
      )
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);

    const eventDetails = await Promise.all(
      topCompetitions.map(async (competition) => {
        try {
          const response = await fetch(`https://ctftime.org/api/v1/events/${competition.eventId}/`, {
            headers: CTFTIME_HEADERS,
          });
          if (!response.ok) return [competition.eventId, null] as const;
          return [competition.eventId, (await response.json()) as CtftimeEventDetails] as const;
        } catch (error) {
          console.error(`Failed to fetch CTFtime event details for ${competition.eventId}:`, error);
          return [competition.eventId, null] as const;
        }
      })
    );

    const detailsById = new Map<string, CtftimeEventDetails | null>(eventDetails);
    return topCompetitions.map((competition) => {
      const ratingRow = ratingRows.get(competition.eventId);
      const details = detailsById.get(competition.eventId);
      const startAt = details?.start ?? new Date(competition.time * 1000).toISOString();
      const finishAt = details?.finish ?? startAt;
      const modeLabel = details?.onsite
        ? details.location?.trim() || 'On-site'
        : 'On-line';

      return {
        eventId: competition.eventId,
        title: decodeHtmlEntities(String(ratingRow?.title ?? details?.title ?? competition.title)),
        place: competition.place,
        ctfPoints: String(ratingRow?.ctfPoints ?? competition.scorePoints),
        ratingPoints: String(ratingRow?.ratingPoints ?? 'Pending'),
        eventUrl: String(details?.ctftime_url ?? ratingRow?.eventUrl ?? `https://ctftime.org/event/${competition.eventId}`),
        happenedAt: new Date(competition.time * 1000).toISOString(),
        startAt,
        finishAt,
        dateLabel: formatDateRange(startAt, finishAt),
        modeLabel,
        logoUrl: String(details?.logo ?? ''),
      } satisfies CtftimeCompetition;
    });
  } catch (error) {
    console.error('Failed to fetch recent CTFtime competitions:', error);
    return [];
  }
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
    const [teamRes, recentCompetitions] = await Promise.all([
      fetch(`https://ctftime.org/api/v1/teams/${teamId}/`, {
        headers: CTFTIME_HEADERS,
      }),
      fetchRecentCompetitions(teamId, year),
    ]);
    if (!teamRes.ok) return fallback;
    const teamData = await teamRes.json();

    let colombiaRank = fallback.colombiaRank;
    try {
      const topRes = await fetch(`https://ctftime.org/api/v1/top/${year}/`, {
        headers: CTFTIME_HEADERS,
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
      recentCompetitions,
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
