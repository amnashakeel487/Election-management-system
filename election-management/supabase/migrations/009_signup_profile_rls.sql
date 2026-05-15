-- Ensure signup profile policies remain after approval migration changes.
-- Profile rows are created by handle_new_user (security definer); these policies
-- allow optional client updates when the user has a session.

drop policy if exists "Users can insert own profile on signup" on public.users;

create policy "Users can insert own profile on signup"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;

create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
