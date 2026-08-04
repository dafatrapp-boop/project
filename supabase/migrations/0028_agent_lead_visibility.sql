-- =====================================================================
-- Phase 28 — Agent lead visibility (product-gaps review, item ج.1,
-- flagged as the single most dangerous open finding in that report).
--
-- Until now, `leads_select_member` / `leads_update_member` let ANY
-- workspace member — including plain 'agent' role — see and edit EVERY
-- lead in the workspace, regardless of `assigned_to`. For any team with
-- more than one salesperson this means every agent can see every other
-- agent's entire customer list, which is both a competitive/privacy
-- risk internally and a real liability in regulated verticals (clinics,
-- real estate) where customer data shouldn't be freely browsable by
-- whoever is logged in.
--
-- Fix: agents now see/edit only leads assigned to them, or unassigned
-- leads (so new leads remain visible/claimable by the team instead of
-- disappearing until an owner/admin manually assigns them). owner/admin
-- keep full visibility, unchanged. A new opt-in workspace setting lets
-- an owner/admin restore "every agent sees everything" for teams that
-- genuinely want that (e.g. a two-person shop where this distinction
-- doesn't matter) — default is the safe/restricted behavior.
-- =====================================================================

alter table public.workspaces
  add column if not exists agents_view_all_leads boolean not null default false;

drop policy if exists "leads_select_member" on public.leads;
create policy "leads_select_member"
  on public.leads for select
  using (
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
  );

drop policy if exists "leads_update_member" on public.leads;
create policy "leads_update_member"
  on public.leads for update
  using (
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
  );

-- Related tables (notes/activities/follow-ups) currently grant every
-- member full read access regardless of lead assignment. Once leads
-- themselves are scoped per-agent, leaving these unscoped would let an
-- agent read notes/activity on a lead they can no longer see the base
-- row for via a join — not a data leak on its own (they still can't
-- join to the lead row), but for consistency and defense-in-depth we
-- scope lead_notes/lead_activities/lead_follow_ups reads the same way.
drop policy if exists "lead_notes_select_member" on public.lead_notes;
create policy "lead_notes_select_member"
  on public.lead_notes for select
  using (
    public.is_workspace_admin(workspace_id)
    or (
      public.is_workspace_member(workspace_id)
      and exists (
        select 1 from public.leads l
        where l.id = lead_notes.lead_id
          and (
            l.assigned_to = (select auth.uid())
            or l.assigned_to is null
            or exists (
              select 1 from public.workspaces w
              where w.id = lead_notes.workspace_id and w.agents_view_all_leads = true
            )
          )
      )
    )
  );

drop policy if exists "lead_activities_select_member" on public.lead_activities;
create policy "lead_activities_select_member"
  on public.lead_activities for select
  using (
    public.is_workspace_admin(workspace_id)
    or (
      public.is_workspace_member(workspace_id)
      and exists (
        select 1 from public.leads l
        where l.id = lead_activities.lead_id
          and (
            l.assigned_to = (select auth.uid())
            or l.assigned_to is null
            or exists (
              select 1 from public.workspaces w
              where w.id = lead_activities.workspace_id and w.agents_view_all_leads = true
            )
          )
      )
    )
  );

drop policy if exists "follow_ups_select_member" on public.lead_follow_ups;
create policy "follow_ups_select_member"
  on public.lead_follow_ups for select
  using (
    public.is_workspace_admin(workspace_id)
    or (
      public.is_workspace_member(workspace_id)
      and exists (
        select 1 from public.leads l
        where l.id = lead_follow_ups.lead_id
          and (
            l.assigned_to = (select auth.uid())
            or l.assigned_to is null
            or exists (
              select 1 from public.workspaces w
              where w.id = lead_follow_ups.workspace_id and w.agents_view_all_leads = true
            )
          )
      )
    )
  );
