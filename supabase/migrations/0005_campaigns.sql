-- =====================================================================
-- SocialSales OS — Phase 5: Campaigns + Attribution
-- =====================================================================

do $$ begin
  create type public.campaign_platform as enum (
  'facebook', 'instagram', 'tiktok', 'snapchat', 'google', 'whatsapp', 'other'
);
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.campaign_status as enum ('draft', 'active', 'paused', 'ended');
exception when duplicate_object then null;
end $$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  platform public.campaign_platform not null default 'other',
  -- utm_campaign is the matching key: any lead or page-view carrying
  -- this value in its utm_campaign parameter is attributed here.
  utm_campaign text not null,
  landing_page_id uuid references public.landing_pages(id) on delete set null,
  status public.campaign_status not null default 'draft',
  budget numeric(12, 2),
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, utm_campaign)
);

create index if not exists campaigns_workspace_idx on public.campaigns (workspace_id);

alter table public.campaigns enable row level security;

drop policy if exists "campaigns_select_member" on public.campaigns;
create policy "campaigns_select_member"
  on public.campaigns for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "campaigns_insert_member" on public.campaigns;
create policy "campaigns_insert_member"
  on public.campaigns for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "campaigns_update_member" on public.campaigns;
create policy "campaigns_update_member"
  on public.campaigns for update
  using (public.is_workspace_member(workspace_id));

drop policy if exists "campaigns_delete_admin" on public.campaigns;
create policy "campaigns_delete_admin"
  on public.campaigns for delete
  using (public.is_workspace_admin(workspace_id));

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute procedure public.set_updated_at();

-- Now that campaigns exists, attach the FK the Phase 1 schema left
-- open (see the comment on leads.campaign_id in 0001_foundation.sql).
do $$ begin
  alter table public.leads
  add constraint leads_campaign_id_fkey
  foreign key (campaign_id) references public.campaigns(id) on delete set null;
exception when duplicate_object then null;
end $$;

create index if not exists leads_campaign_idx on public.leads (workspace_id, campaign_id);

-- ---------------------------------------------------------------------
-- Attribution: extend the Phase 4 public submission function so a lead
-- captured from a landing page form is auto-linked to the matching
-- campaign (by utm_campaign, scoped to the same workspace) at the
-- moment it's created — this is the actual attribution mechanism.
-- ---------------------------------------------------------------------
create or replace function public.submit_lead_from_landing_page(
  p_landing_page_id uuid,
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
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

  insert into public.leads (workspace_id, full_name, phone, email, source, campaign_id, status)
  values (v_workspace_id, trim(p_full_name), nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
          'landing_page_form', v_campaign_id, 'new')
  returning id into v_lead_id;

  insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
  values (v_lead_id, v_workspace_id, null, 'created',
          jsonb_build_object(
            'source', 'landing_page_form',
            'utm_source', p_utm_source,
            'utm_medium', p_utm_medium,
            'utm_campaign', p_utm_campaign,
            'campaign_matched', v_campaign_id is not null
          ));

  return v_lead_id;
end;
$$;

-- ---------------------------------------------------------------------
-- campaign_stats: a view (not a table) computing lead counts and
-- conversion by campaign on the fly, so numbers are never stale.
-- Views inherit RLS from the underlying tables they select from.
-- ---------------------------------------------------------------------
create or replace view public.campaign_stats
with (security_invoker = true)
as
select
  c.id as campaign_id,
  c.workspace_id,
  count(l.id) as leads_count,
  count(l.id) filter (where l.status = 'won') as won_count,
  count(pv.id) as views_count
from public.campaigns c
left join public.leads l on l.campaign_id = c.id
left join public.landing_page_views pv
  on pv.landing_page_id = c.landing_page_id
  and pv.utm_campaign = c.utm_campaign
group by c.id, c.workspace_id;
