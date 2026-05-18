-- Backfill masked voter IDs on ballots cast before voter_verification_mask existed.
-- Safe when all votes in an election went to a single candidate (cannot split across candidates).

create or replace function public.backfill_ballot_verification_masks(p_election_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_election_id uuid;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_ballot record;
  v_masks text[];
  v_idx integer;
begin
  for v_election_id in
    select distinct ab.election_id
    from public.anonymous_ballots ab
    where ab.voter_verification_mask is null
      and (p_election_id is null or ab.election_id = p_election_id)
  loop
    -- Only backfill when every ballot is for one candidate
    if (
      select count(distinct ab.candidate_id)
      from public.anonymous_ballots ab
      where ab.election_id = v_election_id
    ) <> 1 then
      v_skipped := v_skipped + 1;
      v_details := v_details || jsonb_build_array(
        jsonb_build_object('election_id', v_election_id, 'status', 'skipped', 'reason', 'multiple_candidates')
      );
      continue;
    end if;

    if (
      select count(*)
      from public.anonymous_ballots ab
      where ab.election_id = v_election_id
        and ab.voter_verification_mask is null
    ) <> (
      select count(*)
      from public.voter_registrations vr
      where vr.election_id = v_election_id
        and vr.voted_at is not null
        and vr.secret_voter_id is not null
    ) then
      v_skipped := v_skipped + 1;
      v_details := v_details || jsonb_build_array(
        jsonb_build_object('election_id', v_election_id, 'status', 'skipped', 'reason', 'ballot_voter_count_mismatch')
      );
      continue;
    end if;

    select coalesce(
      array_agg(public._mask_secret_voter_id_display(vr.secret_voter_id) order by vr.voted_at asc),
      '{}'::text[]
    )
    into v_masks
    from public.voter_registrations vr
    where vr.election_id = v_election_id
      and vr.voted_at is not null
      and vr.secret_voter_id is not null;

    v_idx := 1;
    for v_ballot in
      select ab.id
      from public.anonymous_ballots ab
      where ab.election_id = v_election_id
        and ab.voter_verification_mask is null
      order by ab.cast_at asc
    loop
      if v_idx > coalesce(array_length(v_masks, 1), 0) then
        exit;
      end if;

      update public.anonymous_ballots
      set voter_verification_mask = v_masks[v_idx]
      where id = v_ballot.id;

      v_updated := v_updated + 1;
      v_idx := v_idx + 1;
    end loop;

    v_details := v_details || jsonb_build_array(
      jsonb_build_object('election_id', v_election_id, 'status', 'updated', 'count', v_idx - 1)
    );
  end loop;

  return jsonb_build_object(
    'updated_ballots', v_updated,
    'skipped_elections', v_skipped,
    'details', v_details
  );
end;
$$;

grant execute on function public.backfill_ballot_verification_masks(uuid) to service_role;

-- Run once for all elections that qualify
select public.backfill_ballot_verification_masks(null);

-- Auto-attempt backfill when loading results (safe single-candidate elections only)
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

  perform public.backfill_ballot_verification_masks(p_election_id);

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
    'mask_format', 'last_four_asterisks'
  );
end;
$$;

grant execute on function public.get_election_vote_verification_ledger(uuid) to authenticated;
grant execute on function public.get_election_vote_verification_ledger(uuid) to anon;

-- Re-apply cast so new votes always store mask (040 format)
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
      'verification_mask', v_verification_mask,
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
