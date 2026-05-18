-- Voter registrations with waitlist support

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

create index if not exists voter_registrations_election_id_idx on public.voter_registrations (election_id);
create index if not exists voter_registrations_user_id_idx on public.voter_registrations (user_id);
create index if not exists voter_registrations_status_idx on public.voter_registrations (election_id, status);

alter table public.voter_registrations enable row level security;

create policy "Users read own registrations"
  on public.voter_registrations
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

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

-- Inserts only via register_for_election() RPC (atomic capacity check)
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
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select e.max_voters
  into v_max_voters
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active');

  if v_max_voters is null then
    raise exception 'Election is not open for registration';
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

grant execute on function public.register_for_election(uuid) to authenticated;
