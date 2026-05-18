-- Elections and candidates (election creators)

do $$ begin
  create type public.election_status as enum ('draft', 'published', 'active', 'completed', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.elections (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  max_voters integer not null check (max_voters > 0),
  status public.election_status not null default 'draft',
  eligibility_rule text not null default 'verified_voters',
  privacy_tier text not null default 'zero_knowledge',
  real_time_results boolean not null default false,
  allow_write_ins boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint elections_dates_valid check (end_date > start_date)
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists elections_creator_id_idx on public.elections (creator_id);
create index if not exists elections_status_idx on public.elections (status);
create index if not exists candidates_election_id_idx on public.candidates (election_id);

alter table public.elections enable row level security;
alter table public.candidates enable row level security;

create or replace function public.is_approved_election_creator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'election_creator'
      and approval_status = 'approved'
  );
$$;

-- Elections policies
create policy "Creators read own elections"
  on public.elections
  for select
  to authenticated
  using (creator_id = auth.uid() or public.is_admin());

create policy "Anyone authenticated reads published elections"
  on public.elections
  for select
  to authenticated
  using (status in ('published', 'active', 'completed'));

create policy "Approved creators insert elections"
  on public.elections
  for insert
  to authenticated
  with check (creator_id = auth.uid() and public.is_approved_election_creator());

create policy "Creators update own elections"
  on public.elections
  for update
  to authenticated
  using (creator_id = auth.uid() and public.is_approved_election_creator())
  with check (creator_id = auth.uid());

-- Candidates policies
create policy "Read candidates for visible elections"
  on public.candidates
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.elections e
      where e.id = election_id
        and (
          e.creator_id = auth.uid()
          or e.status in ('published', 'active', 'completed')
          or public.is_admin()
        )
    )
  );

create policy "Creators manage candidates on own draft elections"
  on public.candidates
  for all
  to authenticated
  using (
    public.is_approved_election_creator()
    and exists (
      select 1
      from public.elections e
      where e.id = election_id
        and e.creator_id = auth.uid()
        and e.status = 'draft'
    )
  )
  with check (
    public.is_approved_election_creator()
    and exists (
      select 1
      from public.elections e
      where e.id = election_id
        and e.creator_id = auth.uid()
        and e.status = 'draft'
    )
  );
