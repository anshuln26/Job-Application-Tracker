import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { env } from './env.js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Anonymous client — used for functions protected by the server secret or a feed token. */
export function anonClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, options);
}

/** Resolve the signed-in user from `Authorization: Bearer <access token>`. */
export async function userFromRequest(request: Request): Promise<{ user: User; db: SupabaseClient } | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const db = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...options,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, db };
}
