-- Voter registration: account eligibility + registration deadline (extends register_for_election)

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

  select e.max_voters, coalesce(e.registration_deadline, e.start_date)
  into v_max_voters, v_deadline
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active');

  if v_max_voters is null then
    raise exception 'Election is not open for registration';
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

grant execute on function public.register_for_election(uuid) to authenticated;
