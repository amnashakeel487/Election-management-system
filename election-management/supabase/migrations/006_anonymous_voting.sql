-- Anonymous ballot storage + one vote per registered voter (enforced via voter_registrations.voted_at)

create table if not exists public.anonymous_ballots (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  cast_at timestamptz not null default now()
);

create index if not exists anonymous_ballots_election_id_idx on public.anonymous_ballots (election_id);
create index if not exists anonymous_ballots_candidate_id_idx on public.anonymous_ballots (candidate_id);

alter table public.voter_registrations
  add column if not exists voted_at timestamptz;

create index if not exists voter_registrations_voted_at_idx
  on public.voter_registrations (election_id)
  where voted_at is not null;

alter table public.anonymous_ballots enable row level security;

-- Anonymous votes: no voter-facing SELECT (choices are not linkable to users)
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

-- Inserts only through cast_anonymous_vote() RPC

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

create or replace function public.verify_secret_voter_for_voting(
  p_election_id uuid,
  p_secret_voter_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration record;
  v_polling_open boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_polling_open := public._election_polling_open(p_election_id);

  select
    vr.id,
    vr.status,
    vr.secret_voter_id,
    vr.voted_at
  into v_registration
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.user_id = v_user_id;

  if not found then
    return jsonb_build_object(
      'valid', false,
      'code', 'not_registered',
      'message', 'You are not registered for this election'
    );
  end if;

  if v_registration.status <> 'registered' then
    return jsonb_build_object(
      'valid', false,
      'code', 'not_eligible',
      'message', 'Only registered voters (not waitlisted) may vote'
    );
  end if;

  if v_registration.secret_voter_id is null then
    return jsonb_build_object(
      'valid', false,
      'code', 'no_secret_id',
      'message', 'Secret voter ID has not been issued yet'
    );
  end if;

  if v_registration.voted_at is not null then
    return jsonb_build_object(
      'valid', false,
      'code', 'already_voted',
      'message', 'You have already cast your vote in this election',
      'voted_at', v_registration.voted_at
    );
  end if;

  if not v_polling_open then
    return jsonb_build_object(
      'valid', false,
      'code', 'polling_closed',
      'message', 'Voting is closed for this election'
    );
  end if;

  if trim(upper(v_registration.secret_voter_id)) <> trim(upper(p_secret_voter_id)) then
    return jsonb_build_object(
      'valid', false,
      'code', 'invalid_secret_id',
      'message', 'Secret voter ID does not match our records'
    );
  end if;

  return jsonb_build_object(
    'valid', true,
    'registration_id', v_registration.id,
    'masked_secret_id', '****' || right(v_registration.secret_voter_id, 4)
  );
end;
$$;

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
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

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

  if trim(upper(v_registration.secret_voter_id)) <> trim(upper(p_secret_voter_id)) then
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

  insert into public.anonymous_ballots (election_id, candidate_id)
  values (p_election_id, p_candidate_id)
  returning id into v_ballot_id;

  update public.voter_registrations
  set voted_at = now()
  where id = v_registration.id;

  v_receipt := md5(v_ballot_id::text);
  v_receipt := substring(v_receipt from 1 for 4) || '...' || substring(v_receipt from 29 for 4);

  return jsonb_build_object(
    'success', true,
    'receipt_hash', v_receipt,
    'cast_at', now()
  );
end;
$$;

grant execute on function public.verify_secret_voter_for_voting(uuid, text) to authenticated;
grant execute on function public.cast_anonymous_vote(uuid, text, uuid) to authenticated;
