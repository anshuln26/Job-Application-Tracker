-- ApplyTrack — complete schema for a fresh Supabase project.
-- Run this once in the Supabase SQL editor. Existing projects should apply the
-- files in supabase/migrations/ instead.

create table if not exists public.applications (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,

  company text not null,
  title text not null,
  location text,
  work_type text default 'Remote',
  status text not null default 'applied',
  priority text default 'medium',
  source text,

  salary_min numeric default 0,
  salary_max numeric default 0,
  currency text default 'INR',
  salary_period text not null default 'yearly' check (salary_period in ('yearly', 'monthly', 'hourly')),
  hours_per_week integer not null default 40,
  salary_undisclosed boolean default false,

  applied_date date default current_date,
  planned_apply_date date,
  deadline date,

  job_url text,
  contact_name text,
  contact_email text,
  resume_version text,
  resume_curation text default 'not_needed',
  visa_status text not null default 'none',

  referral_status text default 'none',
  referral_contact text,
  referral_role text,
  referral_linkedin text,
  referral_date date,

  tags jsonb default '[]'::jsonb,
  notes text,
  timeline jsonb default '[]'::jsonb,
  interviews jsonb default '[]'::jsonb,

  archived boolean default false,
  archived_at timestamptz,
  user_email text, -- legacy, no longer written
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists applications_user_id_idx on public.applications (user_id);

-- Row level security: every user can only ever see and change their own rows
alter table public.applications enable row level security;

create policy "Users can view their own applications" on public.applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own applications" on public.applications
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own applications" on public.applications
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own applications" on public.applications
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Keep updated_at current
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_applications_updated_at on public.applications;
create trigger trigger_applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

-- Self-service account deletion (cascades to applications)
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
