-- FortressVote: public.users profile table + RLS
-- Run in Supabase SQL Editor (enable email confirmation in Auth settings).

do $$ begin
  create type public.user_role as enum ('admin', 'election_creator', 'voter');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'voter',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_role_idx on public.users (role);

alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can insert own profile on signup" on public.users;

create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile on signup"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create profile when auth user is created (role from signup metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.user_role;
begin
  selected_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'voter'::public.user_role
  );

  insert into public.users (id, email, role)
  values (new.id, new.email, selected_role)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
