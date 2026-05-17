-- Allow creators to add/edit/delete candidates on draft and published elections (not during/after active voting).

drop policy if exists "Creators manage candidates on own draft elections" on public.candidates;

create policy "Creators manage candidates on own draft or published elections"
  on public.candidates
  for all
  to authenticated
  using (
    public.is_approved_election_creator()
    and exists (
      select 1
      from public.elections e
      where e.id = election_id
        and e.creator_id = auth.uid()
        and e.status in ('draft', 'published')
    )
  )
  with check (
    public.is_approved_election_creator()
    and exists (
      select 1
      from public.elections e
      where e.id = election_id
        and e.creator_id = auth.uid()
        and e.status in ('draft', 'published')
    )
  );
