-- =====================================================================
-- SocialSales OS — Phase 19: Internal Automation
--
-- Four fixed, pre-built rule types (not a generic workflow/rule
-- builder) — each just toggled on/off with 1-2 config values. Two are
-- event-driven (fire instantly via trigger); the two that depend on
-- elapsed time are checked opportunistically, the same "no pg_cron
-- available" pattern already used by check_plan_expiry_notification
-- in 0012_activity_notifications_tags.sql, called once per relevant
-- page load (see lib/automation and the leads/dashboard pages).
-- =====================================================================

create type public.automation_rule_type as enum (
  'lead_stale_reminder',   -- New lead untouched for N hours -> follow-up reminder
  'interested_followup',   -- Lead becomes Interested -> follow-up in N days
  'campaign_tag',          -- Lead came from campaign X -> auto-tag
  'inactivity_flag'        -- No activity for N days -> tag as needing attention
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  rule_type public.automation_rule_type not null,
  enabled boolean not null default true,
  -- Small, rule-specific config, e.g. {"hours":24} or {"campaign_id":"...","tag":"..."}
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index automation_rules_workspace_idx on public.automation_rules (workspace_id);

alter table public.automation_rules enable row level security;

create policy "automation_rules_select_member"
  on public.automation_rules for select
  using (public.is_workspace_member(workspace_id));

create policy "automation_rules_insert_admin"
  on public.automation_rules for insert
  with check (public.is_workspace_admin(workspace_id));

create policy "automation_rules_update_admin"
  on public.automation_rules for update
  using (public.is_workspace_admin(workspace_id));

create policy "automation_rules_delete_admin"
  on public.automation_rules for delete
  using (public.is_workspace_admin(workspace_id));

create trigger automation_rules_set_updated_at
  before update on public.automation_rules
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- automation_log: fire-once bookkeeping for the two time-based rules,
-- so re-running run_workspace_automations on every page load never
-- creates duplicate reminders for the same lead/rule.
-- ---------------------------------------------------------------------
create table public.automation_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  rule_type public.automation_rule_type not null,
  created_at timestamptz not null default now(),
  unique (lead_id, rule_type)
);

alter table public.automation_log enable row level security;

create policy "automation_log_select_member"
  on public.automation_log for select
  using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------
-- Event-driven rule 1: lead becomes "interested" -> follow-up in N days.
-- ---------------------------------------------------------------------
create or replace function public.apply_interested_followup_rule()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  if new.status = 'interested' and (old.status is distinct from 'interested') then
    for r in
      select * from public.automation_rules
      where workspace_id = new.workspace_id and rule_type = 'interested_followup' and enabled = true
    loop
      insert into public.automation_log (workspace_id, lead_id, rule_type)
      values (new.workspace_id, new.id, 'interested_followup')
      on conflict (lead_id, rule_type) do nothing;

      if found then
        insert into public.lead_follow_ups (lead_id, workspace_id, due_at, note)
        values (
          new.id,
          new.workspace_id,
          now() + make_interval(days => coalesce((r.config->>'days')::int, 3)),
          'متابعة تلقائية: العميل أصبح مهتمًا'
        );
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_lead_interested_followup
  after update on public.leads
  for each row execute procedure public.apply_interested_followup_rule();

-- ---------------------------------------------------------------------
-- Event-driven rule 2: lead created from a specific campaign -> tag.
-- ---------------------------------------------------------------------
create or replace function public.apply_campaign_tag_rule()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  if new.campaign_id is not null then
    for r in
      select * from public.automation_rules
      where workspace_id = new.workspace_id
        and rule_type = 'campaign_tag'
        and enabled = true
        and (config->>'campaign_id')::uuid = new.campaign_id
    loop
      if r.config->>'tag' is not null and not (r.config->>'tag' = any(new.tags)) then
        update public.leads set tags = array_append(tags, r.config->>'tag') where id = new.id;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_lead_created_campaign_tag
  after insert on public.leads
  for each row execute procedure public.apply_campaign_tag_rule();

-- ---------------------------------------------------------------------
-- Opportunistic (time-based) rules: called from app code on page load,
-- not by a real scheduler. Membership check is required here (unlike
-- the trigger-driven rules above) because this is a directly
-- client-callable RPC.
-- ---------------------------------------------------------------------
create or replace function public.run_workspace_automations(p_workspace_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  lead_row record;
begin
  if not public.is_workspace_member(p_workspace_id) then
    return;
  end if;

  -- Rule: lead stuck in "new" for more than N hours -> reminder follow-up.
  for r in
    select * from public.automation_rules
    where workspace_id = p_workspace_id and rule_type = 'lead_stale_reminder' and enabled = true
  loop
    for lead_row in
      select l.id from public.leads l
      where l.workspace_id = p_workspace_id
        and l.status = 'new'
        and l.created_at < now() - make_interval(hours => coalesce((r.config->>'hours')::int, 24))
        and not exists (
          select 1 from public.automation_log al
          where al.lead_id = l.id and al.rule_type = 'lead_stale_reminder'
        )
    loop
      insert into public.automation_log (workspace_id, lead_id, rule_type)
      values (p_workspace_id, lead_row.id, 'lead_stale_reminder')
      on conflict (lead_id, rule_type) do nothing;

      if found then
        insert into public.lead_follow_ups (lead_id, workspace_id, due_at, note)
        values (lead_row.id, p_workspace_id, now(), 'تذكير تلقائي: لا رد منذ فترة وهو بحالة "جديد"');
      end if;
    end loop;
  end loop;

  -- Rule: no activity for N days (and not won/lost) -> tag for attention.
  for r in
    select * from public.automation_rules
    where workspace_id = p_workspace_id and rule_type = 'inactivity_flag' and enabled = true
  loop
    for lead_row in
      select l.id from public.leads l
      where l.workspace_id = p_workspace_id
        and l.status not in ('won', 'lost')
        and not (coalesce(r.config->>'tag', 'يحتاج متابعة') = any(l.tags))
        and coalesce(
              (select max(a.created_at) from public.lead_activities a where a.lead_id = l.id),
              l.created_at
            ) < now() - make_interval(days => coalesce((r.config->>'days')::int, 14))
    loop
      update public.leads
      set tags = array_append(tags, coalesce(r.config->>'tag', 'يحتاج متابعة'))
      where id = lead_row.id;
    end loop;
  end loop;
end;
$$;

revoke all on function public.run_workspace_automations from public;
grant execute on function public.run_workspace_automations to authenticated;
