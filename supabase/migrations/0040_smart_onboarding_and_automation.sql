-- =====================================================================
-- Phase 40 — Reduce manual setup: workspace-level WhatsApp default,
-- auto-seeded automation defaults, and optional round-robin lead
-- assignment.
--
-- Three separate but related "stop making the merchant configure this
-- by hand every time" fixes:
--
-- 1) `default_whatsapp_number`: every landing page previously started
--    with `whatsapp_number = null` (a dead CTA button) until the
--    merchant manually opened each page's settings tab and typed the
--    same number in again — with N pages, that's N repeats of the same
--    field. New pages now inherit this workspace-level default at
--    creation time (app-layer change, see onboarding/landing-pages
--    actions); still overridable per page.
--
-- 2) Automation defaults: `automation_rules` previously started
--    completely empty for every new workspace — a merchant had to
--    discover the Automations page and manually enable each rule
--    before anything automatic happened. A new workspace now gets
--    sensible defaults enabled immediately (still fully editable/
--    disable-able from Settings > Automations, same as before).
--
-- 3) Round-robin assignment (`auto_assign_leads`, opt-in, default off
--    to not change existing workspace behavior): when on, a new lead
--    with no explicit `assigned_to` is auto-assigned to whichever
--    workspace member currently has the fewest open (not won/lost,
--    not deleted) leads — a self-balancing rotation with no extra
--    state to maintain, instead of every new lead sitting unassigned
--    until a human manually claims it.
-- =====================================================================

alter table public.workspaces add column if not exists default_whatsapp_number text;
alter table public.workspaces add column if not exists auto_assign_leads boolean not null default false;

-- ---------------------------------------------------------------------
-- 2) Seed default automation rules whenever a workspace is created.
-- ---------------------------------------------------------------------
create or replace function public.seed_default_automation_rules()
returns trigger as $$
begin
  insert into public.automation_rules (workspace_id, rule_type, enabled, config)
  values
    (new.id, 'lead_stale_reminder', true, jsonb_build_object('hours', 24)),
    (new.id, 'inactivity_flag', true, jsonb_build_object('days', 14, 'tag', 'يحتاج متابعة'))
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_workspace_created_seed_automations on public.workspaces;
create trigger on_workspace_created_seed_automations
  after insert on public.workspaces
  for each row execute procedure public.seed_default_automation_rules();

-- ---------------------------------------------------------------------
-- 3) Round-robin (load-balanced) lead auto-assignment.
-- ---------------------------------------------------------------------
create or replace function public.auto_assign_new_lead()
returns trigger as $$
declare
  v_auto_assign boolean;
  v_agent uuid;
begin
  if new.assigned_to is not null then
    return new;
  end if;

  select auto_assign_leads into v_auto_assign
  from public.workspaces where id = new.workspace_id;

  if not coalesce(v_auto_assign, false) then
    return new;
  end if;

  -- Pick the member with the fewest currently-open leads (ties broken
  -- by user_id for a stable, deterministic order) — self-balancing,
  -- no rotation cursor to store/maintain.
  select wm.user_id into v_agent
  from public.workspace_members wm
  left join public.leads l
    on l.assigned_to = wm.user_id
    and l.workspace_id = new.workspace_id
    and l.status not in ('won', 'lost')
    and l.deleted_at is null
  where wm.workspace_id = new.workspace_id
  group by wm.user_id
  order by count(l.id) asc, wm.user_id asc
  limit 1;

  if v_agent is not null then
    new.assigned_to = v_agent;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_lead_created_auto_assign on public.leads;
create trigger on_lead_created_auto_assign
  before insert on public.leads
  for each row execute procedure public.auto_assign_new_lead();
