-- ApplyTrack v3: contacts, offer details, settings, push subscriptions,
-- calendar feed, reminder digests and two-factor authentication.
-- Additive only: no existing column, row or policy is changed or removed.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

-- Offer breakdown used by the offer comparison page ---------------------------
alter table public.applications add column if not exists offer_details jsonb;

-- Contacts --------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  company text,
  role text,
  relationship text not null default 'recruiter',
  email text,
  phone text,
  linkedin text,
  notes text,
  application_ids text[] not null default '{}',
  last_contacted date,
  next_follow_up date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_user_id_idx on public.contacts (user_id);
alter table public.contacts enable row level security;

drop policy if exists "Users manage their own contacts" on public.contacts;
create policy "Users manage their own contacts" on public.contacts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists trigger_contacts_updated_at on public.contacts;
create trigger trigger_contacts_updated_at
  before update on public.contacts
  for each row execute function public.handle_updated_at();

-- Per-user settings -----------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weekly_goal integer not null default 10 check (weekly_goal between 1 and 100),
  timezone text not null default 'Asia/Kolkata',
  email_digest boolean not null default false,
  push_enabled boolean not null default false,
  email_2fa boolean not null default false,
  calendar_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;

drop policy if exists "Users manage their own settings" on public.user_settings;
create policy "Users manage their own settings" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- email_2fa and calendar_token may only change through the functions below
revoke insert, update on public.user_settings from anon, authenticated;
grant insert (user_id, weekly_goal, timezone, email_digest, push_enabled) on public.user_settings to authenticated;
grant update (weekly_goal, timezone, email_digest, push_enabled) on public.user_settings to authenticated;

drop trigger if exists trigger_user_settings_updated_at on public.user_settings;
create trigger trigger_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.handle_updated_at();

-- Web push subscriptions ------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users see their own push subscriptions" on public.push_subscriptions;
create policy "Users see their own push subscriptions" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users delete their own push subscriptions" on public.push_subscriptions;
create policy "Users delete their own push subscriptions" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke insert, update on public.push_subscriptions from anon, authenticated;

-- Private tables (not exposed through the API) --------------------------------
create table if not exists private.app_config (
  key text primary key,
  value text not null
);

create table if not exists private.email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists email_otps_user_idx on private.email_otps (user_id, created_at desc);

create table if not exists private.verified_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_at timestamptz not null default now()
);

-- Two-factor authentication ---------------------------------------------------
-- A user who has turned on a second factor (authenticator app or email code)
-- can only read or write their data from a session that passed that factor.

create or replace function public.second_factor_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(auth.jwt() ->> 'aal' = 'aal2', false)
    or exists (
      select 1 from private.verified_sessions v
      where v.user_id = auth.uid()
        and v.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    )
    or (
      not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      )
      and not coalesce((select s.email_2fa from public.user_settings s where s.user_id = auth.uid()), false)
    );
$$;

create or replace function public.second_factor_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'totp', exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified' and f.factor_type = 'totp'
    ),
    'email', coalesce((select s.email_2fa from public.user_settings s where s.user_id = auth.uid()), false),
    'satisfied', public.second_factor_ok()
  );
$$;

do $$
declare t text;
begin
  foreach t in array array['applications', 'contacts', 'user_settings', 'push_subscriptions'] loop
    execute format('drop policy if exists "Require second factor" on public.%I', t);
    execute format(
      'create policy "Require second factor" on public.%I as restrictive for all to authenticated
         using ((select public.second_factor_ok())) with check ((select public.second_factor_ok()))', t);
  end loop;
end $$;

create or replace function public.verify_email_otp(p_code text, p_enable boolean default false)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sid uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  r record;
begin
  if v_uid is null or v_sid is null then
    raise exception 'Not signed in';
  end if;
  if p_enable then
    if not public.second_factor_ok() then
      raise exception 'Verify your existing second factor first';
    end if;
  elsif not coalesce((select email_2fa from public.user_settings where user_id = v_uid), false) then
    raise exception 'Email codes are not enabled for this account';
  end if;

  select * into r from private.email_otps
  where user_id = v_uid and not used and expires_at > now()
  order by created_at desc limit 1
  for update;
  if not found then
    return false;
  end if;
  if r.attempts >= 5 then
    update private.email_otps set used = true where id = r.id;
    return false;
  end if;
  if r.code_hash <> encode(extensions.digest(v_uid::text || ':' || btrim(p_code), 'sha256'), 'hex') then
    update private.email_otps set attempts = attempts + 1 where id = r.id;
    return false;
  end if;

  update private.email_otps set used = true where id = r.id;
  insert into private.verified_sessions (session_id, user_id) values (v_sid, v_uid)
  on conflict (session_id) do nothing;
  if p_enable then
    insert into public.user_settings (user_id, email_2fa) values (v_uid, true)
    on conflict (user_id) do update set email_2fa = true;
  end if;
  return true;
end;
$$;

create or replace function public.disable_email_2fa()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.second_factor_ok() then
    raise exception 'Not allowed';
  end if;
  update public.user_settings set email_2fa = false where user_id = auth.uid();
end;
$$;

-- Server-side functions (called by the Vercel API with a shared secret) ------
create or replace function private.check_server_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex')
        is distinct from (select value from private.app_config where key = 'server_secret_sha256') then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.issue_email_otp(p_secret text, p_user_id uuid, p_purpose text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_user record;
begin
  perform private.check_server_secret(p_secret);
  select id, email, coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', '') as name
    into v_user from auth.users where id = p_user_id;
  if not found then
    raise exception 'Unknown user';
  end if;
  if p_purpose = 'login'
     and not coalesce((select email_2fa from public.user_settings where user_id = p_user_id), false) then
    raise exception 'Email codes are not enabled for this account';
  end if;
  if exists (select 1 from private.email_otps where user_id = p_user_id and created_at > now() - interval '45 seconds') then
    raise exception 'Please wait a minute before requesting another code';
  end if;
  if (select count(*) from private.email_otps where user_id = p_user_id and created_at > now() - interval '1 hour') >= 6 then
    raise exception 'Too many codes requested. Try again in an hour';
  end if;

  v_code := lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000)::text, 6, '0');
  update private.email_otps set used = true where user_id = p_user_id and not used;
  insert into private.email_otps (user_id, code_hash, expires_at)
  values (p_user_id, encode(extensions.digest(p_user_id::text || ':' || v_code, 'sha256'), 'hex'), now() + interval '10 minutes');

  return jsonb_build_object('code', v_code, 'email', v_user.email, 'name', v_user.name);
end;
$$;

create or replace function public.reminder_digest(p_secret text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.check_server_secret(p_secret);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', s.user_id,
      'email', u.email,
      'name', coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
      'timezone', s.timezone,
      'email_digest', s.email_digest,
      'push_enabled', s.push_enabled,
      'subscriptions', (
        select coalesce(jsonb_agg(jsonb_build_object('endpoint', p.endpoint, 'p256dh', p.p256dh, 'auth', p.auth)), '[]'::jsonb)
        from public.push_subscriptions p where p.user_id = s.user_id
      ),
      'applications', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', a.id, 'company', a.company, 'title', a.title, 'status', a.status,
          'applied_date', a.applied_date, 'planned_apply_date', a.planned_apply_date,
          'deadline', a.deadline, 'interviews', a.interviews)), '[]'::jsonb)
        from public.applications a
        where a.user_id = s.user_id and not coalesce(a.archived, false)
      ),
      'contacts', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'company', c.company, 'next_follow_up', c.next_follow_up)), '[]'::jsonb)
        from public.contacts c
        where c.user_id = s.user_id and c.next_follow_up is not null
      )
    ))
    from public.user_settings s
    join auth.users u on u.id = s.user_id
    where s.email_digest or s.push_enabled
  ), '[]'::jsonb);
end;
$$;

create or replace function public.remove_push_subscription(p_secret text, p_endpoint text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_server_secret(p_secret);
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;

-- Push subscription registration ----------------------------------------------
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.second_factor_ok() then
    raise exception 'Not allowed';
  end if;
  if p_endpoint !~ '^https://' then
    raise exception 'Invalid subscription';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300));
end;
$$;

-- Private calendar feed -------------------------------------------------------
create or replace function public.rotate_calendar_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if auth.uid() is null or not public.second_factor_ok() then
    raise exception 'Not allowed';
  end if;
  insert into public.user_settings (user_id, calendar_token) values (auth.uid(), v_token)
  on conflict (user_id) do update set calendar_token = excluded.calendar_token;
  return v_token;
end;
$$;

create or replace function public.disable_calendar_feed()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.second_factor_ok() then
    raise exception 'Not allowed';
  end if;
  update public.user_settings set calendar_token = null where user_id = auth.uid();
end;
$$;

-- Anyone holding the secret feed URL can read that user's interview and
-- deadline dates (the same model as Google Calendar's "secret address").
create or replace function public.calendar_feed(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_uid uuid;
begin
  if p_token is null or length(p_token) < 32 then
    return null;
  end if;
  select user_id into v_uid from public.user_settings where calendar_token = p_token;
  if v_uid is null then
    return null;
  end if;
  return jsonb_build_object(
    'applications', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'company', a.company, 'title', a.title, 'status', a.status,
        'planned_apply_date', a.planned_apply_date, 'deadline', a.deadline, 'interviews', a.interviews)), '[]'::jsonb)
      from public.applications a
      where a.user_id = v_uid and not coalesce(a.archived, false)
    ),
    'contacts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'company', c.company, 'next_follow_up', c.next_follow_up)), '[]'::jsonb)
      from public.contacts c
      where c.user_id = v_uid and c.next_follow_up is not null
    )
  );
end;
$$;

-- Function permissions --------------------------------------------------------
revoke execute on function private.check_server_secret(text) from public, anon, authenticated;

revoke execute on function public.second_factor_ok() from public, anon;
revoke execute on function public.second_factor_status() from public, anon;
revoke execute on function public.verify_email_otp(text, boolean) from public, anon;
revoke execute on function public.disable_email_2fa() from public, anon;
revoke execute on function public.save_push_subscription(text, text, text, text) from public, anon;
revoke execute on function public.rotate_calendar_token() from public, anon;
revoke execute on function public.disable_calendar_feed() from public, anon;
grant execute on function public.second_factor_ok() to authenticated;
grant execute on function public.second_factor_status() to authenticated;
grant execute on function public.verify_email_otp(text, boolean) to authenticated;
grant execute on function public.disable_email_2fa() to authenticated;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;
grant execute on function public.rotate_calendar_token() to authenticated;
grant execute on function public.disable_calendar_feed() to authenticated;

-- Protected by the server secret or the feed token
grant execute on function public.issue_email_otp(text, uuid, text) to anon, authenticated;
grant execute on function public.reminder_digest(text) to anon, authenticated;
grant execute on function public.remove_push_subscription(text, text) to anon, authenticated;
grant execute on function public.calendar_feed(text) to anon, authenticated;

-- The server secret's SHA-256 hash is stored separately (never committed):
--   insert into private.app_config (key, value)
--   values ('server_secret_sha256', encode(extensions.digest('<SERVER_SECRET>', 'sha256'), 'hex'))
--   on conflict (key) do update set value = excluded.value;
