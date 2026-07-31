-- =====================================================================
-- SocialSales OS — Phase 20: Product Guide + Onboarding Wizard
--
-- The onboarding checklist itself is intentionally NOT a stored table:
-- its steps are derived live from real data that already exists
-- (has a landing page been published? has a lead been added? etc.),
-- exactly as requested ("Checklist حقيقية تعتمد على إمكانيات المشروع
-- الموجودة") — see lib/onboarding/checklist.ts. The only new state we
-- actually need is (a) per-user dismissal of each page's guide, and
-- (b) whether the merchant has finished/dismissed the setup wizard.
-- =====================================================================

create table public.user_guide_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  guide_key text not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, guide_key)
);

alter table public.user_guide_state enable row level security;

create policy "guide_state_select_own"
  on public.user_guide_state for select
  using (user_id = auth.uid());

create policy "guide_state_insert_own"
  on public.user_guide_state for insert
  with check (user_id = auth.uid());

create policy "guide_state_delete_own"
  on public.user_guide_state for delete
  using (user_id = auth.uid());

-- Lets the merchant close the setup wizard early ("Don't show again"
-- equivalent for the wizard as a whole) without deleting their progress
-- — progress is still derived live from real data, this only hides the
-- wizard banner/page once they're done with it.
alter table public.workspaces add column onboarding_dismissed_at timestamptz;
