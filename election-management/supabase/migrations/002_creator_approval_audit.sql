-- Creator approval status + audit logs

do $$ begin
  create type public.approval_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

alter table public.users
  add column if not exists approval_status public.approval_status not null default 'approved';

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id) on delete set null,
  target_user_id uuid references public.users (id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists users_approval_status_idx on public.users (approval_status);

alter table public.audit_logs enable row level security;

-- Helper: current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and approval_status = 'approved'
  );
$$;

-- Admins can read all profiles (for approval queue)
drop policy if exists "Users can read own profile" on public.users;

create policy "Users can read own profile or admin reads all"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

-- Admins can update approval fields on any user
create policy "Admins can update user approvals"
  on public.users
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (public.is_admin() and actor_id = auth.uid());

-- Signup trigger: election creators start as pending
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.user_role;
  selected_status public.approval_status;
begin
  selected_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'voter'::public.user_role
  );

  selected_status := case
    when selected_role = 'election_creator'::public.user_role then 'pending'::public.approval_status
    else 'approved'::public.approval_status
  end;

  insert into public.users (id, email, role, approval_status)
  values (new.id, new.email, selected_role, selected_status)
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        approval_status = excluded.approval_status,
        updated_at = now();

  return new;
end;
$$;
