-- =====================================================================
-- Phase 37 — GA4 measurement ID (architecture review 4.2).
--
-- Same pattern as meta_pixel_id (0001_foundation.sql): a plain
-- merchant-owned field, never generated or inferred by us, exposed
-- publicly only for a published landing page via a narrow SECURITY
-- DEFINER function (same shape as get_public_pixel_id, 0006_meta_pixel.sql).
-- =====================================================================

alter table public.workspaces add column if not exists ga4_measurement_id text;

create or replace function public.get_public_ga4_id(p_landing_page_id uuid)
returns text
language sql security definer stable set search_path = public
as $$
  select w.ga4_measurement_id
  from public.workspaces w
  join public.landing_pages lp on lp.workspace_id = w.id
  where lp.id = p_landing_page_id and lp.status = 'published';
$$;

revoke all on function public.get_public_ga4_id from public;
grant execute on function public.get_public_ga4_id to anon, authenticated;
