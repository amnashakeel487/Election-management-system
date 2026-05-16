-- Voter roll locking: auto-lock at capacity, block joins after lock, admin override, finalized list export

alter table public.elections
  add column if not exists registration_locked_at timestamptz,
  add column if not exists registration_lock_reason text;

comment on column public.elections.registration_lock_reason is
  'capacity | manual | admin | finalized';

-- Lock registration when registered voters reach max_voters
create or replace function public._try_auto_lock_registration(p_election_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_voters integer;
  v_registered_count integer;
begin
  select e.max_voters
  into v_max_voters
  from public.elections e
  where e.id = p_election_id
    and e.registration_locked_at is null
    and e.voter_roll_finalized_at is null
    and e.status in ('published', 'active');

  if v_max_voters is null then
    return;
  end if;

  select count(*)::integer
  into v_registered_count
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  if v_registered_count >= v_max_voters then
    update public.elections
    set registration_locked_at = now(),
        registration_lock_reason = 'capacity',
        updated_at = now()
    where id = p_election_id
      and registration_locked_at is null;
  end if;
end;
$$;

create or replace function public.trg_voter_registration_maybe_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'registered' then
    perform public._try_auto_lock_registration(NEW.election_id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists voter_registration_auto_lock on public.voter_registrations;
create trigger voter_registration_auto_lock
  after insert or update of status on public.voter_registrations
  for each row
  execute function public.trg_voter_registration_maybe_lock();

-- Creator or admin: manually lock registration before capacity
create or replace function public.lock_election_registration(
  p_election_id uuid,
  p_reason text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_locked_at timestamptz;
  v_registered_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select e.creator_id, e.registration_locked_at
  into v_creator_id, v_locked_at
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active');

  if v_creator_id is null then
    raise exception 'Election not found or not open';
  end if;

  if v_creator_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the election creator or an administrator can lock registration';
  end if;

  if v_locked_at is not null then
    return jsonb_build_object('already_locked', true, 'locked_at', v_locked_at);
  end if;

  select count(*)::integer
  into v_registered_count
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  update public.elections
  set registration_locked_at = now(),
      registration_lock_reason = coalesce(nullif(trim(p_reason), ''), 'manual'),
      updated_at = now()
  where id = p_election_id;

  perform public.log_audit_event(
    'election_registration_locked',
    jsonb_build_object(
      'reason', coalesce(nullif(trim(p_reason), ''), 'manual'),
      'registered_count', v_registered_count,
      'actor_role', case when public.is_admin() then 'admin' else 'creator' end
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'locked', true,
    'locked_at', now(),
    'reason', coalesce(nullif(trim(p_reason), ''), 'manual'),
    'registered_count', v_registered_count
  );
end;
$$;

grant execute on function public.lock_election_registration(uuid, text) to authenticated;

-- Admin override: lock or unlock registration with mandatory audit reason
create or replace function public.admin_override_registration_lock(
  p_election_id uuid,
  p_locked boolean,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registered_count integer;
  v_action text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A reason of at least 3 characters is required for admin override';
  end if;

  if not exists (
    select 1 from public.elections e where e.id = p_election_id
  ) then
    raise exception 'Election not found';
  end if;

  if exists (
    select 1 from public.elections e
    where e.id = p_election_id
      and e.voter_roll_finalized_at is not null
      and p_locked = false
  ) then
    raise exception 'Cannot unlock registration after the voter roll has been finalized';
  end if;

  select count(*)::integer
  into v_registered_count
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  if p_locked then
    update public.elections
    set registration_locked_at = now(),
        registration_lock_reason = 'admin',
        updated_at = now()
    where id = p_election_id;

    v_action := 'election_registration_locked';
  else
    update public.elections
    set registration_locked_at = null,
        registration_lock_reason = null,
        updated_at = now()
    where id = p_election_id;

    v_action := 'election_registration_unlocked';
  end if;

  perform public.log_audit_event(
    v_action,
    jsonb_build_object(
      'reason', trim(p_reason),
      'override', true,
      'registered_count', v_registered_count,
      'locked', p_locked
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'locked', p_locked,
    'registered_count', v_registered_count,
    'reason', trim(p_reason)
  );
end;
$$;

grant execute on function public.admin_override_registration_lock(uuid, boolean, text) to authenticated;

-- Finalized voter roll export (creator or admin; roll must be finalized)
create or replace function public.get_finalized_voter_roll(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_finalized_at timestamptz;
  v_title text;
  v_entries jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select e.creator_id, e.voter_roll_finalized_at, e.title
  into v_creator_id, v_finalized_at, v_title
  from public.elections e
  where e.id = p_election_id;

  if v_creator_id is null then
    raise exception 'Election not found';
  end if;

  if v_creator_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the election creator or an administrator can view the finalized voter roll';
  end if;

  if v_finalized_at is null then
    raise exception 'Voter roll has not been finalized yet';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'registration_id', vr.id,
        'user_id', vr.user_id,
        'full_name', coalesce(u.full_name, ''),
        'email', u.email,
        'secret_voter_id', vr.secret_voter_id,
        'registered_at', vr.created_at,
        'secret_id_emailed_at', vr.secret_voter_id_emailed_at,
        'voted_at', vr.voted_at
      )
      order by vr.created_at asc
    ),
    '[]'::jsonb
  )
  into v_entries
  from public.voter_registrations vr
  join public.users u on u.id = vr.user_id
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  return jsonb_build_object(
    'election_id', p_election_id,
    'title', v_title,
    'finalized_at', v_finalized_at,
    'voter_count', jsonb_array_length(v_entries),
    'entries', v_entries
  );
end;
$$;

grant execute on function public.get_finalized_voter_roll(uuid) to authenticated;

-- Block registration when locked or finalized; waitlist only before capacity lock
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
  v_role text;
  v_approval text;
  v_locked_at timestamptz;
  v_finalized_at timestamptz;
  v_lock_reason text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

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
    e.registration_locked_at,
    e.voter_roll_finalized_at,
    e.registration_lock_reason
  into v_max_voters, v_deadline, v_locked_at, v_finalized_at, v_lock_reason
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active');

  if v_max_voters is null then
    raise exception 'Election is not open for registration';
  end if;

  if v_finalized_at is not null then
    raise exception 'Registration is closed: the voter roll has been finalized';
  end if;

  if v_locked_at is not null then
    raise exception 'Registration is closed: %',
      case v_lock_reason
        when 'capacity' then 'maximum voter capacity reached'
        when 'manual' then 'organizer locked registration'
        when 'admin' then 'registration locked by administrator'
        when 'finalized' then 'voter roll finalized'
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

    return jsonb_build_object(
      'duplicate', false,
      'status', 'registered',
      'registration_id', v_registration_id,
      'registered_count', v_registered_count + 1,
      'max_voters', v_max_voters
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

-- Finalize voter roll: assign secret IDs, lock registration, audit
create or replace function public.finalize_election_voter_roll(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_finalized_at timestamptz;
  v_assigned_count integer := 0;
  v_reg record;
  v_new_id text;
  v_assignments jsonb := '[]'::jsonb;
  v_registered_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select e.creator_id, e.voter_roll_finalized_at
  into v_creator_id, v_finalized_at
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed');

  if v_creator_id is null then
    raise exception 'Election not found or not eligible for finalization';
  end if;

  if v_creator_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the election creator or an administrator can finalize the voter roll';
  end if;

  if v_finalized_at is not null then
    raise exception 'Voter roll has already been finalized';
  end if;

  select count(*)::integer
  into v_registered_count
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  update public.elections
  set voter_roll_finalized_at = now(),
      registration_locked_at = coalesce(registration_locked_at, now()),
      registration_lock_reason = coalesce(registration_lock_reason, 'finalized'),
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
      'actor_role', case when public.is_admin() then 'admin' else 'creator' end
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'election_id', p_election_id,
    'finalized_at', now(),
    'assigned_count', v_assigned_count,
    'registered_count', v_registered_count,
    'assignments', v_assignments
  );
end;
$$;

-- Backfill lock for elections already at capacity (published/active, not finalized)
update public.elections e
set registration_locked_at = coalesce(e.registration_locked_at, now()),
    registration_lock_reason = coalesce(e.registration_lock_reason, 'capacity')
where e.registration_locked_at is null
  and e.voter_roll_finalized_at is null
  and e.status in ('published', 'active')
  and (
    select count(*)::integer
    from public.voter_registrations vr
    where vr.election_id = e.id
      and vr.status = 'registered'
  ) >= e.max_voters;
