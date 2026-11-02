import { env, features } from './_lib/env.js';
import { buildIcs } from './_lib/ics.js';
import { anonClient } from './_lib/supabase.js';

/** GET /api/calendar?token=… → private iCalendar feed (subscribe from Google / Outlook / Apple). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.replace(/\.ics$/, '');
  if (!token || !features.database()) return new Response('Not found', { status: 404 });
  const { data, error } = await anonClient().rpc('calendar_feed', { p_token: token });
  if (error || !data) return new Response('Not found', { status: 404 });
  return new Response(buildIcs(data, env.appUrl), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'inline; filename="applytrack.ics"',
      'cache-control': 'private, max-age=900',
    },
  });
}
