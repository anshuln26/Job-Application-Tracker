import { env, features, json } from './_lib/env.js';

/** Which optional server features are configured — the UI hides or explains the rest. */
export function GET() {
  return json(
    { email: features.email(), push: features.push(), vapidPublicKey: features.push() ? env.vapidPublicKey : null },
    200,
    { 'cache-control': 'public, max-age=300' },
  );
}
