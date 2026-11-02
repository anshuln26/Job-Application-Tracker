/** Server-side configuration. Every optional feature reports whether it is configured. */
export const env = {
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
  supabaseAnonKey:
    process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '',
  /** Shared with the database (hash in private.app_config) and used by Vercel Cron. */
  serverSecret: process.env.CRON_SECRET ?? '',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? '',
  vapidSubject: process.env.VAPID_SUBJECT ?? 'mailto:noreply@example.com',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  emailFrom: process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? '',
  appUrl:
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:5173'),
};

export const features = {
  email: () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.serverSecret),
  push: () => Boolean(env.vapidPublicKey && env.vapidPrivateKey && env.serverSecret),
  database: () => Boolean(env.supabaseUrl && env.supabaseAnonKey),
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}
