-- =====================================================================
-- Phase 33 — Custom fields for leads (product-gaps review ب.1).
--
-- Every lead used the same fixed columns (name/phone/email/source/
-- notes) with no way for a merchant to track anything specific to
-- their own business (appointment date for a clinic, budget for real
-- estate, product interest for a store). Fastest correct approach for
-- this stage: workspace-defined field *definitions* in a small table
-- (so the UI knows what to render and validate), with values stored in
-- the `custom_fields` JSONB column added on `leads` in migration 0032
-- — a real table-per-value-column model is the "more correct at scale"
-- alternative but is unwarranted complexity before any workspace has
-- outgrown a JSONB blob of a few dozen key/value pairs per lead.
-- =====================================================================

create table if not exists public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'number', 'date', 'select')),
  options text[] not null default '{}', -- only used when field_type = 'select'
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (workspace_id, key)
);

alter table public.custom_field_definitions enable row level security;

drop policy if exists "custom_fields_select_member" on public.custom_field_definitions;
create policy "custom_fields_select_member"
  on public.custom_field_definitions for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "custom_fields_write_admin" on public.custom_field_definitions;
create policy "custom_fields_write_admin"
  on public.custom_field_definitions for insert
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists "custom_fields_update_admin" on public.custom_field_definitions;
create policy "custom_fields_update_admin"
  on public.custom_field_definitions for update
  using (public.is_workspace_admin(workspace_id));

drop policy if exists "custom_fields_delete_admin" on public.custom_field_definitions;
create policy "custom_fields_delete_admin"
  on public.custom_field_definitions for delete
  using (public.is_workspace_admin(workspace_id));
