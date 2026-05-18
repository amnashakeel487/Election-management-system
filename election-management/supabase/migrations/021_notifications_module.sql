-- Notification module: delivery log + election milestone tracking

do $$ begin
  create type public.notification_type as enum (
    'email_verification',
    'creator_approval',
    'creator_rejection',
    'secret_voter_id',
    'election_start',
    'election_end',
    'winner'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_status as enum ('pending', 'sent', 'failed', 'skipped');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_type public.notification_type not null,
  recipient_email text not null,
  recipient_user_id uuid references public.users (id) on delete set null,
  election_id uuid references public.elections (id) on delete set null,
  subject text,
  status public.notification_status not null default 'pending',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_logs_created_at_idx
  on public.notification_logs (created_at desc);

create index if not exists notification_logs_type_idx
  on public.notification_logs (notification_type);

create index if not exists notification_logs_election_id_idx
  on public.notification_logs (election_id);

create index if not exists notification_logs_recipient_user_id_idx
  on public.notification_logs (recipient_user_id);

alter table public.elections
  add column if not exists voting_started_notified_at timestamptz,
  add column if not exists voting_ended_notified_at timestamptz,
  add column if not exists winner_notified_at timestamptz;

alter table public.notification_logs enable row level security;

create policy "Admins read notification logs"
  on public.notification_logs
  for select
  to authenticated
  using (public.is_admin());

create policy "Service role manages notification logs"
  on public.notification_logs
  for all
  to service_role
  using (true)
  with check (true);

-- Insert log entry (edge functions via service role)
create or replace function public.log_notification(
  p_type public.notification_type,
  p_recipient_email text,
  p_status public.notification_status,
  p_recipient_user_id uuid default null,
  p_election_id uuid default null,
  p_subject text default null,
  p_error_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notification_logs (
    notification_type,
    recipient_email,
    recipient_user_id,
    election_id,
    subject,
    status,
    error_message,
    metadata,
    sent_at
  )
  values (
    p_type,
    lower(trim(p_recipient_email)),
    p_recipient_user_id,
    p_election_id,
    p_subject,
    p_status,
    p_error_message,
    coalesce(p_metadata, '{}'::jsonb),
    case when p_status = 'sent' then now() else null end
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.log_notification(public.notification_type, text, public.notification_status, uuid, uuid, text, text, jsonb) to service_role;

-- Registered voters with email for an election
create or replace function public.get_election_voter_recipients(p_election_id uuid)
returns table (
  registration_id uuid,
  user_id uuid,
  email text,
  full_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    vr.id as registration_id,
    vr.user_id,
    u.email,
    u.full_name
  from public.voter_registrations vr
  join public.users u on u.id = vr.user_id
  where vr.election_id = p_election_id
    and vr.status = 'registered'
    and u.email is not null;
$$;

grant execute on function public.get_election_voter_recipients(uuid) to service_role;

-- Elections needing milestone emails (for scheduled processor)
create or replace function public.get_elections_pending_notifications()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start jsonb;
  v_end jsonb;
  v_winner jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title)), '[]'::jsonb)
  into v_start
  from public.elections e
  where e.voter_roll_finalized_at is not null
    and e.voting_started_notified_at is null
    and e.status in ('published', 'active')
    and now() >= e.start_date
    and now() <= e.end_date;

  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title)), '[]'::jsonb)
  into v_end
  from public.elections e
  where e.voting_ended_notified_at is null
    and e.status in ('published', 'active', 'completed')
    and now() > e.end_date;

  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title)), '[]'::jsonb)
  into v_winner
  from public.elections e
  where e.results_locked_at is not null
    and e.winner_notified_at is null;

  return jsonb_build_object(
    'election_start', coalesce(v_start, '[]'::jsonb),
    'election_end', coalesce(v_end, '[]'::jsonb),
    'winner', coalesce(v_winner, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_elections_pending_notifications() to service_role;

create or replace function public.mark_election_notification_sent(
  p_election_id uuid,
  p_milestone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_milestone = 'election_start' then
    update public.elections set voting_started_notified_at = now() where id = p_election_id;
  elsif p_milestone = 'election_end' then
    update public.elections set voting_ended_notified_at = now() where id = p_election_id;
  elsif p_milestone = 'winner' then
    update public.elections set winner_notified_at = now() where id = p_election_id;
  else
    raise exception 'Unknown milestone: %', p_milestone;
  end if;
end;
$$;

grant execute on function public.mark_election_notification_sent(uuid, text) to service_role;

-- Admin dashboard summary
create or replace function public.get_notification_summary(p_days integer default 30)
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
  v_since := now() - (p_days || ' days')::interval;

  select jsonb_build_object(
    'total', count(*)::integer,
    'sent', count(*) filter (where status = 'sent')::integer,
    'failed', count(*) filter (where status = 'failed')::integer,
    'by_type', coalesce(
      (
        select jsonb_object_agg(notification_type::text, cnt)
        from (
          select notification_type, count(*)::integer as cnt
          from public.notification_logs
          where created_at >= v_since
          group by notification_type
        ) t
      ),
      '{}'::jsonb
    )
  )
  into v_result
  from public.notification_logs
  where created_at >= v_since;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

grant execute on function public.get_notification_summary(integer) to authenticated;
