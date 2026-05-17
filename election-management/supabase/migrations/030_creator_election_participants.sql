-- Creator participants list with voter profile fields (security definer; creators cannot read all users via RLS).

create or replace function public.get_creator_election_participants(p_election_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_creator_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select e.creator_id into v_creator_id
  from public.elections e
  where e.id = p_election_id;

  if v_creator_id is null then
    raise exception 'Election not found';
  end if;

  if v_creator_id <> v_uid and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'registration_id', vr.id,
          'user_id', vr.user_id,
          'email', u.email,
          'full_name', u.full_name,
          'status', vr.status,
          'waitlist_position', vr.waitlist_position,
          'secret_voter_id', vr.secret_voter_id,
          'secret_voter_id_assigned_at', vr.secret_voter_id_assigned_at,
          'secret_voter_id_emailed_at', vr.secret_voter_id_emailed_at,
          'voted_at', vr.voted_at,
          'created_at', vr.created_at
        )
        order by
          case vr.status
            when 'registered' then 0
            when 'waitlisted' then 1
            else 2
          end,
          vr.waitlist_position asc nulls last,
          vr.created_at asc
      )
      from public.voter_registrations vr
      join public.users u on u.id = vr.user_id
      where vr.election_id = p_election_id
        and vr.status in ('registered', 'waitlisted', 'rejected')
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.get_creator_election_participants(uuid) to authenticated;
