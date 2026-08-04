-- =====================================================================
-- Phase 30 — Data retention for the two purely-operational log tables
-- (architecture review, item 8 / "log-like tables with no retention
-- policy"). Scoped deliberately narrow:
--
--   * form_submission_log — write-only bookkeeping for the public form
--     rate limiter (max 5 submissions/hour/IP, see 0004_forms.sql). A
--     row has zero value once it falls outside that 1-hour window; kept
--     forever it just grows without bound on any workspace that gets
--     real ad traffic. Safe to hard-delete after 24h (a full day of
--     margin past the 1h window it's actually checked against).
--   * notifications — once read, a notification has no further product
--     purpose; kept forever it's the single fastest-growing table in a
--     workspace with a busy team. Deletes only READ notifications older
--     than 90 days, never unread ones, so nothing a user hasn't seen
--     yet can silently disappear.
--
-- Deliberately NOT touched here: lead_activities / workspace_activity_log
-- — those are audit trails, not disposable logs, and the review itself
-- says a real retention policy for them (e.g. time-based partitioning)
-- needs a product decision on how long history must be kept, not a
-- blind delete. Flagged as a follow-up in the final report instead of
-- guessed at here.
-- =====================================================================

create or replace function public.cleanup_expired_operational_logs()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.form_submission_log
  where created_at < now() - interval '24 hours';

  delete from public.notifications
  where read_at is not null
    and read_at < now() - interval '90 days';
end;
$$;

revoke all on function public.cleanup_expired_operational_logs from public;

do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron extension unavailable — operational log tables (form_submission_log, read notifications) will grow unbounded until pg_cron is enabled or this is run manually.';
end $$;

do $$
begin
  perform cron.unschedule('cleanup-expired-operational-logs');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.schedule(
    'cleanup-expired-operational-logs',
    '0 3 * * *', -- once daily at 03:00 UTC, low-traffic hours
    $cron$select public.cleanup_expired_operational_logs();$cron$
  );
exception when others then
  raise notice 'Could not schedule cleanup-expired-operational-logs via pg_cron — see migration 0030 comment.';
end $$;
