-- =====================================================================
-- Phase 10 (post-audit) — two structural fixes flagged by the
-- independent architecture review, both purely additive/non-breaking:
--
-- 1) RLS auth.uid() performance (CTO review item #3): every RLS policy
--    in this project reaches auth.uid() either directly or through
--    is_workspace_member()/is_workspace_admin(). Called bare, Postgres'
--    planner re-evaluates auth.uid() for every row instead of once per
--    query (documented Supabase/Postgres RLS performance pitfall).
--    Wrapping it as `(select auth.uid())` lets the planner cache it via
--    an InitPlan. This changes zero behavior — same boolean result for
--    every row — it only removes the per-row re-evaluation cost, which
--    matters once `leads`/`lead_activities`/`notifications` grow large
--    across many tenants.
--
-- 2) Landing page slug collision (CTO review item #2): `landing_pages`
--    only enforced `unique (workspace_id, slug)`, while the public
--    route `/p/[slug]` looks pages up by slug alone with `.maybeSingle()`
--    — a query that assumes at most one matching row *system-wide*.
--    Two unrelated workspaces landing on the same slug (their random
--    suffix collides, or a future manual-slug feature lets them type
--    the same short word) breaks the public page for one or both of
--    them with no warning at creation time. Fixed here at the data
--    layer with a global unique constraint; the app layer (see
--    app/(dashboard)/landing-pages/actions.ts) now retries with a new
--    random suffix on conflict instead of surfacing a raw DB error.
--    A full namespaced-URL redesign (`/p/[workspace-slug]/[page-slug]`)
--    remains the ideal long-term fix and is called out in the final
--    report, but is a routing/product decision beyond a bug fix.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Wrap auth.uid() in the two helpers every tenant-scoped policy
--    goes through. This is the single highest-leverage change since
--    leads/campaigns/orders/etc. all call one of these two functions
--    rather than comparing auth.uid() inline.
-- ---------------------------------------------------------------------
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
  );
$$ language sql security definer stable set search_path = public;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------
-- Remaining policies that compare auth.uid() directly (not through the
-- helpers above) get the same treatment. Every policy below is
-- reissued with the exact same name/table/command/logic as where it
-- was first defined — only the auth.uid() call changes.
-- ---------------------------------------------------------------------

-- profiles (0001_foundation.sql)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = (select auth.uid()));

-- profiles_select_workspace_coworkers (0008_team_and_plans.sql) — lets
-- a member see the display name of anyone sharing a workspace with them.
drop policy if exists "profiles_select_workspace_coworkers" on public.profiles;
create policy "profiles_select_workspace_coworkers"
  on public.profiles for select
  using (
    exists (
      select 1 from public.workspace_members wm1
      join public.workspace_members wm2 on wm1.workspace_id = wm2.workspace_id
      where wm1.user_id = profiles.id and wm2.user_id = (select auth.uid())
    )
  );

-- workspaces (0001_foundation.sql)
drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
  on public.workspaces for insert
  with check (owner_id = (select auth.uid()));

-- workspace_members (0001_foundation.sql)
drop policy if exists "members_insert_admin" on public.workspace_members;
create policy "members_insert_admin"
  on public.workspace_members for insert
  with check (public.is_workspace_admin(workspace_id) or user_id = (select auth.uid()));

-- lead_notes (0002_crm.sql) — table/policy names per that migration.
drop policy if exists "lead_notes_insert_member" on public.lead_notes;
create policy "lead_notes_insert_member"
  on public.lead_notes for insert
  with check (public.is_workspace_member(workspace_id) and author_id = (select auth.uid()));

drop policy if exists "lead_notes_delete_author_or_admin" on public.lead_notes;
create policy "lead_notes_delete_author_or_admin"
  on public.lead_notes for delete
  using (author_id = (select auth.uid()) or public.is_workspace_admin(workspace_id));

-- notifications (0012_activity_notifications_tags.sql)
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = (select auth.uid()));

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = (select auth.uid()));

-- user_guide_state (0020_guide_and_onboarding.sql)
drop policy if exists "guide_state_select_own" on public.user_guide_state;
create policy "guide_state_select_own"
  on public.user_guide_state for select
  using (user_id = (select auth.uid()));

drop policy if exists "guide_state_insert_own" on public.user_guide_state;
create policy "guide_state_insert_own"
  on public.user_guide_state for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "guide_state_delete_own" on public.user_guide_state;
create policy "guide_state_delete_own"
  on public.user_guide_state for delete
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 2) Global slug uniqueness for landing_pages. The public route keys
--    purely off `slug` (it has no workspace context to scope by), so
--    the constraint must match that: unique across the whole table,
--    not just per-workspace.
-- ---------------------------------------------------------------------
do $$ begin
  alter table public.landing_pages add constraint landing_pages_slug_key unique (slug);
exception when duplicate_object then null;
end $$;
