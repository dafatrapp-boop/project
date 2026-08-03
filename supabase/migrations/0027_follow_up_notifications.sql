-- =====================================================================
-- Scheduled Follow-up notifications — root cause of "saved
-- successfully, appears in the database, but no push notification
-- ever arrives": `lead_follow_ups` (the "متابعات" feature on the lead
-- detail page, pre-dating the reminders engine in migration 0024) has
-- NEVER had any notification trigger wired to it. It is, and always
-- was, a pull-only table — the dashboard's "متابعات تحتاج إلى إجراء"
-- widget reads `due_at <= now()` on page load; nothing ever converted
-- "due now" into a push. This is a different table from `reminders`
-- (migration 0024), which is why Instant Reminders already worked
-- while Scheduled Follow-ups did not — they were never the same
-- pipeline.
--
-- Fix: give lead_follow_ups the same pg_cron-driven treatment as
-- reminders, reusing notify_workspace_members() (already used by
-- notify_new_lead/notify_new_campaign) so this rides the exact same,
-- already-working notifications -> push pipeline. No changes needed
-- to send-push, the push trigger, or the reminders table at all.
-- =====================================================================

alter table public.lead_follow_ups add column if not exists notified_at timestamptz;

-- Mirrors reminders_due_idx's shape: a small partial index over only
-- the rows the scheduler actually needs to look at.
create index if not exists lead_follow_ups_due_notify_idx
  on public.lead_follow_ups (due_at)
  where completed_at is null and notified_at is null;

create or replace function public.process_due_follow_ups(p_batch_size int default 50)
returns table(follow_up_id uuid, outcome text)
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  for r in
    select f.id, f.workspace_id, f.lead_id, f.note, l.full_name as lead_full_name
    from public.lead_follow_ups f
    join public.leads l on l.id = f.lead_id
    where f.completed_at is null
      and f.notified_at is null
      and f.due_at <= now()
    order by f.due_at asc
    limit p_batch_size
    for update of f skip locked
  loop
    begin
      -- Claim first — if notify_workspace_members below throws, the
      -- exception handler resets this to null so the next cron tick
      -- retries it naturally. Simpler than reminders' retry_count/
      -- backoff bookkeeping since this is a one-shot "did this ever
      -- fire" flag, not a multi-attempt delivery record.
      update public.lead_follow_ups set notified_at = now() where id = r.id;

      perform public.notify_workspace_members(
        r.workspace_id,
        'reminder_lead_followup',
        'موعد متابعة: ' || r.lead_full_name,
        coalesce(r.note, 'حان وقت المتابعة مع هذا العميل.'),
        '/leads/' || r.lead_id::text
      );

      follow_up_id := r.id;
      outcome := 'notified';
      return next;
    exception when others then
      update public.lead_follow_ups set notified_at = null where id = r.id;
      follow_up_id := r.id;
      outcome := 'failed';
      return next;
    end;
  end loop;
  return;
end;
$$;

revoke all on function public.process_due_follow_ups from public;
grant execute on function public.process_due_follow_ups to service_role;

do $$
begin
  perform cron.unschedule('process-due-follow-ups');
exception when others then
  null; -- job didn't exist yet, or pg_cron isn't installed — fine either way
end $$;

do $$
begin
  perform cron.schedule(
    'process-due-follow-ups',
    '* * * * *',
    $cron$select public.process_due_follow_ups();$cron$
  );
exception when others then
  raise notice 'Could not schedule process-due-follow-ups via pg_cron — see migration 0024''s note on enabling pg_cron.';
end $$;
