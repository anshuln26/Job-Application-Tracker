import { env, features, json } from '../_lib/env.js';
import { sendEmail } from '../_lib/notify.js';
import { anonClient, userFromRequest } from '../_lib/supabase.js';

/** POST /api/2fa/email-code { purpose: 'enable' | 'login' } → emails a 6-digit code to the signed-in user. */
export async function POST(request: Request) {
  if (!features.email()) return json({ error: 'Email sending is not configured on the server yet' }, 503);
  const auth = await userFromRequest(request);
  if (!auth) return json({ error: 'Sign in first' }, 401);
  const body = (await request.json().catch(() => ({}))) as { purpose?: string };
  const purpose = body.purpose === 'enable' ? 'enable' : 'login';

  const { data, error } = await anonClient().rpc('issue_email_otp', {
    p_secret: env.serverSecret,
    p_user_id: auth.user.id,
    p_purpose: purpose,
  });
  if (error) return json({ error: error.message }, 429);

  const { code, email } = data as { code: string; email: string };
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#18181b">
  <p style="font-size:15px">Your ApplyTrack verification code is:</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0;color:#4f46e5">${code}</p>
  <p style="font-size:13px;color:#6b7280">It expires in 10 minutes. If you didn't try to sign in, change your password.</p></div>`;
  await sendEmail(email, `${code} is your ApplyTrack code`, `Your ApplyTrack verification code is ${code}. It expires in 10 minutes.`, html);
  return json({ sent: true });
}
