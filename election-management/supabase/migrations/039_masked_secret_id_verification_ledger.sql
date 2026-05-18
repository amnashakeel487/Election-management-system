-- Public verification ledger: half-masked secret voter IDs per candidate (no voter names)

alter table public.anonymous_ballots
  add column if not exists voter_verification_mask text;

create index if not exists anonymous_ballots_election_verification_mask_idx
  on public.anonymous_ballots (election_id, candidate_id)
  where voter_verification_mask is not null;

-- First half visible, second half asterisks (e.g. POLL-AB******)
create or replace function public._mask_secret_voter_id_display(p_secret text)
returns text
language sql
immutable
parallel safe
as $$
  with norm as (
    select upper(trim(p_secret)) as t
  )
  select case
    when length(t) <= 4 then '****'
    else
      left(t, ceil(length(t)::numeric / 2)::integer)
      || repeat('*', greatest(0, length(t) - ceil(length(t)::numeric / 2)::integer))
  end
  from norm;
$$;

create or replace function public.compute_voter_verification_mask(p_secret_voter_id text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public._mask_secret_voter_id_display(
    public._assert_secret_voter_id_format(p_secret_voter_id)
  );
end;
$$;

grant execute on function public.compute_voter_verification_mask(text) to authenticated;
grant execute on function public.compute_voter_verification_mask(text) to anon;

create or replace function public.get_election_vote_verification_ledger(p_election_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_election record;
  v_rows jsonb;
  v_legacy integer;
begin
  perform public._assert_uuid_param(p_election_id, 'election_id');

  select
    e.id,
    e.status,
    e.real_time_results,
    e.end_date,
    e.results_locked_at
  into v_election
  from public.elections e
  where e.id = p_election_id
    and e.status in ('published', 'active', 'completed', 'archived');

  if not found then
    raise exception 'Election not found';
  end if;

  if not (
    v_election.real_time_results = true
    or v_election.status in ('completed', 'archived')
    or now() > v_election.end_date
    or v_election.results_locked_at is not null
  ) then
    raise exception 'Results are not available for this election yet';
  end if;

  select count(*)::integer
  into v_legacy
  from public.anonymous_ballots ab
  where ab.election_id = p_election_id
    and ab.voter_verification_mask is null;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'candidate_id', c.id,
        'candidate_name', c.name,
        'designation', c.designation,
        'vote_count', coalesce(vc.cnt, 0),
        'masked_secret_ids', coalesce(vc.masks, '[]'::jsonb)
      )
      order by coalesce(vc.cnt, 0) desc, c.sort_order asc
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.candidates c
  left join (
    select
      ab.candidate_id,
      count(*)::integer as cnt,
      jsonb_agg(ab.voter_verification_mask order by ab.cast_at asc) filter (
        where ab.voter_verification_mask is not null
      ) as masks
    from public.anonymous_ballots ab
    where ab.election_id = p_election_id
    group by ab.candidate_id
  ) vc on vc.candidate_id = c.id
  where c.election_id = p_election_id;

  return jsonb_build_object(
    'election_id', p_election_id,
    'candidates', v_rows,
    'legacy_ballots_without_mask', v_legacy,
    'mask_format', 'first_half_visible_then_asterisks'
  );
end;
$$;

grant execute on function public.get_election_vote_verification_ledger(uuid) to authenticated;
grant execute on function public.get_election_vote_verification_ledger(uuid) to anon;

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
  v_secret text;
  v_settings record;
  v_seal text;
  v_proof_hash text;
  v_verification_mask text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public._assert_uuid_param(p_election_id, 'election_id');
  perform public._assert_uuid_param(p_candidate_id, 'candidate_id');
  v_secret := public._assert_secret_voter_id_format(p_secret_voter_id);

  select * into v_settings from public.platform_security_settings where id = 1;

  if coalesce(v_settings.maintenance_mode, false) then
    raise exception 'Platform is in maintenance mode';
  end if;

  perform public.enforce_rate_limit(
    'vote_cast:' || v_user_id::text || ':' || p_election_id::text,
    coalesce(v_settings.rate_limit_vote_cast_per_minute, 5),
    60
  );

  perform public.maybe_auto_finalize_election_voter_roll(p_election_id);

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

  if trim(upper(v_registration.secret_voter_id)) <> v_secret then
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

  v_proof_hash := public._voter_vote_proof_hash(v_secret, p_election_id);
  v_verification_mask := public._mask_secret_voter_id_display(v_secret);

  insert into public.anonymous_ballots (
    election_id,
    candidate_id,
    voter_proof_hash,
    voter_verification_mask
  )
  values (p_election_id, p_candidate_id, v_proof_hash, v_verification_mask)
  returning id into v_ballot_id;

  if coalesce(v_settings.ballot_sealing_enabled, true) then
    v_seal := public._seal_ballot_choice(v_ballot_id, p_election_id, p_candidate_id);
    update public.anonymous_ballots
    set ballot_choice_seal = v_seal
    where id = v_ballot_id;
  end if;

  update public.voter_registrations
  set voted_at = now()
  where id = v_registration.id
    and voted_at is null;

  if not found then
    raise exception 'You have already voted in this election';
  end if;

  v_receipt := md5(v_ballot_id::text);
  v_receipt := substring(v_receipt from 1 for 4) || '...' || substring(v_receipt from 29 for 4);

  perform public.log_audit_event(
    'vote_cast',
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'candidate_name', v_candidate_name,
      'receipt_hash', v_receipt,
      'ballot_id', v_ballot_id,
      'anonymous', true,
      'sealed', coalesce(v_settings.ballot_sealing_enabled, true)
    ),
    null,
    p_election_id
  );

  return jsonb_build_object(
    'success', true,
    'receipt_hash', v_receipt,
    'verification_hash', v_proof_hash,
    'verification_mask', v_verification_mask,
    'cast_at', now()
  );
end;
$$;
