-- Auto-finalize voter roll when voting window starts (assign secret IDs, lock registration)

create or replace function public._finalize_election_voter_roll_core(
  p_election_id uuid,
  p_auto boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finalized_at timestamptz;
  v_assigned_count integer := 0;
  v_reg record;
  v_new_id text;
  v_assignments jsonb := '[]'::jsonb;
  v_registered_count integer;
  v_lock_reason text;
begin
  select e.voter_roll_finalized_at
  into v_finalized_at
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed');

  if not found then
    raise exception 'Election not found or not eligible for finalization';
  end if;

  if v_finalized_at is not null then
    return jsonb_build_object(
      'election_id', p_election_id,
      'finalized', false,
      'reason', 'already_finalized',
      'finalized_at', v_finalized_at
    );
  end if;

  select count(*)::integer
  into v_registered_count
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  v_lock_reason := case when p_auto then 'auto_finalized' else 'finalized' end;

  update public.elections
  set voter_roll_finalized_at = now(),
      registration_locked_at = coalesce(registration_locked_at, now()),
      registration_lock_reason = coalesce(registration_lock_reason, v_lock_reason),
      updated_at = now()
  where id = p_election_id;

  for v_reg in
    select vr.id, vr.user_id, vr.secret_voter_id
    from public.voter_registrations vr
    where vr.election_id = p_election_id
      and vr.status = 'registered'
    order by vr.created_at asc
    for update of vr
  loop
    if v_reg.secret_voter_id is null then
      v_new_id := public._next_secret_voter_id(p_election_id);

      update public.voter_registrations
      set secret_voter_id = v_new_id,
          secret_voter_id_assigned_at = now()
      where id = v_reg.id;

      v_assigned_count := v_assigned_count + 1;

      v_assignments := v_assignments || jsonb_build_array(
        jsonb_build_object(
          'registration_id', v_reg.id,
          'user_id', v_reg.user_id,
          'secret_voter_id', v_new_id
        )
      );
    else
      v_assignments := v_assignments || jsonb_build_array(
        jsonb_build_object(
          'registration_id', v_reg.id,
          'user_id', v_reg.user_id,
          'secret_voter_id', v_reg.secret_voter_id
        )
      );
    end if;
  end loop;

  perform public.log_audit_event(
    'election_voter_roll_finalized',
    jsonb_build_object(
      'assigned_count', v_assigned_count,
      'registered_count', v_registered_count,
      'auto', p_auto,
      'actor_role', case
        when p_auto then 'system'
        when public.is_admin() then 'admin'
        else 'creator'
      end
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'election_id', p_election_id,
    'finalized', true,
    'finalized_at', now(),
    'assigned_count', v_assigned_count,
    'registered_count', v_registered_count,
    'auto', p_auto,
    'assignments', v_assignments
  );
end;
$$;

create or replace function public.finalize_election_voter_roll(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select e.creator_id
  into v_creator_id
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed');

  if v_creator_id is null then
    raise exception 'Election not found or not eligible for finalization';
  end if;

  if v_creator_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the election creator or an administrator can finalize the voter roll';
  end if;

  v_result := public._finalize_election_voter_roll_core(p_election_id, false);

  if coalesce((v_result->>'finalized')::boolean, false) = false
     and v_result->>'reason' = 'already_finalized' then
    raise exception 'Voter roll has already been finalized';
  end if;

  return v_result;
end;
$$;

-- Called when voting window has started and roll is not yet finalized
create or replace function public.maybe_auto_finalize_election_voter_roll(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_election record;
begin
  select
    e.id,
    e.status,
    e.start_date,
    e.end_date,
    e.voter_roll_finalized_at
  into v_election
  from public.elections e
  where e.id = p_election_id;

  if not found then
    return jsonb_build_object('finalized', false, 'reason', 'not_found');
  end if;

  if v_election.voter_roll_finalized_at is not null then
    return jsonb_build_object(
      'finalized', false,
      'reason', 'already_finalized',
      'voter_roll_finalized_at', v_election.voter_roll_finalized_at
    );
  end if;

  if v_election.status not in ('published', 'active') then
    return jsonb_build_object('finalized', false, 'reason', 'invalid_status');
  end if;

  if now() < v_election.start_date then
    return jsonb_build_object('finalized', false, 'reason', 'before_start');
  end if;

  return public._finalize_election_voter_roll_core(p_election_id, true);
end;
$$;

grant execute on function public.maybe_auto_finalize_election_voter_roll(uuid) to authenticated;
grant execute on function public.maybe_auto_finalize_election_voter_roll(uuid) to service_role;

-- Batch processor for scheduled jobs
create or replace function public.process_auto_finalize_voter_rolls()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_election_id uuid;
  v_results jsonb := '[]'::jsonb;
  v_one jsonb;
begin
  for v_election_id in
    select e.id
    from public.elections e
    where e.voter_roll_finalized_at is null
      and e.status in ('published', 'active')
      and now() >= e.start_date
  loop
    v_one := public.maybe_auto_finalize_election_voter_roll(v_election_id);
    if coalesce((v_one->>'finalized')::boolean, false) then
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'election_id', v_election_id,
          'assigned_count', v_one->'assigned_count',
          'registered_count', v_one->'registered_count'
        )
      );
    end if;
  end loop;

  return jsonb_build_object('finalized_elections', v_results);
end;
$$;

grant execute on function public.process_auto_finalize_voter_rolls() to service_role;

-- Elections with finalized roll but secret IDs not yet emailed
create or replace function public.get_elections_pending_secret_voter_id_emails()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce(
    (
      select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title))
      from public.elections e
      where e.voter_roll_finalized_at is not null
        and e.status in ('published', 'active', 'completed')
        and now() >= e.start_date
        and exists (
          select 1
          from public.voter_registrations vr
          where vr.election_id = e.id
            and vr.status = 'registered'
            and vr.secret_voter_id is not null
            and vr.secret_voter_id_emailed_at is null
        )
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.get_elections_pending_secret_voter_id_emails() to service_role;

-- Voting status: auto-finalize when poll window has started
create or replace function public.get_election_voting_status(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_election record;
  v_now timestamptz := now();
  v_auto jsonb;
begin
  v_auto := public.maybe_auto_finalize_election_voter_roll(p_election_id);

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
    'auto_finalized', coalesce((v_auto->>'finalized')::boolean, false),
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

-- Auto-finalize before verify / cast (022 logic preserved)
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
  v_secret text;
  v_settings record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public._assert_uuid_param(p_election_id, 'election_id');
  v_secret := public._assert_secret_voter_id_format(p_secret_voter_id);

  select * into v_settings from public.platform_security_settings where id = 1;

  if coalesce(v_settings.maintenance_mode, false) then
    raise exception 'Platform is in maintenance mode';
  end if;

  perform public.enforce_rate_limit(
    'vote_verify:' || v_user_id::text || ':' || p_election_id::text,
    coalesce(v_settings.rate_limit_vote_verify_per_minute, 15),
    60
  );

  perform public.maybe_auto_finalize_election_voter_roll(p_election_id);

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

  if trim(upper(v_registration.secret_voter_id)) <> v_secret then
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
  v_candidate_name text;
  v_secret text;
  v_settings record;
  v_seal text;
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

  insert into public.anonymous_ballots (election_id, candidate_id)
  values (p_election_id, p_candidate_id)
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
      'anonymous', true,
      'sealed', coalesce(v_settings.ballot_sealing_enabled, true)
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

-- Include elections that need auto-finalize before start notifications
create or replace function public.get_elections_pending_notifications()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start jsonb;
  v_end jsonb;
  v_winner jsonb;
begin
  perform public.process_auto_finalize_voter_rolls();

  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title)), '[]'::jsonb)
  into v_start
  from public.elections e
  where e.voter_roll_finalized_at is not null
    and e.voting_started_notified_at is null
    and e.status in ('published', 'active')
    and now() >= e.start_date
    and now() <= e.end_date;

  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title)), '[]'::jsonb)
  into v_end
  from public.elections e
  where e.voting_ended_notified_at is null
    and e.status in ('published', 'active', 'completed')
    and now() > e.end_date;

  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title)), '[]'::jsonb)
  into v_winner
  from public.elections e
  where e.results_locked_at is not null
    and e.winner_notified_at is null;

  return jsonb_build_object(
    'election_start', coalesce(v_start, '[]'::jsonb),
    'election_end', coalesce(v_end, '[]'::jsonb),
    'winner', coalesce(v_winner, '[]'::jsonb)
  );
end;
$$;
