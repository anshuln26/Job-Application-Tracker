import { features, json } from './_lib/env.js';
import { sendPush } from './_lib/notify.js';
import { userFromRequest } from './_lib/supabase.js';

/** POST /api/push-test → sends a test notification to the signed-in user's devices. */
export async function POST(request: Request) {
  if (!features.push()) return json({ error: 'Push notifications are not configured on the server' }, 503);
  const auth = await userFromRequest(request);
  if (!auth) return json({ error: 'Sign in first' }, 401);
  const { data, error } = await auth.db.from('push_subscriptions').select('endpoint, p256dh, auth');
  if (error) return json({ error: error.message }, 403);
  if (!data?.length) return json({ error: 'No devices registered — enable notifications first' }, 400);
  const { sent } = await sendPush(data, {
    title: 'ApplyTrack notifications are on 🎉',
    body: "You'll get reminders for interviews, deadlines and follow-ups here.",
    url: '/app',
  });
  return json({ sent });
}
