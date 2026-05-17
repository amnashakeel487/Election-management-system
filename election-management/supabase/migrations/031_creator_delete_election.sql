-- Allow creators to delete their own draft or published elections (before active voting).

create policy "Creators delete own draft or published elections"
  on public.elections
  for delete
  to authenticated
  using (
    creator_id = auth.uid()
    and public.is_approved_election_creator()
    and status in ('draft', 'published')
  );

create policy "Admins delete elections"
  on public.elections
  for delete
  to authenticated
  using (public.is_admin());
