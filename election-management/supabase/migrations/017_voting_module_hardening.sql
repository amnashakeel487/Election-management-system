-- Voting module: polling status RPC, hardened one-vote enforcement

create or replace function public.get_election_voting_status(p_election_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_election record;
  v_now timestamptz := now();
begin
  select
    e.id,
    e.status,
    e.start_date,
    e.end_date,
    e.voter_roll_finalized_at
  into v_election
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed', 'archived');

  if not found then
    raise exception 'Election not found';
  end if;

  return jsonb_build_object(
    'election_id', v_election.id,
    'status', v_election.status,
    'voter_roll_finalized_at', v_election.voter_roll_finalized_at,
    'start_date', v_election.start_date,
    'end_date', v_election.end_date,
    'polling_open', public._election_polling_open(p_election_id),
    'phase', case
      when v_election.voter_roll_finalized_at is null then 'not_finalized'
      when v_election.status not in ('published', 'active') then 'closed'
      when v_now < v_election.start_date then 'not_started'
      when v_now > v_election.end_date then 'ended'
      else 'open'
    end
  );
end;
$$;

grant execute on function public.get_election_voting_status(uuid) to authenticated;

-- Re-assert cast: anonymous ballot + one vote per registration (race-safe)
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

  select c.name into v_candidate_name
  from public.candidates c
  where c.id = p_candidate_id;

  insert into public.anonymous_ballots (election_id, candidate_id)
  values (p_election_id, p_candidate_id)
  returning id into v_ballot_id;

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
      'anonymous', true
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'success', true,
    'receipt_hash', v_receipt,
    'cast_at', now()
  );
end;
$$;
