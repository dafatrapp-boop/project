-- =====================================================================
-- Push delivery logging — addresses the audit's top-severity finding
-- on the notification pipeline: the send-push Edge Function's
-- {sent, total} response was never read by anything, and the trigger
-- that calls it (queue_push_notification, migration 0023) discards any
-- failure via `exception when others then null` by design (correctly
-- so — a push failure must never roll back the notification itself).
-- The result was zero visibility into whether pushes actually reach
-- devices. This table gives the Edge Function somewhere to write a
-- per-subscription delivery outcome; nothing upstream needs to change.
-- =====================================================================

create table if not exists public.push_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete cascade,
  -- Deliberately NOT a foreign key: a failed send often deletes the
  -- subscription in the same request (404/410 = gone), and this log
  -- should still record which endpoint that was attempted against
  -- rather than fail an insert or cascade-null it away.
  subscription_id uuid,
  success boolean not null,
  status_code int,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists push_delivery_log_notification_idx
  on public.push_delivery_log (notification_id);

create index if not exists push_delivery_log_created_idx
  on public.push_delivery_log (created_at desc);

alter table public.push_delivery_log enable row level security;

-- A user can see delivery history for notifications addressed to them
-- (useful for a future "why didn't I get this" debug view) — nothing
-- writes here except the Edge Function's service-role client, same
-- no-client-insert pattern as push_subscriptions/notifications.
drop policy if exists "push_delivery_log_select_own" on public.push_delivery_log;
create policy "push_delivery_log_select_own"
  on public.push_delivery_log for select
  using (
    exists (
      select 1 from public.notifications n
      where n.id = push_delivery_log.notification_id
        and n.user_id = (select auth.uid())
    )
  );
