-- Secret voter IDs: POLL-A-0001 format, unique per election, assigned on roll finalization

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

-- Internal: allocate next secret ID for an election (must be called inside a transaction)
create or replace function public._next_secret_voter_id(p_election_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_seq integer;
  v_id text;
begin
  select e.secret_voter_id_prefix
  into v_prefix
  from public.elections e
  where e.id = p_election_id;

  if v_prefix is null then
    raise exception 'Election not found';
  end if;

  insert into public.election_secret_id_sequences (election_id, next_seq)
  values (p_election_id, 2)
  on conflict (election_id) do update
    set next_seq = public.election_secret_id_sequences.next_seq + 1
  returning next_seq - 1 into v_seq;

  v_id := v_prefix || '-' || lpad(v_seq::text, 4, '0');
  return v_id;
end;
$$;

-- Creator finalizes voter roll: assigns secret IDs to all registered voters
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
    raise exception 'Only the election creator can finalize the voter roll';
  end if;

  if v_finalized_at is not null then
    raise exception 'Voter roll has already been finalized';
  end if;

  update public.elections
  set voter_roll_finalized_at = now(),
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

  return jsonb_build_object(
    'election_id', p_election_id,
    'finalized_at', now(),
    'assigned_count', v_assigned_count,
    'assignments', v_assignments
  );
end;
$$;

grant execute on function public.finalize_election_voter_roll(uuid) to authenticated;

-- Voters may read their own secret_voter_id (UI masks it client-side)
-- Existing select policies already cover voter_registrations for own rows
