import {
  DEFAULT_TEAM_ID,
  isCtftimeCacheEnabled,
  refreshCtftimeCache,
} from '../../../lib/ctftime';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET({ request }: { request: Request }) {
  if (!isAuthorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!isCtftimeCacheEnabled()) {
    return json(
      {
        error: 'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to your environment.',
      },
      500
    );
  }

  try {
    const data = await refreshCtftimeCache(DEFAULT_TEAM_ID);
    return json({
      ok: true,
      teamId: DEFAULT_TEAM_ID,
      updatedAt: data.updatedAt,
      data,
    });
  } catch (error) {
    console.error('CTFtime cron refresh failed:', error);
    return json({ error: 'Failed to refresh CTFtime cache' }, 500);
  }
}
