-- =====================================================================
-- Phase 29 — Real scheduler for time-based automation rules
-- (gaps-checklist review, item 5.2 / architecture review item 6).
--
-- `run_workspace_automations(p_workspace_id)` (0019_automation.sql)
-- implements two genuinely time-based rules ("lead sat in 'new' for N
-- hours", "no activity for N days") but was only ever invoked
-- opportunistically — from the dashboard page load and a manual "run
-- now" button. A workspace nobody opens for a week just never gets
-- these checks run, silently, with no error anywhere.
--
-- This migration does NOT change that function's rules or its
-- client-callable membership-checked entry point (still used by the
-- manual "run now" action) — it factors the rule logic into an
-- internal function with no membership check (trusted, only reachable
-- from other SECURITY DEFINER code), adds a fan-out function that runs
-- it for every workspace, and schedules that fan-out with pg_cron —
-- the exact same pattern already established for reminders in
-- 0024_reminders.sql (pg_cron primary, with graceful degradation if
-- the extension isn't available in a given environment).
-- =====================================================================

create or replace function public.run_workspace_automations_internal(p_workspace_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  lead_row record;
begin
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

revoke all on function public.run_workspace_automations_internal from public;

-- Client-facing entry point (manual "run now" button) — unchanged
-- behavior, still membership-checked, now just delegates to the shared
-- internal implementation instead of duplicating the rule logic.
create or replace function public.run_workspace_automations(p_workspace_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_workspace_member(p_workspace_id) then
    return;
  end if;
  perform public.run_workspace_automations_internal(p_workspace_id);
end;
$$;

revoke all on function public.run_workspace_automations from public;
grant execute on function public.run_workspace_automations to authenticated;

-- Fan-out: run the internal (unchecked) function for every workspace.
-- Only ever invoked by pg_cron (postgres role) — never exposed to
-- authenticated/anon.
create or replace function public.run_all_workspace_automations()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  ws record;
begin
  for ws in select id from public.workspaces loop
    perform public.run_workspace_automations_internal(ws.id);
  end loop;
end;
$$;

revoke all on function public.run_all_workspace_automations from public;

-- ---------------------------------------------------------------------
-- Scheduler: pg_cron, every 15 minutes — frequent enough that "stale
-- lead" / "inactivity" rules fire close to their configured threshold
-- without needing per-minute resolution these rules don't need.
-- ---------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron extension unavailable — time-based automation rules will only run when a user opens the dashboard or clicks "run now". Enable pg_cron from the Supabase Dashboard to close this gap.';
end $$;

do $$
begin
  perform cron.unschedule('run-all-workspace-automations');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.schedule(
    'run-all-workspace-automations',
    '*/15 * * * *',
    $cron$select public.run_all_workspace_automations();$cron$
  );
exception when others then
  raise notice 'Could not schedule run-all-workspace-automations via pg_cron — see migration 0029 comment.';
end $$;
