-- Security module: RLS hardening, ballot integrity seals, rate limiting, admin posture

-- Supabase installs pgcrypto in the extensions schema
create extension if not exists pgcrypto with schema extensions;

-- Singleton platform security configuration (admin-managed)
create table if not exists public.platform_security_settings (
  id integer primary key default 1 check (id = 1),
  captcha_enabled boolean not null default true,
  captcha_provider text not null default 'turnstile' check (captcha_provider in ('checkbox', 'turnstile')),
  rate_limit_auth_per_minute integer not null default 30,
  rate_limit_vote_verify_per_minute integer not null default 15,
  rate_limit_vote_cast_per_minute integer not null default 5,
  ballot_sealing_enabled boolean not null default true,
  maintenance_mode boolean not null default false,
  vote_integrity_secret text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null
);

insert into public.platform_security_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.platform_security_settings enable row level security;

create policy "Admins read security settings"
  on public.platform_security_settings
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins update security settings"
  on public.platform_security_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Rate limit buckets (auth, vote verify, vote cast)
create table if not exists public.security_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null,
  attempt_count integer not null default 0
);

alter table public.security_rate_limits enable row level security;

-- No client policies: only security definer functions touch this table

create or replace function public._vote_integrity_secret()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(trim(s.vote_integrity_secret), ''),
    'fortressvote-rotate-vote_integrity_secret-in-production'
  )
  from public.platform_security_settings s
  where s.id = 1;
$$;

create or replace function public.enforce_rate_limit(
  p_bucket text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  if p_bucket is null or length(trim(p_bucket)) = 0 then
    return;
  end if;

  p_max_attempts := greatest(1, least(coalesce(p_max_attempts, 10), 500));
  p_window_seconds := greatest(10, least(coalesce(p_window_seconds, 60), 86400));

  select window_start, attempt_count
  into v_window_start, v_count
  from public.security_rate_limits
  where bucket_key = p_bucket
  for update;

  if not found then
    insert into public.security_rate_limits (bucket_key, window_start, attempt_count)
    values (p_bucket, v_now, 1);
    return;
  end if;

  if v_window_start + (p_window_seconds || ' seconds')::interval < v_now then
    update public.security_rate_limits
    set window_start = v_now, attempt_count = 1
    where bucket_key = p_bucket;
    return;
  end if;

  if v_count >= p_max_attempts then
    raise exception 'Rate limit exceeded. Please wait and try again.';
  end if;

  update public.security_rate_limits
  set attempt_count = attempt_count + 1
  where bucket_key = p_bucket;
end;
$$;

grant execute on function public.enforce_rate_limit(text, integer, integer) to authenticated;
grant execute on function public.enforce_rate_limit(text, integer, integer) to service_role;

-- RLS on internal sequence table (no direct access)
alter table public.election_secret_id_sequences enable row level security;

-- Block direct ballot writes from API clients (votes only via RPC)
revoke insert, update, delete on public.anonymous_ballots from anon, authenticated;

-- Ballot integrity seal (HMAC of choice — tamper detection, not voter linkage)
alter table public.anonymous_ballots
  add column if not exists ballot_choice_seal text;

create or replace function public._seal_ballot_choice(
  p_ballot_id uuid,
  p_election_id uuid,
  p_candidate_id uuid
)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select encode(
    extensions.hmac(
      convert_to(
        p_ballot_id::text || ':' || p_election_id::text || ':' || p_candidate_id::text,
        'UTF8'
      ),
      convert_to(public._vote_integrity_secret(), 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public._assert_secret_voter_id_format(p_secret_voter_id text)
returns text
language plpgsql
immutable
as $$
declare
  v_norm text := trim(upper(coalesce(p_secret_voter_id, '')));
begin
  if length(v_norm) < 3 or length(v_norm) > 40 then
    raise exception 'Invalid secret voter ID format';
  end if;
  if v_norm ~ '[<>"'';\\]' then
    raise exception 'Invalid characters in secret voter ID';
  end if;
  return v_norm;
end;
$$;

create or replace function public._assert_uuid_param(p_value uuid, p_label text)
returns uuid
language plpgsql
immutable
as $$
begin
  if p_value is null then
    raise exception '% is required', p_label;
  end if;
  return p_value;
end;
$$;

-- Hardened verify with rate limit + input validation
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
  v_secret text;
  v_settings record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public._assert_uuid_param(p_election_id, 'election_id');
  v_secret := public._assert_secret_voter_id_format(p_secret_voter_id);

  select * into v_settings from public.platform_security_settings where id = 1;

  if coalesce(v_settings.maintenance_mode, false) then
    raise exception 'Platform is in maintenance mode';
  end if;

  perform public.enforce_rate_limit(
    'vote_verify:' || v_user_id::text || ':' || p_election_id::text,
    coalesce(v_settings.rate_limit_vote_verify_per_minute, 15),
    60
  );

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

  if trim(upper(v_registration.secret_voter_id)) <> v_secret then
    return jsonb_build_object(
      'valid', false,
      'code', 'invalid_secret_id',
      'message', 'Secret voter ID does not match our records'
    );
  end if;

  return jsonb_build_object(
    'valid', true,
    'registration_id', v_registration.id,
    'masked_secret_id', '****' || right(v_registration.secret_voter_id, 4)
  );
end;
$$;

-- Hardened cast with rate limit, seal, validation
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

  insert into public.anonymous_ballots (election_id, candidate_id)
  values (p_election_id, p_candidate_id)
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
    'cast_at', now()
  );
end;
$$;

-- Admin security dashboard data
create or replace function public.get_security_posture()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings public.platform_security_settings%rowtype;
  v_rls_tables jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into v_settings from public.platform_security_settings where id = 1;

  select coalesce(jsonb_agg(jsonb_build_object('table', c.relname, 'rls', c.relrowsecurity)), '[]'::jsonb)
  into v_rls_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in (
      'users',
      'elections',
      'candidates',
      'voter_registrations',
      'anonymous_ballots',
      'audit_logs',
      'notification_logs',
      'election_secret_id_sequences',
      'platform_security_settings',
      'security_rate_limits'
    );

  return jsonb_build_object(
    'settings', jsonb_build_object(
      'captcha_enabled', v_settings.captcha_enabled,
      'captcha_provider', v_settings.captcha_provider,
      'rate_limit_auth_per_minute', v_settings.rate_limit_auth_per_minute,
      'rate_limit_vote_verify_per_minute', v_settings.rate_limit_vote_verify_per_minute,
      'rate_limit_vote_cast_per_minute', v_settings.rate_limit_vote_cast_per_minute,
      'ballot_sealing_enabled', v_settings.ballot_sealing_enabled,
      'maintenance_mode', v_settings.maintenance_mode,
      'updated_at', v_settings.updated_at
    ),
    'rls_tables', v_rls_tables,
    'direct_ballot_writes_blocked', true,
    'ballots_have_seal_column', exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'anonymous_ballots'
        and column_name = 'ballot_choice_seal'
    )
  );
end;
$$;

grant execute on function public.get_security_posture() to authenticated;

create or replace function public.admin_update_security_settings(
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  update public.platform_security_settings
  set
    captcha_enabled = coalesce((p_patch ->> 'captcha_enabled')::boolean, captcha_enabled),
    captcha_provider = coalesce(nullif(p_patch ->> 'captcha_provider', ''), captcha_provider),
    rate_limit_auth_per_minute = coalesce((p_patch ->> 'rate_limit_auth_per_minute')::integer, rate_limit_auth_per_minute),
    rate_limit_vote_verify_per_minute = coalesce((p_patch ->> 'rate_limit_vote_verify_per_minute')::integer, rate_limit_vote_verify_per_minute),
    rate_limit_vote_cast_per_minute = coalesce((p_patch ->> 'rate_limit_vote_cast_per_minute')::integer, rate_limit_vote_cast_per_minute),
    ballot_sealing_enabled = coalesce((p_patch ->> 'ballot_sealing_enabled')::boolean, ballot_sealing_enabled),
    maintenance_mode = coalesce((p_patch ->> 'maintenance_mode')::boolean, maintenance_mode),
    updated_at = now(),
    updated_by = v_uid
  where id = 1;

  return public.get_security_posture();
end;
$$;

grant execute on function public.admin_update_security_settings(jsonb) to authenticated;
