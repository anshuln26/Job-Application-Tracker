-- ApplyTrack v2 migration
-- Safe to run on the existing database: it only adds columns, tightens security
-- and moves legacy fields out of the notes text. A copy of the table taken before
-- this migration lives in backup.applications_20261028.

begin;

-- 1. Owner-only row level security on applications ---------------------------
alter table public.applications enable row level security;

drop policy if exists "Users can view their own applications" on public.applications;
drop policy if exists "Users can insert their own applications" on public.applications;
drop policy if exists "Users can update their own applications" on public.applications;
drop policy if exists "Users can delete their own applications" on public.applications;

create policy "Users can view their own applications" on public.applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own applications" on public.applications
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own applications" on public.applications
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own applications" on public.applications
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 2. Remove the old client-driven verification code system -------------------
-- These functions let anyone set a code for any email and reset that account's
-- password. Supabase Auth's built-in email flows replace them.
drop function if exists public.create_verification_code(text, text, text);
drop function if exists public.verify_signup_code(text, text);
drop function if exists public.verify_reset_password_code(text, text, text);
drop table if exists public.auth_verification_codes;
drop table if exists public.password_reset_codes;

-- 3. New columns (previously hidden as JSON inside notes) ---------------------
alter table public.applications add column if not exists source text;
alter table public.applications add column if not exists salary_period text not null default 'yearly';
alter table public.applications add column if not exists hours_per_week integer not null default 40;
alter table public.applications add column if not exists visa_status text not null default 'none';
alter table public.applications alter column currency set default 'INR';

-- Move legacy "<!-- CT_META:{...}:CT_META -->" values into real columns
with legacy as (
  select id, substring(notes from '<!-- CT_META:(.*?):CT_META -->')::jsonb as meta
  from public.applications
  where notes like '%<!-- CT_META:%'
)
update public.applications a
set salary_period  = coalesce(nullif(l.meta->>'salaryPeriod', ''), a.salary_period),
    hours_per_week = coalesce((l.meta->>'hoursPerWeek')::int, a.hours_per_week),
    visa_status    = coalesce(nullif(l.meta->>'visaStatus', ''), a.visa_status),
    notes          = btrim(regexp_replace(a.notes, '\s*<!-- CT_META:.*?:CT_META -->', '', 'g'))
from legacy l
where a.id = l.id;

-- Normalize legacy values
update public.applications set currency = 'USD' where currency = '$';
update public.applications set currency = 'INR' where currency in ('₹', 'Rs', 'Rs.');
update public.applications set work_type = 'On-site' where work_type in ('Onsite', 'On-site', 'Office');
update public.applications set work_type = 'Remote' where work_type like 'Remote%';

alter table public.applications drop constraint if exists applications_salary_period_check;
alter table public.applications add constraint applications_salary_period_check
  check (salary_period in ('yearly', 'monthly', 'hourly'));

create index if not exists applications_user_id_idx on public.applications (user_id);

-- 4. Trigger function hardening ------------------------------------------------
alter function public.handle_updated_at() set search_path = '';

-- 5. Let users delete their own account (and, via cascade, their data) --------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 6. Resumes bucket: private, owner-only --------------------------------------
update storage.buckets set public = false where id = 'resumes';
drop policy if exists "Anyone can view resumes" on storage.objects;
drop policy if exists "Users can view their own resumes" on storage.objects;
create policy "Users can view their own resumes" on storage.objects
  for select to authenticated using (bucket_id = 'resumes' and (select auth.uid()) = owner);

commit;
