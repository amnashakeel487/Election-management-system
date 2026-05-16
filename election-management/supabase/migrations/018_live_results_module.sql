-- Live results module: turnout metrics, final results lock, vote trend

alter table public.elections
  add column if not exists results_locked_at timestamptz,
  add column if not exists results_locked_by uuid references auth.users (id) on delete set null;

create index if not exists elections_results_locked_at_idx
  on public.elections (results_locked_at)
  where results_locked_at is not null;

create or replace function public.get_election_results(p_election_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_election record;
  v_candidates jsonb;
  v_total integer;
  v_registered integer;
  v_turnout numeric;
  v_vote_trend jsonb;
  v_polling_ended boolean;
begin
  select
    e.id,
    e.title,
    e.status,
    e.real_time_results,
    e.end_date,
    e.start_date,
    e.creator_id,
    e.results_locked_at,
    e.results_locked_by
  into v_election
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed', 'archived');

  if not found then
    raise exception 'Election not found';
  end if;

  v_polling_ended := now() > v_election.end_date or v_election.status in ('completed', 'archived');

  if not (
    v_election.real_time_results = true
    or v_election.status = 'completed'
    or v_polling_ended
    or v_election.results_locked_at is not null
  ) then
    raise exception 'Results are not available for this election yet';
  end if;

  select count(*)::integer
  into v_registered
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.status = 'registered';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'candidate_id', c.id,
        'name', c.name,
        'description', c.description,
        'designation', c.designation,
        'sort_order', c.sort_order,
        'vote_count', coalesce(vc.cnt, 0)
      )
      order by coalesce(vc.cnt, 0) desc, c.sort_order asc
    ),
    '[]'::jsonb
  )
  into v_candidates
  from public.candidates c
  left join (
    select ab.candidate_id, count(*)::integer as cnt
    from public.anonymous_ballots ab
    where ab.election_id = p_election_id
    group by ab.candidate_id
  ) vc on vc.candidate_id = c.id
  where c.election_id = p_election_id;

  select coalesce(sum((item->>'vote_count')::integer), 0)
  into v_total
  from jsonb_array_elements(v_candidates) as item;

  v_turnout := case
    when v_registered > 0 then round((v_total::numeric / v_registered::numeric) * 100, 1)
    else 0
  end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'hour', h.bucket,
        'votes', h.cnt
      )
      order by h.bucket
    ),
    '[]'::jsonb
  )
  into v_vote_trend
  from (
    select
      date_trunc('hour', ab.cast_at) as bucket,
      count(*)::integer as cnt
    from public.anonymous_ballots ab
    where ab.election_id = p_election_id
      and ab.cast_at >= greatest(
        v_election.start_date,
        now() - interval '48 hours'
      )
    group by 1
  ) h;

  return jsonb_build_object(
    'election_id', v_election.id,
    'title', v_election.title,
    'status', v_election.status,
    'creator_id', v_election.creator_id,
    'total_votes', v_total,
    'registered_voters', v_registered,
    'turnout_percent', v_turnout,
    'real_time_results', v_election.real_time_results,
    'start_date', v_election.start_date,
    'end_date', v_election.end_date,
    'results_locked_at', v_election.results_locked_at,
    'polling_ended', v_polling_ended,
    'is_live', (
      v_election.real_time_results = true
      and not v_polling_ended
      and v_election.results_locked_at is null
    ),
    'candidates', v_candidates,
    'vote_trend', v_vote_trend,
    'updated_at', now()
  );
end;
$$;

grant execute on function public.get_election_results(uuid) to authenticated;

create or replace function public.lock_election_results(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_election record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select e.id, e.creator_id, e.title, e.end_date, e.status, e.results_locked_at
  into v_election
  from public.elections e
  where e.id = p_election_id
  for update of e;

  if not found then
    raise exception 'Election not found';
  end if;

  if v_election.creator_id <> v_user_id then
    raise exception 'Only the election creator can lock final results';
  end if;

  if v_election.results_locked_at is not null then
    raise exception 'Results are already locked for this election';
  end if;

  if now() <= v_election.end_date and v_election.status not in ('completed', 'archived') then
    raise exception 'Results can only be locked after the voting period ends';
  end if;

  update public.elections
  set
    results_locked_at = now(),
    results_locked_by = v_user_id,
    status = case when status = 'active' then 'completed' else status end,
    updated_at = now()
  where id = p_election_id;

  perform public.log_audit_event(
    'results_locked',
    jsonb_build_object('election_id', p_election_id, 'title', v_election.title),
    null,
    p_election_id
  );

  return public.get_election_results(p_election_id);
end;
$$;

grant execute on function public.lock_election_results(uuid) to authenticated;
