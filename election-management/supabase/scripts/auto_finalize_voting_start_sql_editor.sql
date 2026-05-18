-- =============================================================================
-- Auto-finalize voter roll when voting starts + assign secret IDs
-- Run in Supabase SQL Editor after fix_vote_verification_sql_editor.sql
-- Safe to re-run (CREATE OR REPLACE)
--
-- Emails: the app calls edge function ensure-election-voting-ready after finalize.
-- Deploy: supabase functions deploy ensure-election-voting-ready send-secret-voter-ids
-- =============================================================================

alter table public.elections
  add column if not exists registration_locked_at timestamptz,
  add column if not exists registration_lock_reason text,
  add column if not exists secret_voter_id_prefix text not null default 'POLL-A',
  add column if not exists voter_roll_finalized_at timestamptz;

alter table public.voter_registrations
  add column if not exists secret_voter_id text,
  add column if not exists secret_voter_id_assigned_at timestamptz,
  add column if not exists secret_voter_id_emailed_at timestamptz;

create table if not exists public.election_secret_id_sequences (
  election_id uuid primary key references public.elections (id) on delete cascade,
  next_seq integer not null default 1
);

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

grant execute on function public.finalize_election_voter_roll(uuid) to authenticated;

-- Migration 037: auto-finalize when start_date reached + set status active
create or replace function public.maybe_auto_finalize_election_voter_roll(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_election record;
  v_result jsonb;
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
    if v_election.status = 'published'
       and now() >= v_election.start_date
       and now() <= v_election.end_date then
      update public.elections
      set status = 'active',
          updated_at = now()
      where id = p_election_id
        and status = 'published';
    end if;

    return jsonb_build_object(
      'finalized', false,
      'reason', 'already_finalized',
      'voter_roll_finalized_at', v_election.voter_roll_finalized_at
    );
  end if;

  if v_election.status not in ('published', 'active') then
    return jsonb_build_object('finalized', false, 'reason', 'invalid_status', 'status', v_election.status);
  end if;

  if now() < v_election.start_date then
    return jsonb_build_object('finalized', false, 'reason', 'before_start');
  end if;

  v_result := public._finalize_election_voter_roll_core(p_election_id, true);

  if coalesce((v_result->>'finalized')::boolean, false) then
    update public.elections
    set status = 'active',
        updated_at = now()
    where id = p_election_id
      and status = 'published';
  end if;

  return v_result;
end;
$$;

grant execute on function public.maybe_auto_finalize_election_voter_roll(uuid) to authenticated;
grant execute on function public.maybe_auto_finalize_election_voter_roll(uuid) to service_role;

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

grant execute on function public.get_election_voting_status(uuid) to authenticated;
grant execute on function public.get_election_voting_status(uuid) to anon;

-- Fix elections that already passed start without finalize (run once, replace UUID)
-- select public.maybe_auto_finalize_election_voter_roll('YOUR-ELECTION-UUID-HERE');

select public.process_auto_finalize_voter_rolls() as batch_auto_finalize;
