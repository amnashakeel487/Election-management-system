-- =============================================================================
-- Run in Supabase → SQL Editor when anonymous_ballots is missing
-- (Error: relation "public.anonymous_ballots" does not exist)
-- Requires: elections, candidates, voter_registrations (migrations 001–005)
-- Safe to re-run
-- =============================================================================

do $$
begin
  if to_regclass('public.elections') is null then
    raise exception 'Missing public.elections. Run supabase/migrations/001 through 005 in order, then re-run this script.';
  end if;
  if to_regclass('public.candidates') is null then
    raise exception 'Missing public.candidates. Run 003_elections_candidates.sql (or full 001–005), then re-run.';
  end if;
  if to_regclass('public.users') is null then
    raise exception 'Missing public.users. Run 001_users.sql, then re-run.';
  end if;
end $$;

-- voter_registrations (004) if missing
do $$ begin
  create type public.voter_registration_status as enum ('registered', 'waitlisted');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.voter_registrations (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  status public.voter_registration_status not null,
  waitlist_position integer,
  created_at timestamptz not null default now(),
  constraint voter_registrations_unique_user unique (election_id, user_id),
  constraint voter_registrations_waitlist_position_check check (
    (status = 'waitlisted' and waitlist_position is not null)
    or (status = 'registered' and waitlist_position is null)
  )
);

create index if not exists voter_registrations_election_id_idx
  on public.voter_registrations (election_id);

alter table public.voter_registrations
  add column if not exists secret_voter_id text,
  add column if not exists voted_at timestamptz;

create table if not exists public.anonymous_ballots (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  cast_at timestamptz not null default now()
);

create index if not exists anonymous_ballots_election_id_idx
  on public.anonymous_ballots (election_id);
create index if not exists anonymous_ballots_candidate_id_idx
  on public.anonymous_ballots (candidate_id);

alter table public.voter_registrations
  add column if not exists voted_at timestamptz;

create index if not exists voter_registrations_voted_at_idx
  on public.voter_registrations (election_id)
  where voted_at is not null;

alter table public.anonymous_ballots
  add column if not exists ballot_choice_seal text;

alter table public.anonymous_ballots enable row level security;

drop policy if exists "Creators read anonymous ballot counts for own elections"
  on public.anonymous_ballots;

create policy "Creators read anonymous ballot counts for own elections"
  on public.anonymous_ballots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.elections e
      where e.id = election_id
        and (e.creator_id = auth.uid() or public.is_admin())
    )
  );

select
  to_regclass('public.anonymous_ballots') as anonymous_ballots_created,
  (select count(*) from public.anonymous_ballots) as ballot_row_count;
