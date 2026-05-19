-- Roll readiness flags + status RPC for auto-finalize at voting start

alter table public.elections
  add column if not exists secret_ids_generated boolean not null default false;

comment on column public.elections.secret_ids_generated is
  'True after all registered voters received secret_voter_id at finalization';

create or replace function public._sync_election_secret_ids_generated(p_election_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registered integer;
  v_with_secret integer;
begin
  select count(*)::integer
  into v_registered
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  select count(*)::integer
  into v_with_secret
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered'
    and vr.secret_voter_id is not null;

  update public.elections
  set secret_ids_generated = (
      voter_roll_finalized_at is not null
      and v_registered > 0
      and v_registered = v_with_secret
    ),
    updated_at = now()
  where id = p_election_id;
end;
$$;

create or replace function public.get_election_roll_readiness(p_election_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_election record;
  v_registered integer;
  v_with_secret integer;
  v_emails_pending integer;
begin
  select
    e.id,
    e.title,
    e.status,
    e.start_date,
    e.end_date,
    e.voter_roll_finalized_at,
    e.registration_locked_at,
    e.secret_ids_generated
  into v_election
  from public.elections e
  where e.id = p_election_id;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select count(*)::integer
  into v_registered
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  select count(*)::integer
  into v_with_secret
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered'
    and vr.secret_voter_id is not null;

  select count(*)::integer
  into v_emails_pending
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered'
    and vr.secret_voter_id is not null
    and vr.secret_voter_id_emailed_at is null;

  perform public._sync_election_secret_ids_generated(p_election_id);

  select e.secret_ids_generated
  into v_election.secret_ids_generated
  from public.elections e
  where e.id = p_election_id;

  return jsonb_build_object(
    'found', true,
    'election_id', v_election.id,
    'status', v_election.status,
    'voter_roll_finalized', v_election.voter_roll_finalized_at is not null,
    'voter_roll_finalized_at', v_election.voter_roll_finalized_at,
    'registration_locked', v_election.registration_locked_at is not null,
    'secret_ids_generated', coalesce(v_election.secret_ids_generated, false),
    'registered_count', v_registered,
    'with_secret_count', v_with_secret,
    'emails_pending', v_emails_pending,
    'voting_window_started', now() >= v_election.start_date,
    'voting_window_open',
      v_election.voter_roll_finalized_at is not null
      and now() >= v_election.start_date
      and now() <= v_election.end_date
      and v_election.status in ('published', 'active'),
    'ready_for_voting',
      v_election.voter_roll_finalized_at is not null
      and coalesce(v_election.secret_ids_generated, false)
      and v_registered = v_with_secret
  );
end;
$$;

grant execute on function public.get_election_roll_readiness(uuid) to authenticated;
grant execute on function public.get_election_roll_readiness(uuid) to service_role;

-- Patch finalize core to set secret_ids_generated
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
    perform public._sync_election_secret_ids_generated(p_election_id);
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

  perform public._sync_election_secret_ids_generated(p_election_id);

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
    'secret_ids_generated', true,
    'assignments', v_assignments
  );
end;
$$;
