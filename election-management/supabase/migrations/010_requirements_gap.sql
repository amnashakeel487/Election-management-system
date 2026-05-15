-- Requirements gap: creator profile fields, election category, public landing, registration deadline

alter table public.users
  add column if not exists phone text,
  add column if not exists organization text,
  add column if not exists election_purpose text,
  add column if not exists rejection_reason text;

alter table public.elections
  add column if not exists category text,
  add column if not exists registration_deadline timestamptz;

update public.elections
set registration_deadline = start_date
where registration_deadline is null;

alter table public.candidates
  add column if not exists designation text,
  add column if not exists photo_url text;

-- Public landing page (anon + authenticated)
create policy "Public read published elections"
  on public.elections
  for select
  to anon, authenticated
  using (status in ('published', 'active', 'completed'));

create policy "Public read candidates for public elections"
  on public.candidates
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.elections e
      where e.id = election_id
        and e.status in ('published', 'active', 'completed')
    )
  );

-- Platform stats for landing page
create or replace function public.get_platform_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_votes', (select count(*)::integer from public.anonymous_ballots),
    'active_elections', (
      select count(*)::integer
      from public.elections
      where status in ('published', 'active')
    ),
    'verified_voters', (select count(*)::integer from public.users where role = 'voter')
  );
$$;

grant execute on function public.get_platform_stats() to anon, authenticated;

-- Signup profile from auth metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.user_role;
  selected_status public.approval_status;
begin
  selected_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'voter'::public.user_role
  );

  selected_status := case
    when selected_role = 'election_creator'::public.user_role then 'pending'::public.approval_status
    else 'approved'::public.approval_status
  end;

  insert into public.users (
    id, email, role, approval_status,
    full_name, phone, organization, election_purpose
  )
  values (
    new.id,
    new.email,
    selected_role,
    selected_status,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'organization'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'election_purpose'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        approval_status = excluded.approval_status,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        phone = coalesce(excluded.phone, public.users.phone),
        organization = coalesce(excluded.organization, public.users.organization),
        election_purpose = coalesce(excluded.election_purpose, public.users.election_purpose),
        updated_at = now();

  return new;
end;
$$;

-- Registration respects registration_deadline (defaults to start_date)
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
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
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
    'max_voters', v_max_voters
  );
end;
$$;
