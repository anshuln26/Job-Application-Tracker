// Generates the server secrets ApplyTrack needs and prints where to paste them.
// Run with:  npm run setup:secrets
import { createHash, randomBytes } from 'node:crypto';
import webpush from 'web-push';

const cronSecret = randomBytes(32).toString('base64url');
const hash = createHash('sha256').update(cronSecret).digest('hex');
const vapid = webpush.generateVAPIDKeys();

console.log(`
1) Vercel → your project → Settings → Environment Variables
   Add each one for Production and Preview:

   CRON_SECRET        ${cronSecret}
   VAPID_PUBLIC_KEY   ${vapid.publicKey}
   VAPID_PRIVATE_KEY  ${vapid.privateKey}
   VAPID_SUBJECT      mailto:you@example.com   (your email)

2) Supabase → SQL Editor → run:

   insert into private.app_config (key, value)
   values ('server_secret_sha256', '${hash}')
   on conflict (key) do update set value = excluded.value;

3) Vercel → Deployments → ⋯ → Redeploy (so the new variables are used).

Keep these values private. Run this script again any time to rotate them.
`);
