-- =====================================================================
-- Phase 31 — Soft delete for leads (product-gaps review, item ج.3).
--
-- `deleteLeadAction` ran a real `DELETE` with no recovery path — the
-- single most common mistake in day-to-day CRM use (deleting the wrong
-- row) was previously unrecoverable the instant it happened. This adds
-- a `deleted_at` column and switches the normal delete flow to setting
-- it instead of removing the row.
--
-- Enforcement point is RLS, not app code (this project's established
-- pattern): every normal read/update policy now also requires
-- `deleted_at is null`, so a soft-deleted lead disappears from EVERY
-- existing query in the app (list, pipeline, search, exports, campaign
-- detail, duplicate-check, analytics) automatically — no need to
-- audit and patch the dozen call sites individually, which would be
-- easy to get wrong and leave one place still showing deleted rows.
-- A dedicated set of SECURITY DEFINER functions below gives
-- owner/admin a "Trash" view that can see/restore/permanently-delete
-- those rows without loosening the policies everyone else queries
-- through.
-- =====================================================================

alter table public.leads add column if not exists deleted_at timestamptz;

drop policy if exists "leads_select_member" on public.leads;
create policy "leads_select_member"
  on public.leads for select
  using (
    deleted_at is null
    and (
      public.is_workspace_admin(workspace_id)
      or (
        public.is_workspace_member(workspace_id)
        and (
          assigned_to = (select auth.uid())
          or assigned_to is null
          or exists (
            select 1 from public.workspaces w
            where w.id = leads.workspace_id and w.agents_view_all_leads = true
          )
        )
      )
    )
  );

drop policy if exists "leads_update_member" on public.leads;
create policy "leads_update_member"
  on public.leads for update
  using (
    deleted_at is null
    and (
      public.is_workspace_admin(workspace_id)
      or (
        public.is_workspace_member(workspace_id)
        and (
          assigned_to = (select auth.uid())
          or assigned_to is null
          or exists (
            select 1 from public.workspaces w
            where w.id = leads.workspace_id and w.agents_view_all_leads = true
          )
        )
      )
    )
  );

-- Soft delete: admin-only, same authorization the old hard-delete
-- policy required.
create or replace function public.soft_delete_lead(p_lead_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id from public.leads where id = p_lead_id;
  if v_workspace_id is null then
    return; -- already gone / never existed — nothing to do
  end if;
  if not public.is_workspace_admin(v_workspace_id) then
    raise exception 'not_authorized';
  end if;

  update public.leads set deleted_at = now() where id = p_lead_id;

  insert into public.workspace_activity_log (workspace_id, actor_id, action, entity_type, entity_label)
  select v_workspace_id, (select auth.uid()), 'deleted', 'lead', full_name
  from public.leads where id = p_lead_id;
end;
$$;

revoke all on function public.soft_delete_lead from public;
grant execute on function public.soft_delete_lead to authenticated;

-- Trash list: bypasses the deleted_at-is-null policy on purpose, but
-- keeps the same admin-only + workspace-scoping check the policy would
-- have enforced.
create or replace function public.list_deleted_leads(p_workspace_id uuid)
returns setof public.leads
language sql security definer stable set search_path = public
as $$
  select * from public.leads
  where workspace_id = p_workspace_id
    and deleted_at is not null
    and public.is_workspace_admin(p_workspace_id)
  order by deleted_at desc;
$$;

revoke all on function public.list_deleted_leads from public;
grant execute on function public.list_deleted_leads to authenticated;

create or replace function public.restore_lead(p_lead_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id from public.leads where id = p_lead_id;
  if v_workspace_id is null or not public.is_workspace_admin(v_workspace_id) then
    raise exception 'not_authorized';
  end if;
  update public.leads set deleted_at = null where id = p_lead_id;
end;
$$;

revoke all on function public.restore_lead from public;
grant execute on function public.restore_lead to authenticated;

-- Permanent delete — only ever reachable from the Trash view on a row
-- that is already soft-deleted, same admin check as everywhere else.
create or replace function public.purge_lead(p_lead_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id from public.leads
  where id = p_lead_id and deleted_at is not null;
  if v_workspace_id is null or not public.is_workspace_admin(v_workspace_id) then
    raise exception 'not_authorized';
  end if;
  delete from public.leads where id = p_lead_id;
end;
$$;

revoke all on function public.purge_lead from public;
grant execute on function public.purge_lead to authenticated;

-- Auto-purge: leads sitting in the trash for 30+ days are permanently
-- removed, same daily pg_cron job already scheduled in migration 0030.
create or replace function public.cleanup_expired_operational_logs()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.form_submission_log
  where created_at < now() - interval '24 hours';

  delete from public.notifications
  where read_at is not null
    and read_at < now() - interval '90 days';

  delete from public.leads
  where deleted_at is not null
    and deleted_at < now() - interval '30 days';
end;
$$;
