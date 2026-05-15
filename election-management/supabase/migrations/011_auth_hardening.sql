-- Auth hardening: block self-service Super Admin signup; helper to promote admins

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

  -- Super Admin accounts are provisioned by platform operators, not public signup.
  if selected_role = 'admin'::public.user_role then
    selected_role := 'voter'::public.user_role;
  end if;

  selected_status := case
    when selected_role = 'election_creator'::public.user_role then 'pending'::public.approval_status
    else 'approved'::public.approval_status
  end;

  insert into public.users (
    id, email, role, approval_status,
    full_name, phone, organization, election_purpose
  )
  values (
    new.id,
    new.email,
    selected_role,
    selected_status,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'organization'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'election_purpose'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        approval_status = excluded.approval_status,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        phone = coalesce(excluded.phone, public.users.phone),
        organization = coalesce(excluded.organization, public.users.organization),
        election_purpose = coalesce(excluded.election_purpose, public.users.election_purpose),
        updated_at = now();

  return new;
end;
$$;

-- Run once in SQL editor to create the first Super Admin (replace email).
-- update public.users set role = 'admin', approval_status = 'approved' where email = 'you@example.com';
