-- =====================================================================
-- SocialSales OS — per-campaign daily lead counts
-- Adds the day-by-day-per-campaign granularity that leads_daily_counts
-- (0007) doesn't have — that view aggregates across all campaigns.
-- security_invoker = true for the same RLS-correctness reason as the
-- other analytics views (0005, 0007).
-- =====================================================================

create view public.campaign_daily_leads_counts
with (security_invoker = true)
as
select
  workspace_id,
  campaign_id,
  date_trunc('day', created_at)::date as day,
  count(*) as leads_count
from public.leads
where campaign_id is not null
group by workspace_id, campaign_id, date_trunc('day', created_at)::date;
