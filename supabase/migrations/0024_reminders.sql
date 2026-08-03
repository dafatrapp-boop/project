-- =====================================================================
-- CRM Reminder Engine — the missing piece identified by the PWA/
-- reminder audit: nothing in this project previously fired anything at
-- a *scheduled future time*. `lead_follow_ups` and `appointments` are
-- pull-based (a page queries `due_at <= now()` on load); nothing ever
-- pushed a notification when that time actually arrived, and neither
-- table stores a timezone or any delivery-tracking columns.
--
-- This migration adds a dedicated, timezone-aware `reminders` table
-- plus a scheduler (`pg_cron`, running entirely inside Postgres — see
-- note near the bottom on why this was chosen over a Vercel Cron-only
-- design) that detects due reminders and rides the EXISTING push
-- pipeline (`public.notifications` → `on_notification_created_push`
-- trigger → send-push Edge Function, migration 0023) — no changes to
-- that pipeline are needed for delivery to work.
-- =====================================================================

-- ---------------------------------------------------------------------
-- reminders: one row per scheduled reminder. Optionally linked to a
-- lead, an appointment ("task"), and/or a campaign — all nullable
-- because a "custom" reminder may not reference any CRM entity at all.
-- ---------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  -- "task" in the sense the product brief uses it maps to this
  -- project's existing appointments table — there is no separate
  -- generic task table.
  task_id uuid references public.appointments(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  reminder_type text not null default 'custom'
    check (reminder_type in (
      'lead_followup', 'call', 'meeting', 'task', 'callback',
      'campaign', 'sales_activity', 'custom'
    )),
  title text not null,
  description text,
  -- The time the user actually chose, always stored as an absolute
  -- instant (timestamptz/UTC on disk) — `timezone` is kept alongside
  -- purely so the UI can redisplay "10:00 AM your time" correctly;
  -- comparisons always happen in UTC, never string/local time.
  scheduled_at timestamptz not null,
  timezone text not null default 'UTC',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  -- Distinct from scheduled_at: this is "when the scheduler should
  -- next look at this row", which only ever differs from scheduled_at
  -- after a failed attempt (retry backoff). scheduled_at itself is
  -- never mutated after creation, so it always reflects what the user
  -- actually asked for.
  next_attempt_at timestamptz not null,
  processed_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  retry_count smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backstops next_attempt_at for any insert path that doesn't set it
-- explicitly (it should always start equal to scheduled_at).
create or replace function public.reminders_default_next_attempt()
returns trigger
language plpgsql
as $$
begin
  if new.next_attempt_at is null then
    new.next_attempt_at := new.scheduled_at;
  end if;
  return new;
end;
$$;

drop trigger if exists reminders_default_next_attempt on public.reminders;
create trigger reminders_default_next_attempt
  before insert on public.reminders
  for each row execute procedure public.reminders_default_next_attempt();

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute procedure public.set_updated_at();

-- The one index the scheduler's query actually needs — a partial
-- index over only 'pending' rows keeps it small regardless of how
-- many sent/failed reminders accumulate over time.
create index if not exists reminders_due_idx
  on public.reminders (next_attempt_at)
  where status = 'pending';

create index if not exists reminders_workspace_scheduled_idx
  on public.reminders (workspace_id, scheduled_at desc);

create index if not exists reminders_user_scheduled_idx
  on public.reminders (user_id, scheduled_at desc);

create index if not exists reminders_lead_idx
  on public.reminders (lead_id)
  where lead_id is not null;

alter table public.reminders enable row level security;

-- Same visibility pattern as lead_follow_ups: any workspace member can
-- see and manage reminders (a team's scheduled activities are shared
-- context), deletion restricted to admins or the reminder's own owner.
drop policy if exists "reminders_select_member" on public.reminders;
create policy "reminders_select_member"
  on public.reminders for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "reminders_insert_member" on public.reminders;
create policy "reminders_insert_member"
  on public.reminders for insert
  with check (public.is_workspace_member(workspace_id) and user_id = (select auth.uid()));

drop policy if exists "reminders_update_member" on public.reminders;
create policy "reminders_update_member"
  on public.reminders for update
  using (public.is_workspace_member(workspace_id));

drop policy if exists "reminders_delete_owner_or_admin" on public.reminders;
create policy "reminders_delete_owner_or_admin"
  on public.reminders for delete
  using (public.is_workspace_admin(workspace_id) or user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- process_due_reminders(): the scheduler's entire job in one function.
-- Claims due rows (FOR UPDATE SKIP LOCKED — safe under overlapping
-- invocations), inserts one row into the existing `notifications`
-- table per reminder (which automatically triggers the existing push
-- pipeline — no changes needed there), and tracks the outcome with
-- bounded exponential-backoff retries so a transient failure can never
-- silently drop a reminder.
--
-- Also recovers rows stuck in 'processing' for over 10 minutes — the
-- one edge case row-locking alone doesn't cover: a previous run that
-- crashed mid-batch (e.g. statement timeout) between claiming a row
-- and marking it sent/failed. Without this, that single row would
-- never be retried again.
-- ---------------------------------------------------------------------
create or replace function public.process_due_reminders(p_batch_size int default 50)
returns table(reminder_id uuid, outcome text)
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  v_link text;
  v_max_retries constant smallint := 5;
  v_backoff_minutes int;
begin
  for r in
    select *
    from public.reminders
    where (status = 'pending' and next_attempt_at <= now())
       or (status = 'processing' and processed_at < now() - interval '10 minutes')
    order by next_attempt_at asc
    limit p_batch_size
    for update skip locked
  loop
    begin
      update public.reminders
        set status = 'processing', processed_at = now()
        where id = r.id;

      v_link := case
        when r.lead_id is not null then '/leads/' || r.lead_id::text
        when r.task_id is not null then '/appointments'
        when r.campaign_id is not null then '/campaigns/' || r.campaign_id::text
        else '/dashboard'
      end;

      insert into public.notifications (workspace_id, user_id, type, title, body, link)
      values (r.workspace_id, r.user_id, 'reminder_' || r.reminder_type, r.title, r.description, v_link);

      update public.reminders
        set status = 'sent', sent_at = now()
        where id = r.id;

      reminder_id := r.id;
      outcome := 'sent';
      return next;
    exception when others then
      v_backoff_minutes := power(2::numeric, (r.retry_count + 1)::numeric)::int; -- 2,4,8,16,32 minutes
      if r.retry_count + 1 >= v_max_retries then
        update public.reminders
          set status = 'failed',
              failed_at = now(),
              retry_count = retry_count + 1,
              last_error = sqlerrm
          where id = r.id;
        outcome := 'failed';
      else
        update public.reminders
          set status = 'pending',
              failed_at = now(),
              retry_count = retry_count + 1,
              next_attempt_at = now() + (v_backoff_minutes || ' minutes')::interval,
              last_error = sqlerrm
          where id = r.id;
        outcome := 'retry_scheduled';
      end if;
      reminder_id := r.id;
      return next;
    end;
  end loop;
  return;
end;
$$;

revoke all on function public.process_due_reminders from public;
grant execute on function public.process_due_reminders to service_role;

-- ---------------------------------------------------------------------
-- Scheduler: pg_cron, running every minute, entirely inside Postgres.
--
-- Deliberately NOT a Vercel Cron-only design. Vercel's Hobby plan
-- restricts cron jobs to once per day — nowhere near enough resolution
-- for "remind me in 5 minutes." Running the scheduler as pg_cron
-- inside the same Postgres instance that already stores the reminders
-- sidesteps that platform limit entirely and needs no separate compute
-- to stay up. A Vercel Cron-compatible route (app/api/cron/reminders)
-- still exists as a secondary trigger — see that file — for
-- environments where pg_cron isn't available (self-hosted Postgres,
-- or a Supabase plan/project where it hasn't been enabled), and as a
-- manually-triggerable path for testing.
--
-- If `create extension pg_cron` fails (some self-hosted Postgres
-- installs don't ship it), this block degrades gracefully — the table
-- and function above are still created; only the automatic scheduling
-- is skipped. In that case, either enable pg_cron from the Supabase
-- Dashboard → Database → Extensions and re-run the `cron.schedule`
-- call below manually, or rely on the Vercel Cron route instead.
-- ---------------------------------------------------------------------
-- pg_cron is not relocatable — it always creates its own `cron` schema
-- regardless of any WITH SCHEMA clause, so its functions are always
-- called as cron.schedule(...) / cron.unschedule(...).
do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron extension unavailable — relying on the Vercel Cron route (app/api/cron/reminders) instead. See migration 0024 comment for details.';
end $$;

do $$
begin
  perform cron.unschedule('process-due-reminders');
exception when others then
  null; -- job didn't exist yet, or pg_cron isn't installed — fine either way
end $$;

do $$
begin
  perform cron.schedule(
    'process-due-reminders',
    '* * * * *',
    $cron$select public.process_due_reminders();$cron$
  );
exception when others then
  raise notice 'Could not schedule process-due-reminders via pg_cron — see migration 0024 comment.';
end $$;
