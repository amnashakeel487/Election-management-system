-- Live elections overview + monthly vote trend for creator dashboard

create or replace function public.get_creator_dashboard_live(p_creator_id uuid)
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
    live_rows as (
      select
        e.id as election_id,
        e.title,
        e.end_date,
        e.max_voters,
        coalesce(reg.registered, 0)::integer as registered,
        coalesce(bal.ballots_cast, 0)::integer as ballots_cast
      from creator_elections e
      left join lateral (
        select count(*)::integer as registered
        from public.voter_registrations vr
        where vr.election_id = e.id and vr.status = 'registered'
      ) reg on true
      left join lateral (
        select count(*)::integer as ballots_cast
        from public.anonymous_ballots ab
        where ab.election_id = e.id
      ) bal on true
      where e.status in ('published', 'active')
        and now() >= e.start_date
        and now() <= e.end_date
      order by e.end_date asc
      limit 6
    ),
    status_counts as (
      select
        count(*) filter (
          where e.status = 'draft'
        )::integer as draft,
        count(*) filter (
          where e.status not in ('draft', 'archived')
            and (e.status = 'completed' or now() > e.end_date)
        )::integer as completed,
        count(*) filter (
          where e.status not in ('draft', 'archived')
            and now() < e.start_date
        )::integer as upcoming,
        count(*) filter (
          where e.status in ('published', 'active')
            and now() >= e.start_date
            and now() <= e.end_date
        )::integer as active
      from creator_elections e
    ),
    monthly as (
      select
        to_char(date_trunc('month', ab.cast_at), 'Mon') as month_label,
        date_trunc('month', ab.cast_at) as month_start,
        count(*)::integer as vote_count
      from public.anonymous_ballots ab
      inner join creator_elections e on e.id = ab.election_id
      where ab.cast_at >= date_trunc('month', now()) - interval '7 months'
      group by 1, 2
      order by month_start
    )
    select jsonb_build_object(
      'live_elections', coalesce(
        (select jsonb_agg(
          jsonb_build_object(
            'election_id', lr.election_id,
            'title', lr.title,
            'end_date', lr.end_date,
            'max_voters', lr.max_voters,
            'registered', lr.registered,
            'ballots_cast', lr.ballots_cast,
            'turnout_percent', case
              when lr.max_voters > 0 then least(
                100,
                round(lr.ballots_cast::numeric / lr.max_voters * 100)
              )::integer
              when lr.registered > 0 then least(
                100,
                round(lr.ballots_cast::numeric / lr.registered * 100)
              )::integer
              else 0
            end
          )
          order by lr.end_date
        ) from live_rows lr),
        '[]'::jsonb
      ),
      'status_active', (select active from status_counts),
      'status_upcoming', (select upcoming from status_counts),
      'status_completed', (select completed from status_counts),
      'status_draft', (select draft from status_counts),
      'monthly_votes', coalesce(
        (select jsonb_agg(
          jsonb_build_object(
            'label', m.month_label,
            'count', m.vote_count
          )
          order by m.month_start
        ) from monthly m),
        '[]'::jsonb
      )
    )
  );
end;
$$;

grant execute on function public.get_creator_dashboard_live(uuid) to authenticated;
