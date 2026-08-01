-- =====================================================================
-- SocialSales OS — Landing page image uploads (Supabase Storage)
-- =====================================================================
-- Public bucket: uploaded images need to be visible on published
-- public landing pages without any auth, so this bucket is public —
-- reads bypass RLS entirely for public buckets (standard Supabase
-- behavior), while writes are still gated by the policies below.
--
-- Path convention enforced by the upload code (not the DB): every
-- object is stored as `{workspace_id}/{landing_page_id}/{filename}` —
-- the policies below use storage.foldername(name) to read that first
-- path segment as the workspace_id and check membership against it,
-- the same is_workspace_member() helper used everywhere else.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-page-images',
  'landing-page-images',
  true,
  5242880, -- 5MB, matches the client-side check in lib/storage/upload.ts —
           -- this is the check that actually can't be bypassed by a
           -- modified request, the client-side one is just fast feedback.
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "landing_images_select_member" on storage.objects;
create policy "landing_images_select_member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'landing-page-images'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "landing_images_insert_member" on storage.objects;
create policy "landing_images_insert_member"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'landing-page-images'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "landing_images_update_member" on storage.objects;
create policy "landing_images_update_member"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'landing-page-images'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "landing_images_delete_member" on storage.objects;
create policy "landing_images_delete_member"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'landing-page-images'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );
