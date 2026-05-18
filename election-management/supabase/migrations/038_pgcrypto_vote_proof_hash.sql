-- Fix: function digest(text, unknown) does not exist when casting votes (036 proof hash)
-- pgcrypto lives in the extensions schema on Supabase (see 022_security_module.sql).

create extension if not exists pgcrypto with schema extensions;

create or replace function public._voter_vote_proof_hash(
  p_secret_voter_id text,
  p_election_id uuid
)
returns text
language sql
immutable
parallel safe
security definer
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(
      trim(upper(p_secret_voter_id)) || ':' || p_election_id::text,
      'sha256'
    ),
    'hex'
  );
$$;
