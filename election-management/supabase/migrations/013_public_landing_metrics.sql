-- Aggregate ballot + registration counts for the public landing page (anon cannot SELECT anonymous_ballots)

create or replace function public.get_public_landing_election_metrics()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'election_id', e.id,
          'ballots_cast', (
            select count(*)::integer
            from public.anonymous_ballots ab
            where ab.election_id = e.id
          ),
          'registered', (
            select count(*)::integer
            from public.voter_registrations vr
            where vr.election_id = e.id
              and vr.status = 'registered'
          )
        )
      )
      from public.elections e
      where e.status in ('published', 'active', 'completed')
    ),
    '[]'::jsonb
  );
$$;

grant execute on function public.get_public_landing_election_metrics() to anon, authenticated;
