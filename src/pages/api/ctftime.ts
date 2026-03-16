import type { APIContext } from 'astro';

import { DEFAULT_TEAM_ID, fetchCtftime, getCtftimeRuntimeEnv } from '../../lib/ctftime';

export const prerender = false;

export async function GET({ request, locals }: APIContext) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get('teamId') ?? DEFAULT_TEAM_ID;

  try {
    const data = await fetchCtftime(teamId, getCtftimeRuntimeEnv(locals));
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=900',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
