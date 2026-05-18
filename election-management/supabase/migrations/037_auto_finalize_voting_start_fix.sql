-- Auto-finalize at voting start: activate published elections + ensure RPC grants

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
