-- =====================================================================
-- PWA Push Notifications — purely additive infrastructure.
--
-- Does NOT modify any existing table, function, or trigger. Every
-- notification in this app already flows through one place —
-- `insert into public.notifications` inside
-- `notify_workspace_members()` (migration 0012) and nowhere else (the
-- `notifications` table has no client-facing INSERT policy). So
-- instead of touching notify_new_lead/notify_new_campaign/etc., a
-- single AFTER INSERT trigger on `public.notifications` itself is
-- enough to cover every current and future notification type.
-- =====================================================================

-- ---------------------------------------------------------------------
-- push_subscriptions: one row per browser/device the user has
-- enabled push on (a user can have several — phone + laptop, etc.).
-- Mirrors the RLS pattern used everywhere else in this project: a user
-- can only ever see/manage their own rows.
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (user_id = (select auth.uid()));

-- No UPDATE policy: a changed subscription (new endpoint/keys) is
-- represented as delete-old + insert-new by the client, never a
-- partial update.

-- ---------------------------------------------------------------------
-- notification_preferences: per-user opt-in/out, separate from
-- push_subscriptions so "push is off" survives even after the last
-- device unsubscribes, and so per-category muting has somewhere to
-- live without a schema change later.
-- ---------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  muted_types text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  using (user_id = (select auth.uid()));

drop policy if exists "notification_preferences_upsert_own" on public.notification_preferences;
create policy "notification_preferences_upsert_own"
  on public.notification_preferences for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- app_config: tiny generic key/value store so the trigger below knows
-- where to POST (the Edge Function URL) and how to authenticate to it,
-- without hardcoding project-specific values into a migration file.
-- Set these once after deploying the `send-push` Edge Function:
--
--   insert into public.app_config (key, value) values
--     ('push_function_url', 'https://<project-ref>.functions.supabase.co/send-push'),
--     ('push_function_secret', '<a long random string, same one set as the PUSH_TRIGGER_SECRET Edge Function secret>')
--   on conflict (key) do update set value = excluded.value;
--
-- Never selectable by clients — service-role/definer access only.
-- ---------------------------------------------------------------------
create table if not exists public.app_config (
  key text primary key,
  value text not null
);

alter table public.app_config enable row level security;
-- Intentionally no policies at all: RLS enabled with zero policies
-- means it's inaccessible via PostgREST to every role except the
-- service role (which bypasses RLS) — exactly what a secrets-adjacent
-- table needs.

-- ---------------------------------------------------------------------
-- Trigger: fires on every new notification row (any type, any current
-- or future insert path) and asks pg_net to POST it to the Edge
-- Function, which does the actual Web Push send. Defensive by design:
-- wrapped in its own exception handler so a missing extension, an
-- unconfigured app_config row, or a network hiccup can NEVER roll back
-- or fail the notification insert itself — push delivery is
-- best-effort on top of the in-app notification, never a dependency
-- of it.
-- ---------------------------------------------------------------------
create or replace function public.queue_push_notification() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_url text;
  v_secret text;
  v_muted text[];
  v_push_enabled boolean;
begin
  select value into v_url from public.app_config where key = 'push_function_url';
  if v_url is null then
    return new; -- not configured yet — no-op
  end if;
  select value into v_secret from public.app_config where key = 'push_function_secret';

  select push_enabled, muted_types into v_push_enabled, v_muted
  from public.notification_preferences where user_id = new.user_id;

  if v_push_enabled is false then
    return new;
  end if;
  if v_muted is not null and new.type = any(v_muted) then
    return new;
  end if;

  begin
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(v_secret, '')
      ),
      body := jsonb_build_object(
        'notification_id', new.id,
        'user_id', new.user_id,
        'type', new.type,
        'title', new.title,
        'body', new.body,
        'link', new.link
      )
    );
  exception when others then
    -- pg_net not installed, function unreachable, etc. — never break
    -- the notification insert over a best-effort push send.
    null;
  end;

  return new;
end;
$$;

revoke all on function public.queue_push_notification from public;

drop trigger if exists on_notification_created_push on public.notifications;
create trigger on_notification_created_push
  after insert on public.notifications
  for each row execute procedure public.queue_push_notification();
