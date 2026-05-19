-- Issue secret voter ID when a voter registers; open voting by schedule (no manual finalize).

create or replace function public._assign_secret_voter_id_to_registration(p_registration_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg record;
  v_new_id text;
begin
  select vr.id, vr.election_id, vr.status, vr.secret_voter_id
  into v_reg
  from public.voter_registrations vr
  where vr.id = p_registration_id
  for update of vr;

  if not found then
    raise exception 'Registration not found';
  end if;

  if v_reg.status <> 'registered' then
    return null;
  end if;

  if v_reg.secret_voter_id is not null then
    return v_reg.secret_voter_id;
  end if;

  v_new_id := public._next_secret_voter_id(v_reg.election_id);

  update public.voter_registrations
  set secret_voter_id = v_new_id,
      secret_voter_id_assigned_at = coalesce(secret_voter_id_assigned_at, now())
  where id = p_registration_id;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = '_sync_election_secret_ids_generated'
  ) then
    perform public._sync_election_secret_ids_generated(v_reg.election_id);
  end if;

  return v_new_id;
end;
$$;

grant execute on function public._assign_secret_voter_id_to_registration(uuid) to authenticated;
grant execute on function public._assign_secret_voter_id_to_registration(uuid) to service_role;

-- Voting opens when start_date is reached (secret IDs already issued on registration).
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
      and now() >= e.start_date
      and now() <= e.end_date
  );
$$;

-- At voting start: lock registration only (IDs already assigned on join).
create or replace function public.maybe_auto_finalize_election_voter_roll(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_election record;
  v_reg record;
  v_assigned integer := 0;
begin
  select e.id, e.status, e.start_date, e.end_date, e.voter_roll_finalized_at, e.registration_locked_at
  into v_election
  from public.elections e
  where e.id = p_election_id;

  if not found then
    return jsonb_build_object('finalized', false, 'reason', 'not_found');
  end if;

  if now() < v_election.start_date then
    return jsonb_build_object('finalized', false, 'reason', 'before_start');
  end if;

  if v_election.status not in ('published', 'active') then
    return jsonb_build_object('finalized', false, 'reason', 'invalid_status');
  end if;

  if v_election.voter_roll_finalized_at is not null then
    return jsonb_build_object(
      'finalized', false,
      'reason', 'already_finalized',
      'voter_roll_finalized_at', v_election.voter_roll_finalized_at
    );
  end if;

  update public.elections
  set voter_roll_finalized_at = now(),
      registration_locked_at = coalesce(registration_locked_at, now()),
      registration_lock_reason = coalesce(registration_lock_reason, 'auto_finalized'),
      updated_at = now()
  where id = p_election_id;

  for v_reg in
    select vr.id
    from public.voter_registrations vr
    where vr.election_id = p_election_id
      and vr.status = 'registered'
      and vr.secret_voter_id is null
    for update of vr
  loop
    perform public._assign_secret_voter_id_to_registration(v_reg.id);
    v_assigned := v_assigned + 1;
  end loop;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = '_sync_election_secret_ids_generated'
  ) then
    perform public._sync_election_secret_ids_generated(p_election_id);
  end if;

  return jsonb_build_object(
    'finalized', true,
    'reason', 'registration_locked',
    'assigned_count', v_assigned
  );
end;
$$;

create or replace function public.register_for_election(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_max_voters integer;
  v_registered_count integer;
  v_existing_status public.voter_registration_status;
  v_waitlist_position integer;
  v_registration_id uuid;
  v_deadline timestamptz;
  v_start_date timestamptz;
  v_role text;
  v_approval text;
  v_locked_at timestamptz;
  v_lock_reason text;
  v_election_title text;
  v_secret_id text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.promote_waitlist_slots(p_election_id, 50);

  select u.role::text, u.approval_status::text
  into v_role, v_approval
  from public.users u
  where u.id = v_user_id;

  if v_role is null then
    raise exception 'User profile not found. Complete account setup and try again.';
  end if;

  if v_role <> 'voter' then
    raise exception 'Only voter accounts can join elections. Election creators manage elections from the creator dashboard.';
  end if;

  if v_approval <> 'approved' then
    raise exception 'Your account must be approved before you can join an election.';
  end if;

  select
    e.max_voters,
    coalesce(e.registration_deadline, e.start_date),
    e.start_date,
    e.registration_locked_at,
    e.registration_lock_reason,
    e.title
  into v_max_voters, v_deadline, v_start_date, v_locked_at, v_lock_reason, v_election_title
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active');

  if v_max_voters is null then
    raise exception 'Election is not open for registration';
  end if;

  if now() >= v_start_date then
    raise exception 'Registration is closed: voting has started';
  end if;

  if v_locked_at is not null then
    raise exception 'Registration is closed: %',
      case v_lock_reason
        when 'capacity' then 'maximum voter capacity reached'
        when 'manual' then 'organizer locked registration'
        when 'admin' then 'registration locked by administrator'
        when 'finalized' then 'registration locked'
        when 'auto_finalized' then 'voting has started'
        else 'registration is locked'
      end;
  end if;

  if v_deadline < now() then
    raise exception 'Registration deadline has passed';
  end if;

  select vr.status
  into v_existing_status
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.user_id = v_user_id;

  if found then
    return jsonb_build_object(
      'duplicate', true,
      'status', v_existing_status,
      'message', 'You are already registered for this election'
    );
  end if;

  select count(*)::integer
  into v_registered_count
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  if v_registered_count < v_max_voters then
    insert into public.voter_registrations (election_id, user_id, status)
    values (p_election_id, v_user_id, 'registered')
    returning id into v_registration_id;

    v_secret_id := public._assign_secret_voter_id_to_registration(v_registration_id);

    perform public._log_waitlist_notification(
      'voter_registered',
      v_user_id,
      p_election_id,
      'Registered — ' || v_election_title,
      jsonb_build_object('election_title', v_election_title)
    );

    return jsonb_build_object(
      'duplicate', false,
      'status', 'registered',
      'registration_id', v_registration_id,
      'registered_count', v_registered_count + 1,
      'max_voters', v_max_voters,
      'secret_voter_id', v_secret_id
    );
  end if;

  select coalesce(max(vr.waitlist_position), 0) + 1
  into v_waitlist_position
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'waitlisted';

  insert into public.voter_registrations (election_id, user_id, status, waitlist_position)
  values (p_election_id, v_user_id, 'waitlisted', v_waitlist_position)
  returning id into v_registration_id;

  perform public._log_waitlist_notification(
    'waitlist_joined',
    v_user_id,
    p_election_id,
    'Added to waitlist — ' || v_election_title,
    jsonb_build_object('waitlist_position', v_waitlist_position, 'election_title', v_election_title)
  );

  return jsonb_build_object(
    'duplicate', false,
    'status', 'waitlisted',
    'registration_id', v_registration_id,
    'waitlist_position', v_waitlist_position,
    'max_voters', v_max_voters,
    'registered_count', v_registered_count
  );
end;
$$;

-- Assign secret ID when promoted from waitlist
create or replace function public.promote_waitlist_slots(
  p_election_id uuid,
  p_max_promotions integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_voters integer;
  v_registered_count integer;
  v_start_date timestamptz;
  v_promoted jsonb := '[]'::jsonb;
  v_rec record;
  v_election_title text;
  v_count integer := 0;
  v_secret_id text;
begin
  select e.max_voters, e.start_date, e.title
  into v_max_voters, v_start_date, v_election_title
  from public.elections e
  where e.id = p_election_id;

  if v_max_voters is null then
    raise exception 'Election not found';
  end if;

  if now() >= v_start_date then
    return jsonb_build_object('promoted', v_promoted, 'reason', 'voting_started');
  end if;

  p_max_promotions := greatest(1, least(coalesce(p_max_promotions, 100), 500));

  loop
    select count(*)::integer into v_registered_count
    from public.voter_registrations vr
    where vr.election_id = p_election_id
      and vr.status = 'registered';

    exit when v_registered_count >= v_max_voters;
    exit when v_count >= p_max_promotions;

    select vr.id, vr.user_id, vr.waitlist_position
    into v_rec
    from public.voter_registrations vr
    where vr.election_id = p_election_id
      and vr.status = 'waitlisted'
    order by vr.waitlist_position asc nulls last, vr.created_at asc
    limit 1;

    exit when not found;

    update public.voter_registrations
    set status = 'registered',
        waitlist_position = null
    where id = v_rec.id;

    v_secret_id := public._assign_secret_voter_id_to_registration(v_rec.id);

    perform public._log_waitlist_notification(
      'waitlist_promoted',
      v_rec.user_id,
      p_election_id,
      'Promoted from waitlist — ' || v_election_title,
      jsonb_build_object('waitlist_position', v_rec.waitlist_position, 'election_title', v_election_title)
    );

    v_promoted := v_promoted || jsonb_build_array(
      jsonb_build_object(
        'registration_id', v_rec.id,
        'user_id', v_rec.user_id,
        'previous_position', v_rec.waitlist_position,
        'secret_voter_id', v_secret_id
      )
    );

    v_count := v_count + 1;
  end loop;

  perform public._renumber_waitlist(p_election_id);

  return jsonb_build_object(
    'promoted', v_promoted,
    'promoted_count', v_count
  );
end;
$$;
