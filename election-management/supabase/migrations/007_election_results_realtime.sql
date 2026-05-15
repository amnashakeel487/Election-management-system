-- Live election results: aggregated RPC + realtime on anonymous_ballots

alter table public.anonymous_ballots replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'anonymous_ballots'
  ) then
    alter publication supabase_realtime add table public.anonymous_ballots;
  end if;
end;
$$;

-- Allow authenticated users to receive realtime events when results are visible
create policy "Authenticated read ballots for visible results"
  on public.anonymous_ballots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.elections e
      where e.id = election_id
        and e.status in ('published', 'active', 'completed', 'archived')
        and (
          e.real_time_results = true
          or e.status = 'completed'
          or now() > e.end_date
        )
    )
  );

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
begin
  select
    e.id,
    e.title,
    e.status,
    e.real_time_results,
    e.end_date,
    e.start_date
  into v_election
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed', 'archived');

  if not found then
    raise exception 'Election not found';
  end if;

  if not (
    v_election.real_time_results = true
    or v_election.status = 'completed'
    or now() > v_election.end_date
  ) then
    raise exception 'Results are not available for this election yet';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'candidate_id', c.id,
        'name', c.name,
        'description', c.description,
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

  return jsonb_build_object(
    'election_id', v_election.id,
    'title', v_election.title,
    'status', v_election.status,
    'total_votes', v_total,
    'real_time_results', v_election.real_time_results,
    'start_date', v_election.start_date,
    'end_date', v_election.end_date,
    'candidates', v_candidates,
    'updated_at', now()
  );
end;
$$;

grant execute on function public.get_election_results(uuid) to authenticated;
