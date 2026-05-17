-- Fix candidate CRUD + portrait uploads for creators on draft and published elections.
-- Uses a security-definer helper so nested election checks are reliable under RLS.

create or replace function public.creator_can_manage_candidates(p_election_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.is_approved_election_creator()
    or public.is_admin()
  )
  and exists (
    select 1
    from public.elections e
    where e.id = p_election_id
      and (
        e.creator_id = auth.uid()
        or public.is_admin()
      )
      and e.status in ('draft', 'published')
  );
$$;

revoke all on function public.creator_can_manage_candidates(uuid) from public;
grant execute on function public.creator_can_manage_candidates(uuid) to authenticated;

-- Candidates table
drop policy if exists "Creators manage candidates on own draft elections" on public.candidates;
drop policy if exists "Creators manage candidates on own draft or published elections" on public.candidates;

create policy "Creators manage candidates on own draft or published elections"
  on public.candidates
  for all
  to authenticated
  using (public.creator_can_manage_candidates(election_id))
  with check (public.creator_can_manage_candidates(election_id));

-- Candidate portrait storage (path: {election_id}/{candidate_id}.{ext})
drop policy if exists "Creators upload candidate portraits" on storage.objects;
drop policy if exists "Creators update candidate portraits" on storage.objects;
drop policy if exists "Creators delete candidate portraits" on storage.objects;

create policy "Creators upload candidate portraits"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'candidate-photos'
    and cardinality(string_to_array(name, '/')) >= 2
    and public.creator_can_manage_candidates((string_to_array(name, '/'))[1]::uuid)
  );

create policy "Creators update candidate portraits"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and cardinality(string_to_array(name, '/')) >= 2
    and public.creator_can_manage_candidates((string_to_array(name, '/'))[1]::uuid)
  )
  with check (
    bucket_id = 'candidate-photos'
    and cardinality(string_to_array(name, '/')) >= 2
    and public.creator_can_manage_candidates((string_to_array(name, '/'))[1]::uuid)
  );

create policy "Creators delete candidate portraits"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and cardinality(string_to_array(name, '/')) >= 2
    and public.creator_can_manage_candidates((string_to_array(name, '/'))[1]::uuid)
  );
