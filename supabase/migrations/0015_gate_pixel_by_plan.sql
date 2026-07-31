-- =====================================================================
-- SocialSales OS — gate Meta Pixel delivery by plan tier
-- =====================================================================
-- Per the approved plan comparison table, Meta Pixel is a Starter+
-- feature. Re-defining get_public_pixel_id (same signature, same
-- single caller — the public page) to also require a qualifying plan,
-- so a workspace that downgraded to Free but still has an old pixel_id
-- stored doesn't keep silently tracking.

create or replace function public.get_public_pixel_id(p_landing_page_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select w.meta_pixel_id
  from public.landing_pages lp
  join public.workspaces w on w.id = lp.workspace_id
  where lp.id = p_landing_page_id
    and lp.status = 'published'
    and w.plan in ('starter', 'growth', 'pro');
$$;

-- Needed for the public page to know whether to show the free-tier
-- "Powered by" badge — same narrow-accessor pattern as the pixel ID
-- function above, since anon has no direct read on `workspaces`.
create or replace function public.get_public_workspace_plan(p_landing_page_id uuid)
returns public.workspace_plan
language sql
security definer
stable
set search_path = public
as $$
  select w.plan
  from public.landing_pages lp
  join public.workspaces w on w.id = lp.workspace_id
  where lp.id = p_landing_page_id and lp.status = 'published';
$$;

revoke all on function public.get_public_workspace_plan from public;
grant execute on function public.get_public_workspace_plan to anon, authenticated;
