-- =====================================================================
-- Phase 34 — Merge duplicate leads (product-gaps review ب.2).
--
-- Duplicate detection only ever ran at manual single-add time
-- (`checkDuplicateLeadAction`, a soft warning) — CSV import (the most
-- likely source of real duplicates) has no check at all, and there was
-- never any way to fix duplicates that already exist: no merge tool,
-- no way to consolidate two rows for the same customer into one
-- history. This adds:
--   * find_duplicate_lead_pairs — surfaces candidate duplicates within
--     a workspace (matching phone OR email, excluding already-deleted
--     rows and rows already paired with themselves).
--   * merge_leads — reassigns every child record (notes, activities,
--     follow-ups, orders, reminders — attachments too, once migration
--     0035 adds that table, see the redefinition there) from the
--     duplicate onto the primary lead, unions tags/custom_fields, keeps
--     the primary's core fields, and soft-deletes the duplicate (via
--     the same deleted_at mechanism as migration 0031, so a bad merge
--     is still recoverable from Trash within 30 days).
-- =====================================================================

create or replace function public.find_duplicate_lead_pairs(p_workspace_id uuid)
returns table (
  primary_id uuid,
  primary_name text,
  duplicate_id uuid,
  duplicate_name text,
  matched_on text
)
language sql security definer stable set search_path = public
as $$
  select distinct on (least(a.id, b.id), greatest(a.id, b.id))
    least(a.id, b.id) as primary_id,
    (select full_name from public.leads where id = least(a.id, b.id)) as primary_name,
    greatest(a.id, b.id) as duplicate_id,
    (select full_name from public.leads where id = greatest(a.id, b.id)) as duplicate_name,
    case when a.phone is not null and a.phone = b.phone then 'phone' else 'email' end as matched_on
  from public.leads a
  join public.leads b
    on a.workspace_id = b.workspace_id
    and a.id < b.id
    and (
      (a.phone is not null and a.phone = b.phone)
      or (a.email is not null and a.email = b.email)
    )
  where a.workspace_id = p_workspace_id
    and public.is_workspace_admin(p_workspace_id)
    and a.deleted_at is null
    and b.deleted_at is null;
$$;

revoke all on function public.find_duplicate_lead_pairs from public;
grant execute on function public.find_duplicate_lead_pairs to authenticated;

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

  update public.leads
  set
    tags = (select array(select distinct unnest(tags || coalesce(v_dup_tags, '{}')))),
    custom_fields = coalesce(v_dup_custom_fields, '{}'::jsonb) || custom_fields,
    deleted_at = null -- merging is a positive action; never leave the primary accidentally in trash
  where id = p_primary_lead_id;

  update public.leads set deleted_at = now() where id = p_duplicate_lead_id;

  insert into public.workspace_activity_log (workspace_id, actor_id, action, entity_type, entity_label)
  values (v_workspace_id, (select auth.uid()), 'merged', 'lead',
          (select full_name from public.leads where id = p_primary_lead_id));
end;
$$;

revoke all on function public.merge_leads from public;
grant execute on function public.merge_leads to authenticated;
