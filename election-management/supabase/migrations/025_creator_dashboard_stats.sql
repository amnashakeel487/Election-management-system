-- Creator dashboard overview aggregates (participants, votes, waitlist, turnout)

create or replace function public.get_creator_dashboard_stats(p_creator_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_uid is distinct from p_creator_id
     and not exists (
       select 1 from public.users u where u.id = v_uid and u.role = 'admin'
     ) then
    raise exception 'Not allowed';
  end if;

  return (
    with creator_elections as (
      select e.*
      from public.elections e
      where e.creator_id = p_creator_id
    ),
    reg as (
      select
        count(*) filter (where vr.status = 'registered')::integer as total_registered,
        count(*) filter (where vr.status = 'waitlisted')::integer as waitlist_count,
        count(*) filter (
          where vr.status = 'registered'
            and vr.created_at >= now() - interval '7 days'
        )::integer as registrations_7d
      from public.voter_registrations vr
      inner join creator_elections e on e.id = vr.election_id
    ),
    ballots as (
      select
        count(*)::integer as total_votes,
        count(*) filter (where ab.cast_at >= now() - interval '24 hours')::integer as votes_24h
      from public.anonymous_ballots ab
      inner join creator_elections e on e.id = ab.election_id
    )
    select jsonb_build_object(
      'total_elections', (select count(*)::integer from creator_elections),
      'active_elections', (
        select count(*)::integer
        from creator_elections e
        where e.status in ('published', 'active')
          and now() >= e.start_date
          and now() <= e.end_date
      ),
      'elections_created_30d', (
        select count(*)::integer
        from creator_elections e
        where e.created_at >= now() - interval '30 days'
      ),
      'total_participants', (select total_registered from reg),
      'total_votes', (select total_votes from ballots),
      'votes_24h', (select votes_24h from ballots),
      'waitlist_count', (select waitlist_count from reg),
      'registrations_7d', (select registrations_7d from reg),
      'avg_turnout_percent', (
        select coalesce(
          round(
            (select total_votes from ballots)::numeric
            / nullif((select total_registered from reg), 0)
            * 100
          ),
          0
        )::integer
      )
    )
  );
end;
$$;

grant execute on function public.get_creator_dashboard_stats(uuid) to authenticated;
