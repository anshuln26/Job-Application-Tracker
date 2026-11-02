import { env, features, json } from '../_lib/env.js';
import { buildDigest, pushSummary, renderDigestEmail, type DigestUser } from '../_lib/digest.js';
import { sendEmail, sendPush } from '../_lib/notify.js';
import { anonClient } from '../_lib/supabase.js';

/** Daily job (Vercel Cron): email digests and push reminders for every opted-in user. */
export async function GET(request: Request) {
  if (!env.serverSecret || request.headers.get('authorization') !== `Bearer ${env.serverSecret}`) {
    return json({ error: 'unauthorized' }, 401);
  }
  const db = anonClient();
  const { data, error } = await db.rpc('reminder_digest', { p_secret: env.serverSecret });
  if (error) return json({ error: error.message }, 500);

  const summary = { users: 0, emails: 0, pushes: 0, failures: 0 };
  for (const user of (data ?? []) as DigestUser[]) {
    summary.users++;
    const digest = buildDigest(user);
    if (!digest.items.length && !digest.stale) continue;
    try {
      if (user.email_digest && features.email() && digest.items.length) {
        const mail = renderDigestEmail(user, digest, env.appUrl);
        await sendEmail(user.email, mail.subject, mail.text, mail.html);
        summary.emails++;
      }
      const push = pushSummary(digest);
      if (user.push_enabled && features.push() && push && user.subscriptions.length) {
        const { sent, gone } = await sendPush(user.subscriptions, push);
        summary.pushes += sent;
        for (const endpoint of gone) await db.rpc('remove_push_subscription', { p_secret: env.serverSecret, p_endpoint: endpoint });
      }
    } catch (e) {
      summary.failures++;
      console.error('reminder failed', user.user_id, e);
    }
  }
  return json(summary);
}
