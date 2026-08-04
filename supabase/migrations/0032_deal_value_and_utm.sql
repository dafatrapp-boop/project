-- =====================================================================
-- Phase 32 — Deal value + first-class UTM columns on leads
-- (product-gaps review أ.2, architecture review 2.1).
--
-- أ.2: there was no monetary figure anywhere on a lead before it
-- becomes an Order — no way to see total pipeline value or forecast
-- revenue. Adds `estimated_value`, shown on the lead detail page and
-- summed per-column on the Kanban board.
--
-- 2.1: UTM parameters were captured only inside lead_activities.payload
-- (JSONB, on the 'created' activity row), meaning any report/filter/
-- export needing traffic source had to unpack JSON instead of a plain
-- column. Adds the same four UTM fields directly on `leads`, populated
-- by `submit_lead_from_landing_page` at insert time going forward. The
-- JSONB copy on lead_activities is left as-is (harmless, still the
-- literal record of what the visitor's URL contained at that moment).
-- =====================================================================

alter table public.leads add column if not exists estimated_value numeric(12, 2);
alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_content text;
alter table public.leads add column if not exists utm_term text;

create index if not exists leads_utm_source_idx on public.leads (workspace_id, utm_source) where utm_source is not null;

-- submit_lead_from_landing_page (originally 0004_forms.sql, extended in
-- 0005_campaigns.sql to the version reproduced below) already accepts
-- p_utm_source/p_utm_medium/p_utm_campaign and matches utm_campaign to
-- a campaigns row — it just never persisted the raw UTM values onto
-- the lead row itself (only inside the 'created' activity's JSONB
-- payload). Every other line of validation/behavior here is preserved
-- exactly as the 0005 version to avoid changing anything not related
-- to this fix; the only changes are the two new optional params
-- (utm_content/utm_term) and writing all four utm_* values onto the
-- insert.
create or replace function public.submit_lead_from_landing_page(
  p_landing_page_id uuid,
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null,
  p_utm_term text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_campaign_id uuid;
  v_lead_id uuid;
begin
  if length(trim(coalesce(p_full_name, ''))) = 0 then
    raise exception 'full_name_required';
  end if;
  if p_phone is null and p_email is null then
    raise exception 'phone_or_email_required';
  end if;

  select workspace_id into v_workspace_id
  from public.landing_pages
  where id = p_landing_page_id and status = 'published';

  if v_workspace_id is null then
    raise exception 'landing_page_not_found_or_unpublished';
  end if;

  if p_utm_campaign is not null then
    select id into v_campaign_id
    from public.campaigns
    where workspace_id = v_workspace_id and utm_campaign = p_utm_campaign;
  end if;

  insert into public.leads (
    workspace_id, full_name, phone, email, source, campaign_id, status,
    utm_source, utm_medium, utm_content, utm_term
  )
  values (
    v_workspace_id, trim(p_full_name), nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
    'landing_page_form', v_campaign_id, 'new',
    p_utm_source, p_utm_medium, p_utm_content, p_utm_term
  )
  returning id into v_lead_id;

  insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
  values (v_lead_id, v_workspace_id, null, 'created',
          jsonb_build_object(
            'source', 'landing_page_form',
            'utm_source', p_utm_source,
            'utm_medium', p_utm_medium,
            'utm_campaign', p_utm_campaign,
            'utm_content', p_utm_content,
            'utm_term', p_utm_term,
            'campaign_matched', v_campaign_id is not null
          ));

  return v_lead_id;
end;
$$;

revoke all on function public.submit_lead_from_landing_page from public;
grant execute on function public.submit_lead_from_landing_page to anon, authenticated;
