-- =====================================================================
-- SocialSales OS — Phase 6: Meta Pixel
-- =====================================================================
-- The public landing page needs the owning workspace's Meta Pixel ID
-- to render the tracking script, but anonymous visitors have no read
-- access to `workspaces` (RLS restricts it to members). Rather than
-- opening a broad anon SELECT policy on workspaces, expose exactly the
-- one field, for exactly a published page, through a narrow function —
-- same pattern as the Phase 4/5 public functions.

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
  where lp.id = p_landing_page_id and lp.status = 'published';
$$;

revoke all on function public.get_public_pixel_id from public;
grant execute on function public.get_public_pixel_id to anon, authenticated;
