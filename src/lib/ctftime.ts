const CACHE_MAX_AGE_MS = 10 * 60 * 1000;
const CACHE_KEY_PREFIX = 'ctftime:cache';
const PINS_KEY_PREFIX = 'ctftime:pins';
const INTERNAL_RECENT_COMPETITION_LIMIT = 20;
const PUBLIC_RECENT_COMPETITION_LIMIT = 10;

export const DEFAULT_TEAM_ID = '408704';
const CTFTIME_HEADERS = { 'User-Agent': 'ch0wn3rs-website' };

interface CtftimeKvLike {
  get(key: string, type?: 'text'): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface CtftimeRuntimeEnv {
  CTFTIME_KV?: CtftimeKvLike | null;
}

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
  isPinned: boolean;
  source: 'ctftime' | 'pin';
}

export interface CtftimeData {
  colombiaRank: string;
  globalRank: string;
  rating: string;
  activeSince: string;
  recentCompetitions: CtftimeCompetition[];
  updatedAt: string;
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

interface CtftimeResultScore {
  team_id?: number | string;
  place?: number | string;
  points?: number | string;
}

interface CtftimeResultEvent {
  scores?: CtftimeResultScore[];
  time?: number | string;
  title?: string;
}

interface CtftimeCompetitionCandidate {
  eventId: string;
  place: number;
  scorePoints: string;
  time: number;
  title: string;
}

interface CtftimeTeamYearRating {
  country?: string;
  points?: number;
  rating_place?: number | string;
  rating_points?: number | string;
}

interface CtftimeTeamData {
  rating?: Array<CtftimeTeamYearRating> & Record<string, CtftimeTeamYearRating | undefined>;
}

interface CtftimeTopTeamData {
  country?: string;
  country_code?: string;
  points?: number;
  team_id?: number | string;
  [year: string]: unknown;
}

interface CtftimePinnedReference {
  eventId: string;
  kind: 'reference';
  order: number;
}

interface CtftimePinnedCustom {
  ctfPoints: string;
  eventUrl: string;
  finishAt: string;
  id: string;
  kind: 'custom';
  logoUrl: string;
  modeLabel: string;
  order: number;
  place: number;
  ratingPoints: string;
  startAt: string;
  title: string;
}

type CtftimePinItem = CtftimePinnedReference | CtftimePinnedCustom;

interface CtftimePinConfig {
  items: CtftimePinItem[];
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

function cacheKey(teamId: string): string {
  return `${CACHE_KEY_PREFIX}:team:${teamId}`;
}

function pinsKey(teamId: string): string {
  return `${PINS_KEY_PREFIX}:team:${teamId}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCtftimeCompetition(data: unknown): data is CtftimeCompetition {
  if (!isObject(data)) return false;

  return (
    typeof data.eventId === 'string' &&
    typeof data.title === 'string' &&
    typeof data.place === 'number' &&
    typeof data.ctfPoints === 'string' &&
    typeof data.ratingPoints === 'string' &&
    typeof data.eventUrl === 'string' &&
    typeof data.happenedAt === 'string' &&
    typeof data.startAt === 'string' &&
    typeof data.finishAt === 'string' &&
    typeof data.dateLabel === 'string' &&
    typeof data.modeLabel === 'string' &&
    typeof data.logoUrl === 'string' &&
    typeof data.isPinned === 'boolean' &&
    (data.source === 'ctftime' || data.source === 'pin')
  );
}

function isCtftimeData(data: unknown): data is CtftimeData {
  if (!isObject(data)) return false;

  return (
    typeof data.colombiaRank === 'string' &&
    typeof data.globalRank === 'string' &&
    typeof data.rating === 'string' &&
    typeof data.activeSince === 'string' &&
    Array.isArray(data.recentCompetitions) &&
    data.recentCompetitions.every(isCtftimeCompetition) &&
    typeof data.updatedAt === 'string'
  );
}

function isCtftimePinnedReference(data: unknown): data is CtftimePinnedReference {
  return (
    isObject(data) &&
    data.kind === 'reference' &&
    typeof data.eventId === 'string' &&
    typeof data.order === 'number'
  );
}

function isCtftimePinnedCustom(data: unknown): data is CtftimePinnedCustom {
  return (
    isObject(data) &&
    data.kind === 'custom' &&
    typeof data.id === 'string' &&
    typeof data.order === 'number' &&
    typeof data.title === 'string' &&
    typeof data.eventUrl === 'string' &&
    typeof data.place === 'number' &&
    typeof data.ctfPoints === 'string' &&
    typeof data.ratingPoints === 'string' &&
    typeof data.startAt === 'string' &&
    typeof data.finishAt === 'string' &&
    typeof data.modeLabel === 'string' &&
    typeof data.logoUrl === 'string'
  );
}

function isCtftimePinConfig(data: unknown): data is CtftimePinConfig {
  return (
    isObject(data) &&
    Array.isArray(data.items) &&
    data.items.every((item) => isCtftimePinnedReference(item) || isCtftimePinnedCustom(item))
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

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ');
}

function extractNumericText(value: string): string {
  const match = stripTags(value).match(/[\d.]+/);
  return match?.[0] ?? 'Pending';
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

function formatDateParts(value: string): { day: string; month: string; year: number } {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      timeZone: 'UTC',
    }).format(date),
    day: ordinal(
      Number(
        new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          timeZone: 'UTC',
        }).format(date)
      )
    ),
    year: Number(
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
    ),
  };
}

export function formatDateRange(startAt: string, finishAt: string): string {
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

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse JSON from KV:', error);
    return null;
  }
}

function getKvBinding(runtimeEnv?: CtftimeRuntimeEnv | null): CtftimeKvLike | null {
  if (!runtimeEnv) return null;

  const candidate = runtimeEnv.CTFTIME_KV;
  if (!candidate || typeof candidate.get !== 'function' || typeof candidate.put !== 'function') {
    return null;
  }

  return candidate;
}

function getCachedAge(updatedAt: string): number {
  const timestamp = Date.parse(updatedAt);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : Date.now() - timestamp;
}

export function getCtftimeRuntimeEnv(locals: unknown): CtftimeRuntimeEnv | null {
  if (!isObject(locals)) return null;

  const runtime = locals.runtime;
  if (!isObject(runtime) || !isObject(runtime.env)) return null;

  return runtime.env as CtftimeRuntimeEnv;
}

export function parseCompetitionRatings(html: string): Map<string, CtftimeCompetitionRatingRow> {
  const rows = new Map<string, CtftimeCompetitionRatingRow>();
  const rowPattern = /<tr><td class="place_ico">[\s\S]*?<\/tr>/g;

  for (const [row] of html.matchAll(rowPattern)) {
    const cells = Array.from(
      row.matchAll(/<td(?:\s+class="[^"]*")?>\s*([\s\S]*?)\s*<\/td>/g),
      (match) => match[1].trim()
    );

    if (cells.length < 5) continue;

    const eventMatch = cells[2].match(/<a\s+href="\/event\/(\d+)">([\s\S]*?)<\/a>/);
    if (!eventMatch) continue;

    const [, eventId, rawTitle] = eventMatch;
    const place = Number(stripTags(cells[1]).trim());
    if (!Number.isFinite(place)) continue;

    rows.set(eventId, {
      eventId,
      title: decodeHtmlEntities(rawTitle),
      place,
      ctfPoints: extractNumericText(cells[3]),
      ratingPoints: extractNumericText(cells[4]),
      eventUrl: `https://ctftime.org/event/${eventId}`,
    });
  }

  return rows;
}

async function readCtftimeCache(teamId: string, runtimeEnv?: CtftimeRuntimeEnv | null): Promise<CtftimeData | null> {
  const kv = getKvBinding(runtimeEnv);
  if (!kv) return null;

  try {
    const raw = await kv.get(cacheKey(teamId), 'text');
    const data = parseJson<unknown>(raw);
    return isCtftimeData(data) ? data : null;
  } catch (error) {
    console.error('Failed to read CTFtime KV cache:', error);
    return null;
  }
}

async function writeCtftimeCache(
  teamId: string,
  data: CtftimeData,
  runtimeEnv?: CtftimeRuntimeEnv | null
): Promise<void> {
  const kv = getKvBinding(runtimeEnv);
  if (!kv) return;

  try {
    await kv.put(cacheKey(teamId), JSON.stringify(data));
  } catch (error) {
    console.error('Failed to write CTFtime KV cache:', error);
  }
}

async function readCtftimePins(
  teamId: string,
  runtimeEnv?: CtftimeRuntimeEnv | null
): Promise<CtftimePinConfig> {
  const kv = getKvBinding(runtimeEnv);
  if (!kv) return { items: [] };

  try {
    const raw = await kv.get(pinsKey(teamId), 'text');
    const data = parseJson<unknown>(raw);
    if (!isCtftimePinConfig(data)) return { items: [] };

    return {
      items: [...data.items].sort((a, b) => a.order - b.order),
    };
  } catch (error) {
    console.error('Failed to read CTFtime pins from KV:', error);
    return { items: [] };
  }
}

function buildCompetitionFromCandidate(
  candidate: CtftimeCompetitionCandidate,
  details: CtftimeEventDetails | null,
  ratingRow?: CtftimeCompetitionRatingRow
): CtftimeCompetition {
  const startAt = details?.start ?? new Date(candidate.time * 1000).toISOString();
  const finishAt = details?.finish ?? startAt;
  const modeLabel = details?.onsite ? details.location?.trim() || 'On-site' : 'On-line';

  return {
    eventId: candidate.eventId,
    title: decodeHtmlEntities(String(ratingRow?.title ?? details?.title ?? candidate.title)),
    place: candidate.place,
    ctfPoints: String(ratingRow?.ctfPoints ?? candidate.scorePoints),
    ratingPoints: String(ratingRow?.ratingPoints ?? 'Pending'),
    eventUrl: String(details?.ctftime_url ?? ratingRow?.eventUrl ?? `https://ctftime.org/event/${candidate.eventId}`),
    happenedAt: new Date(candidate.time * 1000).toISOString(),
    startAt,
    finishAt,
    dateLabel: formatDateRange(startAt, finishAt),
    modeLabel,
    logoUrl: String(details?.logo ?? ''),
    isPinned: false,
    source: 'ctftime',
  };
}

async function fetchRecentCompetitions(
  teamId: string,
  year: number,
  pinnedReferenceEventIds: string[]
): Promise<CtftimeCompetition[]> {
  const [resultsRes, teamPageRes] = await Promise.all([
    fetch(`https://ctftime.org/api/v1/results/${year}/`, { headers: CTFTIME_HEADERS }),
    fetch(`https://ctftime.org/team/${teamId}/`, { headers: CTFTIME_HEADERS }),
  ]);

  if (!resultsRes.ok || !teamPageRes.ok) {
    throw new Error(`Failed to fetch recent competitions: ${resultsRes.status}/${teamPageRes.status}`);
  }

  const [resultsData, teamPageHtml] = await Promise.all([
    resultsRes.json() as Promise<Record<string, CtftimeResultEvent>>,
    teamPageRes.text(),
  ]);

  const ratingRows = parseCompetitionRatings(teamPageHtml);
  const candidates = Object.entries(resultsData)
    .map(([eventId, event]) => {
      const score = Array.isArray(event.scores)
        ? event.scores.find((entry) => String(entry?.team_id) === String(teamId))
        : null;

      const place = Number(score?.place);
      if (!score || !Number.isFinite(place) || place > 30) return null;

      return {
        eventId,
        title: decodeHtmlEntities(String(event.title ?? 'Unknown event')),
        time: Number(event.time ?? 0),
        place,
        scorePoints: normalizeScore(score.points, 4),
      } satisfies CtftimeCompetitionCandidate;
    })
    .filter((competition): competition is CtftimeCompetitionCandidate => competition !== null)
    .sort((a, b) => b.time - a.time);

  const candidateIds = new Set(candidates.map((competition) => competition.eventId));
  const eventIdsForDetails = new Set(
    candidates.slice(0, INTERNAL_RECENT_COMPETITION_LIMIT).map((competition) => competition.eventId)
  );

  for (const eventId of pinnedReferenceEventIds) {
    if (candidateIds.has(eventId)) {
      eventIdsForDetails.add(eventId);
    }
  }

  const eventDetails = await Promise.all(
    Array.from(eventIdsForDetails).map(async (eventId) => {
      try {
        const response = await fetch(`https://ctftime.org/api/v1/events/${eventId}/`, {
          headers: CTFTIME_HEADERS,
        });
        if (!response.ok) return [eventId, null] as const;
        return [eventId, (await response.json()) as CtftimeEventDetails] as const;
      } catch (error) {
        console.error(`Failed to fetch CTFtime event details for ${eventId}:`, error);
        return [eventId, null] as const;
      }
    })
  );

  const detailsById = new Map<string, CtftimeEventDetails | null>(eventDetails);
  return candidates.map((competition) =>
    buildCompetitionFromCandidate(
      competition,
      detailsById.get(competition.eventId) ?? null,
      ratingRows.get(competition.eventId)
    )
  );
}

function buildCustomPinnedCompetition(item: CtftimePinnedCustom): CtftimeCompetition {
  const eventId = `custom:${item.id}`;
  return {
    eventId,
    title: item.title.trim(),
    place: item.place,
    ctfPoints: item.ctfPoints,
    ratingPoints: item.ratingPoints,
    eventUrl: item.eventUrl,
    happenedAt: item.startAt,
    startAt: item.startAt,
    finishAt: item.finishAt,
    dateLabel: formatDateRange(item.startAt, item.finishAt),
    modeLabel: item.modeLabel,
    logoUrl: item.logoUrl,
    isPinned: true,
    source: 'pin',
  };
}

export function mergePinnedCompetitions(
  fetchedCompetitions: CtftimeCompetition[],
  pins: CtftimePinItem[]
): CtftimeCompetition[] {
  const merged: CtftimeCompetition[] = [];
  const seen = new Set<string>();
  const fetchedByEventId = new Map(fetchedCompetitions.map((competition) => [competition.eventId, competition]));

  const appendCompetition = (competition: CtftimeCompetition) => {
    if (seen.has(competition.eventId)) return;
    seen.add(competition.eventId);
    merged.push(competition);
  };

  for (const pin of [...pins].sort((a, b) => a.order - b.order)) {
    if (pin.kind === 'reference') {
      const existing = fetchedByEventId.get(pin.eventId);
      if (!existing) continue;

      appendCompetition({
        ...existing,
        isPinned: true,
        source: 'pin',
      });
      continue;
    }

    appendCompetition(buildCustomPinnedCompetition(pin));
  }

  for (const competition of fetchedCompetitions) {
    appendCompetition(competition);
  }

  return merged.slice(0, PUBLIC_RECENT_COMPETITION_LIMIT);
}

export async function fetchCtftimeFromSource(
  teamId: string,
  runtimeEnv?: CtftimeRuntimeEnv | null
): Promise<CtftimeData> {
  const year = new Date().getFullYear();
  const fallback = fallbackStats(year);

  if (!teamId) return fallback;

  const pins = await readCtftimePins(teamId, runtimeEnv);
  const pinnedReferenceEventIds = pins.items
    .filter((item): item is CtftimePinnedReference => item.kind === 'reference')
    .map((item) => item.eventId);

  const [teamRes, recentCompetitions] = await Promise.all([
    fetch(`https://ctftime.org/api/v1/teams/${teamId}/`, {
      headers: CTFTIME_HEADERS,
    }),
    fetchRecentCompetitions(teamId, year, pinnedReferenceEventIds),
  ]);

  if (!teamRes.ok) {
    throw new Error(`Failed to fetch CTFtime team data: ${teamRes.status}`);
  }

  const teamData = (await teamRes.json()) as CtftimeTeamData;
  let colombiaRank = fallback.colombiaRank;

  try {
    const topRes = await fetch(`https://ctftime.org/api/v1/top/${year}/`, {
      headers: CTFTIME_HEADERS,
    });

    if (topRes.ok) {
      const topData = (await topRes.json()) as Record<string, CtftimeTopTeamData>;
      const colombianTeams = Object.entries(topData)
        .map(([name, data]) => ({ name, ...data }))
        .filter((team) => {
          const teamYear = isObject(team[String(year)]) ? team[String(year)] : null;
          const country = isObject(teamYear)
            ? (teamYear.country as string | undefined)
            : team.country ?? team.country_code;
          return country === 'CO' || country === 'COL' || country === 'Colombia';
        })
        .sort((a, b) => {
          const aYear = isObject(a[String(year)]) ? a[String(year)] : null;
          const bYear = isObject(b[String(year)]) ? b[String(year)] : null;
          const aPoints = Number((isObject(aYear) ? aYear.points : a.points) ?? 0);
          const bPoints = Number((isObject(bYear) ? bYear.points : b.points) ?? 0);
          return bPoints - aPoints;
        });

      const position = colombianTeams.findIndex(
        (team) =>
          String(team.name).toLowerCase().includes('ch0wn3rs') ||
          String(team.team_id) === String(teamId)
      );

      if (position !== -1) {
        colombiaRank = `#${position + 1} COLOMBIA`;
      }
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
    recentCompetitions: mergePinnedCompetitions(recentCompetitions, pins.items),
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchCtftime(
  teamId: string,
  runtimeEnv?: CtftimeRuntimeEnv | null
): Promise<CtftimeData> {
  const year = new Date().getFullYear();
  const fallback = fallbackStats(year);

  if (!teamId) return fallback;

  const cached = await readCtftimeCache(teamId, runtimeEnv);
  if (cached && getCachedAge(cached.updatedAt) <= CACHE_MAX_AGE_MS) {
    return cached;
  }

  try {
    const fresh = await fetchCtftimeFromSource(teamId, runtimeEnv);
    await writeCtftimeCache(teamId, fresh, runtimeEnv);
    return fresh;
  } catch (error) {
    console.error('Failed to fetch CTFtime source:', error);
    return cached ?? fallback;
  }
}
