-- Secret ID generation: per-poll prefix, POLL-A-0001 format, masking helper, voter email resend RPC

-- Normalize and validate poll prefix (each election = one poll with its own ID sequence)
create or replace function public.normalize_secret_voter_id_prefix(p_prefix text)
returns text
language plpgsql
immutable
as $$
declare
  v_norm text;
begin
  v_norm := upper(trim(coalesce(p_prefix, '')));
  v_norm := regexp_replace(v_norm, '[^A-Z0-9-]', '', 'g');
  v_norm := regexp_replace(v_norm, '-+', '-', 'g');
  v_norm := trim(both '-' from v_norm);
  if v_norm = '' then
    v_norm := 'POLL-A';
  end if;
  if length(v_norm) > 20 then
    v_norm := left(v_norm, 20);
  end if;
  if v_norm !~ '^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$' and v_norm !~ '^[A-Z0-9]$' then
    raise exception 'Invalid secret ID prefix. Use letters, numbers, and hyphens (e.g. POLL-A).';
  end if;
  return v_norm;
end;
$$;

create or replace function public.format_secret_voter_id(p_prefix text, p_seq integer)
returns text
language sql
immutable
as $$
  select public.normalize_secret_voter_id_prefix(p_prefix) || '-' || lpad(greatest(p_seq, 0)::text, 4, '0');
$$;

-- Mask for UI: POLL-A-7821 → ****7821
create or replace function public.mask_secret_voter_id(p_secret_voter_id text)
returns text
language sql
immutable
as $$
  select case
    when p_secret_voter_id is null or length(trim(p_secret_voter_id)) = 0 then '****'
    when length(trim(p_secret_voter_id)) <= 4 then '****'
    else '****' || right(trim(p_secret_voter_id), 4)
  end;
$$;

grant execute on function public.mask_secret_voter_id(text) to authenticated;

-- Allocate next unique ID for this poll (election); sequences are per election
create or replace function public._next_secret_voter_id(p_election_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_seq integer;
  v_id text;
  v_attempts integer := 0;
begin
  select public.normalize_secret_voter_id_prefix(e.secret_voter_id_prefix)
  into v_prefix
  from public.elections e
  where e.id = p_election_id;

  if v_prefix is null then
    raise exception 'Election not found';
  end if;

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 5 then
      raise exception 'Could not allocate a unique secret voter ID';
    end if;

    insert into public.election_secret_id_sequences (election_id, next_seq)
    values (p_election_id, 2)
    on conflict (election_id) do update
      set next_seq = public.election_secret_id_sequences.next_seq + 1
    returning next_seq - 1 into v_seq;

    v_id := public.format_secret_voter_id(v_prefix, v_seq);

    if not exists (
      select 1
      from public.voter_registrations vr
      where vr.election_id = p_election_id
        and vr.secret_voter_id = v_id
    ) then
      return v_id;
    end if;
  end loop;
end;
$$;

-- Persist normalized prefix on draft updates
create or replace function public.normalize_election_secret_prefix()
returns trigger
language plpgsql
as $$
begin
  NEW.secret_voter_id_prefix := public.normalize_secret_voter_id_prefix(NEW.secret_voter_id_prefix);
  return NEW;
end;
$$;

drop trigger if exists elections_normalize_secret_prefix on public.elections;
create trigger elections_normalize_secret_prefix
  before insert or update of secret_voter_id_prefix on public.elections
  for each row
  execute function public.normalize_election_secret_prefix();

-- Backfill existing prefixes
update public.elections e
set secret_voter_id_prefix = public.normalize_secret_voter_id_prefix(e.secret_voter_id_prefix);

-- Use shared mask in verify RPC
create or replace function public.verify_secret_voter_for_voting(
  p_election_id uuid,
  p_secret_voter_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration record;
  v_polling_open boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_polling_open := public._election_polling_open(p_election_id);

  select
    vr.id,
    vr.status,
    vr.secret_voter_id,
    vr.voted_at
  into v_registration
  from public.voter_registrations vr
  where vr.election_id = p_election_id
    and vr.user_id = v_user_id;

  if not found then
    return jsonb_build_object(
      'valid', false,
      'code', 'not_registered',
      'message', 'You are not registered for this election'
    );
  end if;

  if v_registration.status <> 'registered' then
    return jsonb_build_object(
      'valid', false,
      'code', 'not_eligible',
      'message', 'Only registered voters (not waitlisted) may vote'
    );
  end if;

  if v_registration.secret_voter_id is null then
    return jsonb_build_object(
      'valid', false,
      'code', 'no_secret_id',
      'message', 'Secret voter ID has not been issued yet'
    );
  end if;

  if v_registration.voted_at is not null then
    return jsonb_build_object(
      'valid', false,
      'code', 'already_voted',
      'message', 'You have already cast your vote in this election',
      'voted_at', v_registration.voted_at
    );
  end if;

  if not v_polling_open then
    return jsonb_build_object(
      'valid', false,
      'code', 'polling_closed',
      'message', 'Voting is closed for this election'
    );
  end if;

  if trim(upper(v_registration.secret_voter_id)) <> trim(upper(p_secret_voter_id)) then
    return jsonb_build_object(
      'valid', false,
      'code', 'invalid_secret_id',
      'message', 'Secret voter ID does not match our records'
    );
  end if;

  return jsonb_build_object(
    'valid', true,
    'registration_id', v_registration.id,
    'masked_secret_id', public.mask_secret_voter_id(v_registration.secret_voter_id)
  );
end;
$$;

-- Preview format for creator UI (next ID without consuming sequence)
create or replace function public.preview_secret_voter_id_format(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_next_seq integer;
  v_creator_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select e.creator_id, public.normalize_secret_voter_id_prefix(e.secret_voter_id_prefix)
  into v_creator_id, v_prefix
  from public.elections e
  where e.id = p_election_id;

  if v_creator_id is null then
    raise exception 'Election not found';
  end if;

  if v_creator_id <> auth.uid() and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select coalesce(s.next_seq, 1)
  into v_next_seq
  from public.election_secret_id_sequences s
  where s.election_id = p_election_id;

  if v_next_seq is null then
    v_next_seq := 1;
  end if;

  return jsonb_build_object(
    'prefix', v_prefix,
    'example_first', public.format_secret_voter_id(v_prefix, v_next_seq),
    'example_last', public.format_secret_voter_id(v_prefix, greatest(v_next_seq, 1) + 99),
    'mask_example', public.mask_secret_voter_id(public.format_secret_voter_id(v_prefix, 7821))
  );
end;
$$;

grant execute on function public.preview_secret_voter_id_format(uuid) to authenticated;
