-- Audit & transparency: categorized queries, candidate edits, dashboard RPCs

create or replace function public.audit_action_category(p_action text)
returns text
language sql
immutable
as $$
  select case
    when p_action in ('user_login', 'user_logout', 'user_signup') then 'login'
    when p_action = 'vote_cast' then 'vote'
    when p_action in ('creator_approved', 'creator_rejected') then 'approval'
    when p_action in (
      'election_created',
      'election_updated',
      'election_published',
      'election_activated',
      'election_voter_roll_finalized',
      'candidate_created',
      'candidate_updated'
    ) then 'edit'
    when p_action = 'results_locked' then 'edit'
    when p_action in ('election_registration_locked', 'election_registration_unlocked') then 'edit'
    else 'other'
  end;
$$;

-- Candidate create / update audit
create or replace function public.audit_candidate_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_details jsonb;
begin
  if TG_OP = 'INSERT' then
    perform public.log_audit_event(
      'candidate_created',
      jsonb_build_object(
        'candidate_id', NEW.id,
        'name', NEW.name,
        'election_id', NEW.election_id
      ),
      null,
      NEW.election_id
    );
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    v_details := jsonb_build_object(
      'candidate_id', NEW.id,
      'name', NEW.name,
      'changed_fields', (
        select coalesce(jsonb_agg(key), '[]'::jsonb)
        from (
          select 'name' as key where OLD.name is distinct from NEW.name
          union all
          select 'description' where OLD.description is distinct from NEW.description
          union all
          select 'designation' where OLD.designation is distinct from NEW.designation
          union all
          select 'photo_url' where OLD.photo_url is distinct from NEW.photo_url
          union all
          select 'sort_order' where OLD.sort_order is distinct from NEW.sort_order
        ) changed
      )
    );

    perform public.log_audit_event('candidate_updated', v_details, null, NEW.election_id);
    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists audit_candidates_change on public.candidates;
create trigger audit_candidates_change
  after insert or update on public.candidates
  for each row
  execute function public.audit_candidate_change();

-- Transparency summary for admin dashboard (counts + daily timeline)
create or replace function public.get_audit_transparency_summary(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  p_days := greatest(1, least(coalesce(p_days, 30), 90));
  v_since := date_trunc('day', now()) - ((p_days - 1) || ' days')::interval;

  with base as (
    select
      al.*,
      public.audit_action_category(al.action) as category,
      coalesce((al.details ->> 'override')::boolean, false) as is_override
    from public.audit_logs al
    where al.created_at >= v_since
  ),
  counts as (
    select
      count(*)::integer as total_in_range,
      count(*) filter (where created_at >= now() - interval '24 hours')::integer as total_24h,
      count(*) filter (where category = 'login')::integer as logins,
      count(*) filter (where category = 'vote')::integer as votes,
      count(*) filter (where category = 'approval')::integer as approvals,
      count(*) filter (where category = 'edit')::integer as edits,
      count(*) filter (where is_override)::integer as overrides
    from base
  ),
  timeline as (
    select
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
      count(*) filter (where category = 'login')::integer as login,
      count(*) filter (where category = 'vote')::integer as vote,
      count(*) filter (where category = 'approval')::integer as approval,
      count(*) filter (where category = 'edit')::integer as edit,
      count(*) filter (where is_override)::integer as override
    from base
    group by 1
    order by 1
  ),
  last_evt as (
    select created_at
    from public.audit_logs
    order by created_at desc
    limit 1
  )
  select jsonb_build_object(
    'days', p_days,
    'since', v_since,
    'total_in_range', (select total_in_range from counts),
    'total_24h', (select total_24h from counts),
    'logins', (select logins from counts),
    'votes', (select votes from counts),
    'approvals', (select approvals from counts),
    'edits', (select edits from counts),
    'overrides', (select overrides from counts),
    'last_event_at', (select created_at from last_evt),
    'timeline', coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'day', day,
          'login', login,
          'vote', vote,
          'approval', approval,
          'edit', edit,
          'override', override
        )
        order by day
      )
      from timeline),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_audit_transparency_summary(integer) to authenticated;

-- Filtered audit log listing with total count
create or replace function public.get_audit_logs_filtered(
  p_category text default null,
  p_override_only boolean default false,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 100,
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
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  p_limit := greatest(1, least(coalesce(p_limit, 100), 500));
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
    where (p_from is null or al.created_at >= p_from)
      and (p_to is null or al.created_at <= p_to)
      and (
        p_category is null
        or (
          p_category = 'override'
          and coalesce((al.details ->> 'override')::boolean, false)
        )
        or (
          p_category is distinct from 'override'
          and public.audit_action_category(al.action) = p_category
        )
      )
      and (
        not coalesce(p_override_only, false)
        or coalesce((al.details ->> 'override')::boolean, false)
      )
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

grant execute on function public.get_audit_logs_filtered(text, boolean, timestamptz, timestamptz, integer, integer) to authenticated;
