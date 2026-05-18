-- =============================================================================
-- Run ONCE in Supabase → SQL Editor (no db push needed)
-- Fixes voter list on results + vote cast "digest" errors
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE
--
-- If you see: relation "public.anonymous_ballots" does not exist
--   → This script now creates that table when elections/candidates exist.
--   → If elections is also missing, run migrations 001–005 first, or:
--       bootstrap_anonymous_voting_sql_editor.sql then this file again.
-- =============================================================================

-- 0) Require elections + candidates; bootstrap voter_registrations / ballots if missing
do $$
begin
  if to_regclass('public.elections') is null then
    raise exception
      'Missing public.elections. Run supabase/migrations/001 through 003 in SQL Editor (in order), or supabase db push on this project.';
  end if;
  if to_regclass('public.candidates') is null then
    raise exception
      'Missing public.candidates. Run migration 003 (elections/candidates) before this script.';
  end if;
  if to_regclass('public.users') is null then
    raise exception
      'Missing public.users. Run migration 001_users.sql before this script.';
  end if;
end $$;

-- 0c) Legacy elections date columns (some DBs use start_time / end_time)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'elections'
      and column_name = 'start_time'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'elections'
      and column_name = 'start_date'
  ) then
    alter table public.elections rename column start_time to start_date;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'elections'
      and column_name = 'end_time'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'elections'
      and column_name = 'end_date'
  ) then
    alter table public.elections rename column end_time to end_date;
  end if;
end $$;

alter table public.elections
  add column if not exists real_time_results boolean not null default false,
  add column if not exists results_locked_at timestamptz;

-- 0a) is_admin() helper (migration 002) — required by RLS policies below
do $$ begin
  create type public.approval_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

alter table public.users
  add column if not exists approval_status public.approval_status not null default 'approved';

create or replace function public.is_admin()
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
      and role = 'admin'
      and approval_status = 'approved'
  );
$$;

-- 0b) voter_registrations (migration 004) + secret ID columns (migration 005)
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
create index if not exists voter_registrations_user_id_idx
  on public.voter_registrations (user_id);
create index if not exists voter_registrations_status_idx
  on public.voter_registrations (election_id, status);

alter table public.elections
  add column if not exists secret_voter_id_prefix text not null default 'POLL-A',
  add column if not exists voter_roll_finalized_at timestamptz;

alter table public.voter_registrations
  add column if not exists secret_voter_id text,
  add column if not exists secret_voter_id_assigned_at timestamptz,
  add column if not exists secret_voter_id_emailed_at timestamptz;

create unique index if not exists voter_registrations_secret_id_per_election_idx
  on public.voter_registrations (election_id, secret_voter_id)
  where secret_voter_id is not null;

create table if not exists public.election_secret_id_sequences (
  election_id uuid primary key references public.elections (id) on delete cascade,
  next_seq integer not null default 1
);

alter table public.voter_registrations enable row level security;

drop policy if exists "Users read own registrations" on public.voter_registrations;
create policy "Users read own registrations"
  on public.voter_registrations
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Election creators read registrations for their elections"
  on public.voter_registrations;
create policy "Election creators read registrations for their elections"
  on public.voter_registrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.elections e
      where e.id = election_id
        and e.creator_id = auth.uid()
    )
  );

-- 0c) anonymous_ballots (migration 006)
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

-- 1) pgcrypto (fixes: function digest does not exist)
create extension if not exists pgcrypto with schema extensions;

-- 1b) Security module (migration 022) — required for cast_anonymous_vote
create table if not exists public.platform_security_settings (
  id integer primary key default 1 check (id = 1),
  captcha_enabled boolean not null default true,
  captcha_provider text not null default 'turnstile' check (captcha_provider in ('checkbox', 'turnstile')),
  rate_limit_auth_per_minute integer not null default 30,
  rate_limit_vote_verify_per_minute integer not null default 15,
  rate_limit_vote_cast_per_minute integer not null default 5,
  ballot_sealing_enabled boolean not null default true,
  maintenance_mode boolean not null default false,
  vote_integrity_secret text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null
);

insert into public.platform_security_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.platform_security_settings enable row level security;

drop policy if exists "Admins read security settings" on public.platform_security_settings;
create policy "Admins read security settings"
  on public.platform_security_settings
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update security settings" on public.platform_security_settings;
create policy "Admins update security settings"
  on public.platform_security_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.security_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null,
  attempt_count integer not null default 0
);

alter table public.security_rate_limits enable row level security;

create or replace function public._vote_integrity_secret()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(trim(s.vote_integrity_secret), ''),
    'fortressvote-rotate-vote_integrity_secret-in-production'
  )
  from public.platform_security_settings s
  where s.id = 1;
$$;

create or replace function public.enforce_rate_limit(
  p_bucket text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  if p_bucket is null or length(trim(p_bucket)) = 0 then
    return;
  end if;

  p_max_attempts := greatest(1, least(coalesce(p_max_attempts, 10), 500));
  p_window_seconds := greatest(10, least(coalesce(p_window_seconds, 60), 86400));

  select window_start, attempt_count
  into v_window_start, v_count
  from public.security_rate_limits
  where bucket_key = p_bucket
  for update;

  if not found then
    insert into public.security_rate_limits (bucket_key, window_start, attempt_count)
    values (p_bucket, v_now, 1);
    return;
  end if;

  if v_window_start + (p_window_seconds || ' seconds')::interval < v_now then
    update public.security_rate_limits
    set window_start = v_now, attempt_count = 1
    where bucket_key = p_bucket;
    return;
  end if;

  if v_count >= p_max_attempts then
    raise exception 'Rate limit exceeded. Please wait and try again.';
  end if;

  update public.security_rate_limits
  set attempt_count = attempt_count + 1
  where bucket_key = p_bucket;
end;
$$;

grant execute on function public.enforce_rate_limit(text, integer, integer) to authenticated;
grant execute on function public.enforce_rate_limit(text, integer, integer) to service_role;

create or replace function public._seal_ballot_choice(
  p_ballot_id uuid,
  p_election_id uuid,
  p_candidate_id uuid
)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select encode(
    extensions.hmac(
      convert_to(
        p_ballot_id::text || ':' || p_election_id::text || ':' || p_candidate_id::text,
        'UTF8'
      ),
      convert_to(public._vote_integrity_secret(), 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public._assert_secret_voter_id_format(p_secret_voter_id text)
returns text
language plpgsql
immutable
as $$
declare
  v_norm text := trim(upper(coalesce(p_secret_voter_id, '')));
begin
  if length(v_norm) < 3 or length(v_norm) > 40 then
    raise exception 'Invalid secret voter ID format';
  end if;
  if v_norm ~ '[<>"'';\\]' then
    raise exception 'Invalid characters in secret voter ID';
  end if;
  return v_norm;
end;
$$;

create or replace function public._assert_uuid_param(p_value uuid, p_label text)
returns uuid
language plpgsql
immutable
as $$
begin
  if p_value is null then
    raise exception '% is required', p_label;
  end if;
  return p_value;
end;
$$;

create or replace function public._election_polling_open(p_election_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.elections e
    where e.id = p_election_id
      and e.status in ('published', 'active')
      and e.voter_roll_finalized_at is not null
      and now() >= e.start_date
      and now() <= e.end_date
  );
$$;

create or replace function public.maybe_auto_finalize_election_voter_roll(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object('finalized', false, 'reason', 'run_migration_035_for_auto_finalize');
end;
$$;

grant execute on function public.maybe_auto_finalize_election_voter_roll(uuid) to authenticated;
grant execute on function public.maybe_auto_finalize_election_voter_roll(uuid) to service_role;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id) on delete set null,
  target_user_id uuid references public.users (id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs
  add column if not exists election_id uuid references public.elections (id) on delete set null;

create index if not exists audit_logs_election_id_idx on public.audit_logs (election_id);

create or replace function public.log_audit_event(
  p_action text,
  p_details jsonb default '{}'::jsonb,
  p_target_user_id uuid default null,
  p_election_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs (actor_id, target_user_id, election_id, action, details)
  values (
    auth.uid(),
    p_target_user_id,
    p_election_id,
    p_action,
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.log_audit_event(text, jsonb, uuid, uuid) to authenticated;

revoke insert, update, delete on public.anonymous_ballots from anon, authenticated;

-- 2) Ballot columns
alter table public.anonymous_ballots
  add column if not exists ballot_choice_seal text;

alter table public.anonymous_ballots
  add column if not exists voter_proof_hash text;

alter table public.anonymous_ballots
  add column if not exists voter_verification_mask text;

create index if not exists anonymous_ballots_election_verification_mask_idx
  on public.anonymous_ballots (election_id, candidate_id)
  where voter_verification_mask is not null;

-- 4) Proof hash helper (038)
create or replace function public._voter_vote_proof_hash(
  p_secret_voter_id text,
  p_election_id uuid
)
returns text
language sql
immutable
parallel safe
security definer
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(
      trim(upper(p_secret_voter_id)) || ':' || p_election_id::text,
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.compute_voter_vote_proof_hash(
  p_election_id uuid,
  p_secret_voter_id text
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._assert_uuid_param(p_election_id, 'election_id');
  return public._voter_vote_proof_hash(
    public._assert_secret_voter_id_format(p_secret_voter_id),
    p_election_id
  );
end;
$$;

grant execute on function public.compute_voter_vote_proof_hash(uuid, text) to authenticated;
grant execute on function public.compute_voter_vote_proof_hash(uuid, text) to anon;

-- 5) Mask format ******** + last 4 chars (040)
create or replace function public._mask_secret_voter_id_display(p_secret text)
returns text
language sql
immutable
parallel safe
as $$
  with norm as (
    select upper(trim(p_secret)) as t
  )
  select case
    when length(t) = 0 then '****'
    else repeat('*', 8) || right(t, 4)
  end
  from norm;
$$;

create or replace function public.compute_voter_verification_mask(p_secret_voter_id text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public._mask_secret_voter_id_display(
    public._assert_secret_voter_id_format(p_secret_voter_id)
  );
end;
$$;

grant execute on function public.compute_voter_verification_mask(text) to authenticated;
grant execute on function public.compute_voter_verification_mask(text) to anon;

-- 6) Backfill old votes (single-candidate elections only)
create or replace function public.backfill_ballot_verification_masks(p_election_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_election_id uuid;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_ballot record;
  v_masks text[];
  v_idx integer;
begin
  for v_election_id in
    select distinct ab.election_id
    from public.anonymous_ballots ab
    where ab.voter_verification_mask is null
      and (p_election_id is null or ab.election_id = p_election_id)
  loop
    if (
      select count(distinct ab.candidate_id)
      from public.anonymous_ballots ab
      where ab.election_id = v_election_id
    ) <> 1 then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if (
      select count(*)
      from public.anonymous_ballots ab
      where ab.election_id = v_election_id
        and ab.voter_verification_mask is null
    ) <> (
      select count(*)
      from public.voter_registrations vr
      where vr.election_id = v_election_id
        and vr.voted_at is not null
        and vr.secret_voter_id is not null
    ) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    select coalesce(
      array_agg(public._mask_secret_voter_id_display(vr.secret_voter_id) order by vr.voted_at asc),
      '{}'::text[]
    )
    into v_masks
    from public.voter_registrations vr
    where vr.election_id = v_election_id
      and vr.voted_at is not null
      and vr.secret_voter_id is not null;

    v_idx := 1;
    for v_ballot in
      select ab.id
      from public.anonymous_ballots ab
      where ab.election_id = v_election_id
        and ab.voter_verification_mask is null
      order by ab.cast_at asc
    loop
      if v_idx > coalesce(array_length(v_masks, 1), 0) then
        exit;
      end if;

      update public.anonymous_ballots
      set voter_verification_mask = v_masks[v_idx]
      where id = v_ballot.id;

      v_updated := v_updated + 1;
      v_idx := v_idx + 1;
    end loop;
  end loop;

  return jsonb_build_object(
    'updated_ballots', v_updated,
    'skipped_elections', v_skipped,
    'details', v_details
  );
end;
$$;

-- 7) Results page RPC
create or replace function public.get_election_vote_verification_ledger(p_election_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_election record;
  v_rows jsonb;
  v_legacy integer;
begin
  perform public._assert_uuid_param(p_election_id, 'election_id');

  select
    e.id,
    e.status,
    e.real_time_results,
    e.end_date,
    e.results_locked_at
  into v_election
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed', 'archived');

  if not found then
    raise exception 'Election not found';
  end if;

  if not (
    v_election.real_time_results = true
    or v_election.status in ('completed', 'archived')
    or now() > v_election.end_date
    or v_election.results_locked_at is not null
  ) then
    raise exception 'Results are not available for this election yet';
  end if;

  perform public.backfill_ballot_verification_masks(p_election_id);

  select count(*)::integer
  into v_legacy
  from public.anonymous_ballots ab
  where ab.election_id = p_election_id
    and ab.voter_verification_mask is null;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'candidate_id', c.id,
        'candidate_name', c.name,
        'designation', c.designation,
        'vote_count', coalesce(vc.cnt, 0),
        'masked_secret_ids', coalesce(vc.masks, '[]'::jsonb)
      )
      order by coalesce(vc.cnt, 0) desc, c.sort_order asc
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.candidates c
  left join (
    select
      ab.candidate_id,
      count(*)::integer as cnt,
      jsonb_agg(ab.voter_verification_mask order by ab.cast_at asc) filter (
        where ab.voter_verification_mask is not null
      ) as masks
    from public.anonymous_ballots ab
    where ab.election_id = p_election_id
    group by ab.candidate_id
  ) vc on vc.candidate_id = c.id
  where c.election_id = p_election_id;

  return jsonb_build_object(
    'election_id', p_election_id,
    'candidates', v_rows,
    'legacy_ballots_without_mask', v_legacy,
    'mask_format', 'last_four_asterisks'
  );
end;
$$;

grant execute on function public.get_election_vote_verification_ledger(uuid) to authenticated;
grant execute on function public.get_election_vote_verification_ledger(uuid) to anon;

-- 8) Cast vote with mask (requires maybe_auto_finalize from migration 035+)
create or replace function public.cast_anonymous_vote(
  p_election_id uuid,
  p_secret_voter_id text,
  p_candidate_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration record;
  v_ballot_id uuid;
  v_receipt text;
  v_candidate_name text;
  v_secret text;
  v_settings record;
  v_seal text;
  v_proof_hash text;
  v_verification_mask text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public._assert_uuid_param(p_election_id, 'election_id');
  perform public._assert_uuid_param(p_candidate_id, 'candidate_id');
  v_secret := public._assert_secret_voter_id_format(p_secret_voter_id);

  select * into v_settings from public.platform_security_settings where id = 1;

  if coalesce(v_settings.maintenance_mode, false) then
    raise exception 'Platform is in maintenance mode';
  end if;

  perform public.enforce_rate_limit(
    'vote_cast:' || v_user_id::text || ':' || p_election_id::text,
    coalesce(v_settings.rate_limit_vote_cast_per_minute, 5),
    60
  );

  perform public.maybe_auto_finalize_election_voter_roll(p_election_id);

  if not public._election_polling_open(p_election_id) then
    raise exception 'Voting is closed for this election';
  end if;

  select
    vr.id,
    vr.status,
    vr.secret_voter_id,
    vr.voted_at
  into v_registration
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.user_id = v_user_id
  for update of vr;

  if not found then
    raise exception 'You are not registered for this election';
  end if;

  if v_registration.status <> 'registered' then
    raise exception 'Waitlisted voters cannot vote';
  end if;

  if v_registration.secret_voter_id is null then
    raise exception 'Secret voter ID not issued';
  end if;

  if trim(upper(v_registration.secret_voter_id)) <> v_secret then
    raise exception 'Invalid secret voter ID';
  end if;

  if v_registration.voted_at is not null then
    raise exception 'You have already voted in this election';
  end if;

  if not exists (
    select 1
    from public.candidates c
    where c.id = p_candidate_id
      and c.election_id = p_election_id
  ) then
    raise exception 'Invalid candidate for this election';
  end if;

  select c.name into v_candidate_name
  from public.candidates c
  where c.id = p_candidate_id;

  v_proof_hash := public._voter_vote_proof_hash(v_secret, p_election_id);
  v_verification_mask := public._mask_secret_voter_id_display(v_secret);

  insert into public.anonymous_ballots (
    election_id,
    candidate_id,
    voter_proof_hash,
    voter_verification_mask
  )
  values (p_election_id, p_candidate_id, v_proof_hash, v_verification_mask)
  returning id into v_ballot_id;

  if coalesce(v_settings.ballot_sealing_enabled, true) then
    v_seal := public._seal_ballot_choice(v_ballot_id, p_election_id, p_candidate_id);
    update public.anonymous_ballots
    set ballot_choice_seal = v_seal
    where id = v_ballot_id;
  end if;

  update public.voter_registrations
  set voted_at = now()
  where id = v_registration.id
    and voted_at is null;

  if not found then
    raise exception 'You have already voted in this election';
  end if;

  v_receipt := md5(v_ballot_id::text);
  v_receipt := substring(v_receipt from 1 for 4) || '...' || substring(v_receipt from 29 for 4);

  perform public.log_audit_event(
    'vote_cast',
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'candidate_name', v_candidate_name,
      'receipt_hash', v_receipt,
      'ballot_id', v_ballot_id,
      'verification_mask', v_verification_mask,
      'anonymous', true,
      'sealed', coalesce(v_settings.ballot_sealing_enabled, true)
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'success', true,
    'receipt_hash', v_receipt,
    'verification_hash', v_proof_hash,
    'verification_mask', v_verification_mask,
    'cast_at', now()
  );
end;
$$;

-- 9) Backfill + show result
select public.backfill_ballot_verification_masks(null) as backfill_result;

-- 10) Verify tables (all should be non-null)
select
  to_regclass('public.anonymous_ballots') as anonymous_ballots,
  to_regclass('public.elections') as elections,
  to_regclass('public.candidates') as candidates,
  to_regclass('public.voter_registrations') as voter_registrations,
  to_regclass('public.platform_security_settings') as security_settings;

-- Optional: test one election (replace with your election UUID)
-- select public.get_election_vote_verification_ledger('YOUR-ELECTION-UUID-HERE');
