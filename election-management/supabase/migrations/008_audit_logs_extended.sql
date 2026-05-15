-- Extended audit logging: login, votes, election lifecycle

alter table public.audit_logs
  add column if not exists election_id uuid references public.elections (id) on delete set null;

create index if not exists audit_logs_election_id_idx on public.audit_logs (election_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

-- Central audit writer (security definer); actor_id always auth.uid()
create or replace function public.log_audit_event(
  p_action text,
  p_details jsonb default '{}'::jsonb,
  p_target_user_id uuid default null,
  p_election_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs (actor_id, target_user_id, election_id, action, details)
  values (
    auth.uid(),
    p_target_user_id,
    p_election_id,
    p_action,
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.log_audit_event(text, jsonb, uuid, uuid) to authenticated;

-- Election create / update / publish
create or replace function public.audit_election_change()
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
      'election_created',
      jsonb_build_object(
        'title', NEW.title,
        'status', NEW.status,
        'creator_id', NEW.creator_id
      ),
      null,
      NEW.id
    );
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    v_action := case
      when OLD.status is distinct from NEW.status and NEW.status = 'published' then 'election_published'
      when OLD.status is distinct from NEW.status and NEW.status = 'active' then 'election_activated'
      else 'election_updated'
    end;

    v_details := jsonb_build_object(
      'title', NEW.title,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'max_voters', NEW.max_voters,
      'real_time_results', NEW.real_time_results,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date
    );

    if OLD.voter_roll_finalized_at is null and NEW.voter_roll_finalized_at is not null then
      perform public.log_audit_event(
        'election_voter_roll_finalized',
        jsonb_build_object('title', NEW.title),
        null,
        NEW.id
      );
    end if;

    perform public.log_audit_event(v_action, v_details, null, NEW.id);
    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists audit_elections_change on public.elections;
create trigger audit_elections_change
  after insert or update on public.elections
  for each row
  execute function public.audit_election_change();

-- Log vote when ballot is cast (extends cast_anonymous_vote)
create or replace function public.cast_anonymous_vote(
  p_election_id uuid,
  p_secret_voter_id text,
  p_candidate_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration record;
  v_ballot_id uuid;
  v_receipt text;
  v_candidate_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public._election_polling_open(p_election_id) then
    raise exception 'Voting is closed for this election';
  end if;

  select
    vr.id,
    vr.status,
    vr.secret_voter_id,
    vr.voted_at
  into v_registration
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.user_id = v_user_id
  for update of vr;

  if not found then
    raise exception 'You are not registered for this election';
  end if;

  if v_registration.status <> 'registered' then
    raise exception 'Waitlisted voters cannot vote';
  end if;

  if v_registration.secret_voter_id is null then
    raise exception 'Secret voter ID not issued';
  end if;

  if trim(upper(v_registration.secret_voter_id)) <> trim(upper(p_secret_voter_id)) then
    raise exception 'Invalid secret voter ID';
  end if;

  if v_registration.voted_at is not null then
    raise exception 'You have already voted in this election';
  end if;

  if not exists (
    select 1
    from public.candidates c
    where c.id = p_candidate_id
      and c.election_id = p_election_id
  ) then
    raise exception 'Invalid candidate for this election';
  end if;

  select c.name into v_candidate_name
  from public.candidates c
  where c.id = p_candidate_id;

  insert into public.anonymous_ballots (election_id, candidate_id)
  values (p_election_id, p_candidate_id)
  returning id into v_ballot_id;

  update public.voter_registrations
  set voted_at = now()
  where id = v_registration.id;

  v_receipt := md5(v_ballot_id::text);
  v_receipt := substring(v_receipt from 1 for 4) || '...' || substring(v_receipt from 29 for 4);

  perform public.log_audit_event(
    'vote_cast',
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'candidate_name', v_candidate_name,
      'receipt_hash', v_receipt,
      'ballot_id', v_ballot_id
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'success', true,
    'receipt_hash', v_receipt,
    'cast_at', now()
  );
end;
$$;

-- Authenticated users may write their own audit rows only via log_audit_event (actor enforced in function)
-- Keep admin direct insert for backward compatibility with approval flow
