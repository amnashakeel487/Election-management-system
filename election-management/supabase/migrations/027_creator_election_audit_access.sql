-- Allow election creators to read audit logs for elections they own (detail page).

create or replace function public.get_creator_election_audit_logs(
  p_election_id uuid,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_logs jsonb;
  v_total integer;
begin
  if p_election_id is null then
    raise exception 'Election id is required';
  end if;

  if not exists (
    select 1
    from public.elections e
    where e.id = p_election_id
      and (e.creator_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'You do not have access to this election';
  end if;

  p_limit := greatest(1, least(coalesce(p_limit, 50), 200));
  p_offset := greatest(0, coalesce(p_offset, 0));

  with filtered as (
    select
      al.id,
      al.actor_id,
      al.target_user_id,
      al.election_id,
      al.action,
      al.details,
      al.created_at,
      public.audit_action_category(al.action) as category,
      coalesce((al.details ->> 'override')::boolean, false) as is_override,
      actor.email as actor_email,
      target.email as target_email,
      e.title as election_title
    from public.audit_logs al
    left join public.users actor on actor.id = al.actor_id
    left join public.users target on target.id = al.target_user_id
    left join public.elections e on e.id = al.election_id
    where al.election_id = p_election_id
  ),
  counted as (
    select count(*)::integer as total from filtered
  )
  select
    (select total from counted),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', f.id,
            'actor_id', f.actor_id,
            'target_user_id', f.target_user_id,
            'election_id', f.election_id,
            'action', f.action,
            'details', f.details,
            'created_at', f.created_at,
            'category', f.category,
            'is_override', f.is_override,
            'actor', case when f.actor_email is not null then jsonb_build_object('email', f.actor_email) end,
            'target', case when f.target_email is not null then jsonb_build_object('email', f.target_email) end,
            'election', case when f.election_title is not null then jsonb_build_object('title', f.election_title) end
          )
          order by f.created_at desc
        )
        from (
          select * from filtered
          order by created_at desc
          limit p_limit
          offset p_offset
        ) f
      ),
      '[]'::jsonb
    )
  into v_total, v_logs;

  return jsonb_build_object(
    'total', coalesce(v_total, 0),
    'limit', p_limit,
    'offset', p_offset,
    'logs', coalesce(v_logs, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_creator_election_audit_logs(uuid, integer, integer) to authenticated;
