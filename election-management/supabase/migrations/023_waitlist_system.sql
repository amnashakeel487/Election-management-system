-- Waitlist system: auto-promotion, election_participants view, notifications
-- Enum labels are added in 023_waitlist_enums.sql (must commit before this file runs).

alter table public.voter_registrations
  drop constraint if exists voter_registrations_waitlist_position_check;

alter table public.voter_registrations
  add constraint voter_registrations_waitlist_position_check check (
    (status = 'waitlisted' and waitlist_position is not null)
    or (status in ('registered', 'rejected') and waitlist_position is null)
  );

-- Alias view: approved = registered, waitlist = waitlisted
create or replace view public.election_participants as
select
  vr.id,
  vr.election_id,
  vr.user_id,
  case vr.status
    when 'registered' then 'approved'
    when 'waitlisted' then 'waitlist'
    when 'rejected' then 'rejected'
  end as status,
  vr.waitlist_position,
  vr.secret_voter_id,
  vr.secret_voter_id_assigned_at,
  vr.secret_voter_id_emailed_at,
  vr.voted_at,
  vr.created_at
from public.voter_registrations vr;

grant select on public.election_participants to authenticated;

create or replace function public._renumber_waitlist(p_election_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_pos integer := 0;
begin
  for v_rec in
    select vr.id
    from public.voter_registrations vr
    where vr.election_id = p_election_id
      and vr.status = 'waitlisted'
    order by vr.waitlist_position asc nulls last, vr.created_at asc
  loop
    v_pos := v_pos + 1;
    update public.voter_registrations
    set waitlist_position = v_pos
    where id = v_rec.id;
  end loop;
end;
$$;

create or replace function public._log_waitlist_notification(
  p_type public.notification_type,
  p_user_id uuid,
  p_election_id uuid,
  p_subject text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select u.email into v_email from public.users u where u.id = p_user_id;
  if v_email is null then
    return;
  end if;

  perform public.log_notification(
    p_type,
    v_email,
    'sent',
    p_user_id,
    p_election_id,
    p_subject,
    null,
    p_metadata
  );
end;
$$;

-- Promote up to N waitlisted voters when capacity allows (FIFO by position)
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
  v_finalized_at timestamptz;
  v_promoted jsonb := '[]'::jsonb;
  v_rec record;
  v_election_title text;
  v_slots integer;
  v_count integer := 0;
begin
  select e.max_voters, e.voter_roll_finalized_at, e.title
  into v_max_voters, v_finalized_at, v_election_title
  from public.elections e
  where e.id = p_election_id;

  if v_max_voters is null then
    raise exception 'Election not found';
  end if;

  if v_finalized_at is not null then
    return jsonb_build_object('promoted', v_promoted, 'reason', 'roll_finalized');
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
        'previous_position', v_rec.waitlist_position
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

grant execute on function public.promote_waitlist_slots(uuid, integer) to authenticated;

create or replace function public.get_election_waitlist(p_election_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_creator_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select e.creator_id into v_creator_id
  from public.elections e
  where e.id = p_election_id;

  if v_creator_id is null then
    raise exception 'Election not found';
  end if;

  if v_creator_id <> v_uid and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'registration_id', vr.id,
          'user_id', vr.user_id,
          'email', u.email,
          'full_name', u.full_name,
          'waitlist_position', vr.waitlist_position,
          'created_at', vr.created_at
        )
        order by vr.waitlist_position asc nulls last
      )
      from public.voter_registrations vr
      join public.users u on u.id = vr.user_id
      where vr.election_id = p_election_id
        and vr.status = 'waitlisted'
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.get_election_waitlist(uuid) to authenticated;

create or replace function public.promote_waitlisted_participant(p_registration_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_election_id uuid;
  v_creator_id uuid;
  v_user_id uuid;
  v_position integer;
  v_registered_count integer;
  v_max_voters integer;
  v_title text;
  v_finalized_at timestamptz;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select vr.election_id, vr.user_id, vr.waitlist_position, e.creator_id, e.max_voters, e.title, e.voter_roll_finalized_at
  into v_election_id, v_user_id, v_position, v_creator_id, v_max_voters, v_title, v_finalized_at
  from public.voter_registrations vr
  join public.elections e on e.id = vr.election_id
  where vr.id = p_registration_id
    and vr.status = 'waitlisted';

  if v_election_id is null then
    raise exception 'Waitlisted registration not found';
  end if;

  if v_creator_id <> v_uid and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if v_finalized_at is not null then
    raise exception 'Voter roll is finalized';
  end if;

  select count(*)::integer into v_registered_count
  from public.voter_registrations vr
  where vr.election_id = v_election_id
    and vr.status = 'registered';

  if v_registered_count >= v_max_voters then
    raise exception 'No open registration slots';
  end if;

  update public.voter_registrations
  set status = 'registered',
      waitlist_position = null
  where id = p_registration_id;

  perform public._renumber_waitlist(v_election_id);

  perform public._log_waitlist_notification(
    'waitlist_promoted',
    v_user_id,
    v_election_id,
    'Promoted from waitlist — ' || v_title,
    jsonb_build_object('waitlist_position', v_position, 'manual', true)
  );

  return jsonb_build_object(
    'success', true,
    'registration_id', p_registration_id,
    'user_id', v_user_id,
    'status', 'registered'
  );
end;
$$;

grant execute on function public.promote_waitlisted_participant(uuid) to authenticated;

create or replace function public.withdraw_from_election(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reg record;
  v_promote_result jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select vr.id, vr.status, vr.voted_at, vr.waitlist_position
  into v_reg
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.user_id = v_uid;

  if not found then
    raise exception 'You are not enrolled in this election';
  end if;

  if v_reg.voted_at is not null then
    raise exception 'Cannot withdraw after voting';
  end if;

  if v_reg.status = 'registered' and exists (
    select 1 from public.elections e
    where e.id = p_election_id
      and e.voter_roll_finalized_at is not null
  ) then
    raise exception 'Cannot withdraw after voter roll finalization';
  end if;

  delete from public.voter_registrations where id = v_reg.id;

  if v_reg.status = 'waitlisted' then
    perform public._renumber_waitlist(p_election_id);
    return jsonb_build_object('withdrawn', true, 'was_waitlisted', true);
  end if;

  v_promote_result := public.promote_waitlist_slots(p_election_id, 1);

  return jsonb_build_object(
    'withdrawn', true,
    'was_registered', true,
    'auto_promoted', v_promote_result
  );
end;
$$;

grant execute on function public.withdraw_from_election(uuid) to authenticated;

create or replace function public.reject_election_participant(
  p_registration_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_election_id uuid;
  v_creator_id uuid;
  v_user_id uuid;
  v_status public.voter_registration_status;
  v_was_registered boolean;
  v_promote jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select vr.election_id, vr.user_id, vr.status, e.creator_id
  into v_election_id, v_user_id, v_status, v_creator_id
  from public.voter_registrations vr
  join public.elections e on e.id = vr.election_id
  where vr.id = p_registration_id;

  if v_election_id is null then
    raise exception 'Registration not found';
  end if;

  if v_creator_id <> v_uid and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  v_was_registered := v_status = 'registered';

  update public.voter_registrations
  set status = 'rejected',
      waitlist_position = null
  where id = p_registration_id;

  if v_status = 'waitlisted' then
    perform public._renumber_waitlist(v_election_id);
  elsif v_was_registered then
    v_promote := public.promote_waitlist_slots(v_election_id, 1);
  end if;

  return jsonb_build_object(
    'success', true,
    'status', 'rejected',
    'auto_promoted', coalesce(v_promote, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.reject_election_participant(uuid, text) to authenticated;

-- Patch register_for_election: try auto-promote before join; log waitlist notification
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
  v_election_title text;
  v_promote jsonb;
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
    e.registration_locked_at,
    e.voter_roll_finalized_at,
    e.registration_lock_reason,
    e.title
  into v_max_voters, v_deadline, v_locked_at, v_finalized_at, v_lock_reason, v_election_title
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
