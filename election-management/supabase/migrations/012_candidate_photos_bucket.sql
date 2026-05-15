-- Public bucket for candidate portrait images (referenced by candidates.photo_url)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-photos',
  'candidate-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read candidate portraits" on storage.objects;
drop policy if exists "Creators upload candidate portraits" on storage.objects;
drop policy if exists "Creators update candidate portraits" on storage.objects;
drop policy if exists "Creators delete candidate portraits" on storage.objects;

-- Path convention: {election_id}/{candidate_id}.{ext}
create policy "Public read candidate portraits"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'candidate-photos');

create policy "Creators upload candidate portraits"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'candidate-photos'
    and public.is_approved_election_creator()
    and cardinality(string_to_array(name, '/')) >= 2
    and exists (
      select 1
      from public.elections e
      where e.id::text = (string_to_array(name, '/'))[1]
        and e.creator_id = auth.uid()
        and e.status = 'draft'
    )
  );

create policy "Creators update candidate portraits"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and public.is_approved_election_creator()
    and cardinality(string_to_array(name, '/')) >= 2
    and exists (
      select 1
      from public.elections e
      where e.id::text = (string_to_array(name, '/'))[1]
        and e.creator_id = auth.uid()
        and e.status = 'draft'
    )
  )
  with check (
    bucket_id = 'candidate-photos'
    and cardinality(string_to_array(name, '/')) >= 2
    and exists (
      select 1
      from public.elections e
      where e.id::text = (string_to_array(name, '/'))[1]
        and e.creator_id = auth.uid()
        and e.status = 'draft'
    )
  );

create policy "Creators delete candidate portraits"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and public.is_approved_election_creator()
    and cardinality(string_to_array(name, '/')) >= 2
    and exists (
      select 1
      from public.elections e
      where e.id::text = (string_to_array(name, '/'))[1]
        and e.creator_id = auth.uid()
        and e.status = 'draft'
    )
  );
