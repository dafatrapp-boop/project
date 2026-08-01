-- =====================================================================
-- SocialSales OS — Phase 7: Analytics
-- =====================================================================
-- Daily time-series views. security_invoker = true so RLS on the
-- underlying tables (leads, landing_page_views) applies to the
-- querying user, not to the view's owner — same reasoning as
-- campaign_stats in 0005_campaigns.sql.

create or replace view public.leads_daily_counts
with (security_invoker = true)
as
select
  workspace_id,
  date_trunc('day', created_at)::date as day,
  count(*) as leads_count,
  count(*) filter (where status = 'won') as won_count
from public.leads
group by workspace_id, date_trunc('day', created_at)::date;

create or replace view public.page_views_daily_counts
with (security_invoker = true)
as
select
  workspace_id,
  date_trunc('day', created_at)::date as day,
  count(*) as views_count
from public.landing_page_views
group by workspace_id, date_trunc('day', created_at)::date;
