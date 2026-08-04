-- =====================================================================
-- Phase 35 — Lead attachments (product-gaps review ب.3).
--
-- Unlike landing-page-images (0011_storage_images.sql), this bucket is
-- PRIVATE — these are customer files (ID copies, contracts, screenshots
-- of a conversation), not public marketing assets, so reads must go
-- through Storage's signed-URL flow gated by the same workspace
-- membership check, never a public URL. Path convention:
-- `{workspace_id}/{lead_id}/{filename}`, matching the pattern already
-- established for landing-page-images.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-attachments',
  'lead-attachments',
  false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lead_attachments_select_member" on storage.objects;
create policy "lead_attachments_select_member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lead-attachments'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "lead_attachments_insert_member" on storage.objects;
create policy "lead_attachments_insert_member"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lead-attachments'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "lead_attachments_delete_member" on storage.objects;
create policy "lead_attachments_delete_member"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lead-attachments'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );

-- ---------------------------------------------------------------------
-- Metadata table — file name / size / uploader, so the UI can list
-- attachments without a Storage `list()` call, and so RLS on the
-- metadata mirrors the same per-lead visibility rules leads themselves
-- now have (migration 0028/0031: agents only see assigned/unassigned
-- leads unless agents_view_all_leads is on).
-- ---------------------------------------------------------------------
create table if not exists public.lead_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  file_path text not null,
  file_name text not null,
  file_size int not null,
  content_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_attachments_lead_idx on public.lead_attachments (lead_id, created_at desc);

alter table public.lead_attachments enable row level security;

drop policy if exists "lead_attachments_select_member" on public.lead_attachments;
create policy "lead_attachments_select_member"
  on public.lead_attachments for select
  using (
    public.is_workspace_admin(workspace_id)
    or (
      public.is_workspace_member(workspace_id)
      and exists (
        select 1 from public.leads l
        where l.id = lead_attachments.lead_id
          and (
            l.assigned_to = (select auth.uid())
            or l.assigned_to is null
            or exists (
              select 1 from public.workspaces w
              where w.id = lead_attachments.workspace_id and w.agents_view_all_leads = true
            )
          )
      )
    )
  );

drop policy if exists "lead_attachments_insert_member" on public.lead_attachments;
create policy "lead_attachments_insert_member"
  on public.lead_attachments for insert
  with check (public.is_workspace_member(workspace_id) and uploaded_by = (select auth.uid()));

drop policy if exists "lead_attachments_delete_uploader_or_admin" on public.lead_attachments;
create policy "lead_attachments_delete_uploader_or_admin"
  on public.lead_attachments for delete
  using (uploaded_by = (select auth.uid()) or public.is_workspace_admin(workspace_id));

-- Extend merge_leads (0034) to also move attachments across, now that
-- the table exists.
create or replace function public.merge_leads(p_primary_lead_id uuid, p_duplicate_lead_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_dup_workspace_id uuid;
  v_dup_tags text[];
  v_dup_custom_fields jsonb;
begin
  if p_primary_lead_id = p_duplicate_lead_id then
    raise exception 'cannot_merge_lead_with_itself';
  end if;

  select workspace_id into v_workspace_id from public.leads where id = p_primary_lead_id;
  select workspace_id, tags, custom_fields into v_dup_workspace_id, v_dup_tags, v_dup_custom_fields
  from public.leads where id = p_duplicate_lead_id;

  if v_workspace_id is null or v_dup_workspace_id is null or v_workspace_id != v_dup_workspace_id then
    raise exception 'leads_not_in_same_workspace';
  end if;
  if not public.is_workspace_admin(v_workspace_id) then
    raise exception 'not_authorized';
  end if;

  update public.lead_notes set lead_id = p_primary_lead_id where lead_id = p_duplicate_lead_id;
  update public.lead_activities set lead_id = p_primary_lead_id where lead_id = p_duplicate_lead_id;
  update public.lead_follow_ups set lead_id = p_primary_lead_id where lead_id = p_duplicate_lead_id;
  update public.orders set lead_id = p_primary_lead_id where lead_id = p_duplicate_lead_id;
  update public.reminders set lead_id = p_primary_lead_id where lead_id = p_duplicate_lead_id;
  update public.lead_attachments set lead_id = p_primary_lead_id where lead_id = p_duplicate_lead_id;

  update public.leads
  set
    tags = (select array(select distinct unnest(tags || coalesce(v_dup_tags, '{}')))),
    custom_fields = coalesce(v_dup_custom_fields, '{}'::jsonb) || custom_fields,
    deleted_at = null
  where id = p_primary_lead_id;

  update public.leads set deleted_at = now() where id = p_duplicate_lead_id;

  insert into public.workspace_activity_log (workspace_id, actor_id, action, entity_type, entity_label)
  values (v_workspace_id, (select auth.uid()), 'merged', 'lead',
          (select full_name from public.leads where id = p_primary_lead_id));
end;
$$;
