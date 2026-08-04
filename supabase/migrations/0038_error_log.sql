-- =====================================================================
-- Phase 38 — Self-hosted error monitoring (architecture review 7.3).
--
-- "لا تترك أي نقطة فقط لأنها تحتاج API مدفوع" — Sentry-class services
-- need a separate external account either way, so instead of a code
-- integration that stays inert until someone signs up for one, this
-- builds the equivalent capability directly on infrastructure already
-- in place (Postgres + RLS), needing zero new accounts or dependencies:
-- client/server error boundaries POST to a same-origin API route,
-- which inserts here using the service-role client (errors can happen
-- before/without a session, e.g. the root global-error boundary, so
-- this can't be gated by a normal authenticated-user RLS insert
-- policy — same reasoning as lead_activities being trigger-only).
-- Owner/admin can read their own workspace's errors; nothing here
-- replaces a real APM for stack symbolication/alerting/trends at
-- scale, but it means a production error is no longer invisible
-- unless a user happens to complain.
-- =====================================================================

create table if not exists public.error_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  stack text,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists error_log_workspace_idx on public.error_log (workspace_id, created_at desc);

alter table public.error_log enable row level security;

drop policy if exists "error_log_select_admin" on public.error_log;
create policy "error_log_select_admin"
  on public.error_log for select
  using (workspace_id is not null and public.is_workspace_admin(workspace_id));

-- No insert/update/delete policy for any client role — every write
-- goes through the service-role client in app/api/log-error/route.ts.

-- Same daily cleanup cadence as the other operational logs (0030) —
-- errors older than 30 days are just noise for a self-hosted tool
-- like this.
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

  delete from public.leads
  where deleted_at is not null
    and deleted_at < now() - interval '30 days';

  delete from public.error_log
  where created_at < now() - interval '30 days';
end;
$$;
