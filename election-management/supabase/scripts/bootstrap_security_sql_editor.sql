-- =============================================================================
-- Run in Supabase → SQL Editor when platform_security_settings is NULL
-- Safe to re-run. Requires: pgcrypto extension, public.users, is_admin()
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

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

create table if not exists public.security_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null,
  attempt_count integer not null default 0
);

select to_regclass('public.platform_security_settings') as security_settings_created;
