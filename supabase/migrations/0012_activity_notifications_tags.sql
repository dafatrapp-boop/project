-- =====================================================================
-- SocialSales OS — Requested feature batch: tags, activity log,
-- notifications, plan expiry, duplicate detection support
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lead tags (VIP / hot / cold / custom). Simple text array rather than
-- a join table — tags here are free-form workspace-level labels, not
-- a managed taxonomy, so this keeps it simple without over-building.
-- ---------------------------------------------------------------------
do $$ begin
  alter table public.leads add column tags text[] not null default '{}';
exception when duplicate_column then null;
end $$;
create index if not exists leads_tags_idx on public.leads using gin (tags);

-- ---------------------------------------------------------------------
-- workspace_activity_log: "who did what" audit trail at the workspace
-- level (page edited/deleted, lead deleted, member added/removed) —
-- distinct from lead_activities (Phase 2), which is per-lead only.
-- Written exclusively by SECURITY DEFINER triggers below, same
-- tamper-resistance pattern as lead_activities: no direct INSERT
-- policy, so a member can't fabricate a fake log entry.
-- ---------------------------------------------------------------------
create table if not exists public.workspace_activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null, -- e.g. 'landing_page_updated', 'lead_deleted', 'member_added'
  entity_type text not null, -- 'landing_page' | 'lead' | 'member' | 'campaign'
  entity_label text, -- human-readable name captured at the time of the action
  created_at timestamptz not null default now()
);

create index if not exists workspace_activity_log_idx on public.workspace_activity_log (workspace_id, created_at desc);

alter table public.workspace_activity_log enable row level security;

drop policy if exists "activity_log_select_member" on public.workspace_activity_log;
create policy "activity_log_select_member"
  on public.workspace_activity_log for select
  using (public.is_workspace_member(workspace_id));

-- Generic logger used by the triggers below.
--
-- SECURITY NOTE: this function takes a raw workspace_id with NO
-- membership check inside it — that's safe ONLY because it is never
-- meant to be called directly by a client. It must stay restricted to
-- being called from inside other SECURITY DEFINER trigger functions
-- (which still works after the revoke below: a SECURITY DEFINER
-- function's nested calls run under its owner's privileges,
-- independent of the calling role's own grants). If this were left at
-- Postgres's default PUBLIC-executable grant, any authenticated user
-- could forge fake audit-log entries in ANY workspace by calling it
-- directly via RPC — same class of gap the Phase 10 audit found and
-- fixed for is_workspace_member/is_workspace_admin.
create or replace function public.log_workspace_activity(
  p_workspace_id uuid, p_action text, p_entity_type text, p_entity_label text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.workspace_activity_log (workspace_id, actor_id, action, entity_type, entity_label)
  values (p_workspace_id, auth.uid(), p_action, p_entity_type, p_entity_label);
end;
$$;

revoke all on function public.log_workspace_activity from public;
-- Intentionally no grant to anon/authenticated either — this is
-- internal-only, called solely from the trigger functions below.

create or replace function public.log_landing_page_change() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    perform public.log_workspace_activity(new.workspace_id, 'landing_page_updated', 'landing_page', new.title);
  elsif tg_op = 'DELETE' then
    perform public.log_workspace_activity(old.workspace_id, 'landing_page_deleted', 'landing_page', old.title);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_landing_page_update_log on public.landing_pages;
create trigger on_landing_page_update_log
  after update on public.landing_pages
  for each row execute procedure public.log_landing_page_change();

drop trigger if exists on_landing_page_delete_log on public.landing_pages;
create trigger on_landing_page_delete_log
  after delete on public.landing_pages
  for each row execute procedure public.log_landing_page_change();

create or replace function public.log_lead_delete() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.log_workspace_activity(old.workspace_id, 'lead_deleted', 'lead', old.full_name);
  return old;
end;
$$;

drop trigger if exists on_lead_delete_log on public.leads;
create trigger on_lead_delete_log
  before delete on public.leads
  for each row execute procedure public.log_lead_delete();

create or replace function public.log_member_change() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = coalesce(new.user_id, old.user_id);
  if tg_op = 'INSERT' then
    perform public.log_workspace_activity(new.workspace_id, 'member_added', 'member', v_email);
  elsif tg_op = 'DELETE' then
    perform public.log_workspace_activity(old.workspace_id, 'member_removed', 'member', v_email);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_member_insert_log on public.workspace_members;
create trigger on_member_insert_log
  after insert on public.workspace_members
  for each row execute procedure public.log_member_change();

drop trigger if exists on_member_delete_log on public.workspace_members;
create trigger on_member_delete_log
  after delete on public.workspace_members
  for each row execute procedure public.log_member_change();

-- ---------------------------------------------------------------------
-- notifications: fanned out one row per recipient (not a nullable
-- "broadcast" row) — this keeps per-user read/unread state trivial to
-- query and to RLS-protect (a user only ever sees their own rows).
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'new_lead' | 'new_campaign' | 'plan_expiring' | 'other'
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

-- No INSERT policy: notifications are only ever created by the
-- SECURITY DEFINER trigger functions below, never directly by a client
-- (so a user can't spoof a notification into someone else's inbox).

create or replace function public.notify_workspace_members(
  p_workspace_id uuid, p_type text, p_title text, p_body text, p_link text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (workspace_id, user_id, type, title, body, link)
  select p_workspace_id, wm.user_id, p_type, p_title, p_body, p_link
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id;
end;
$$;

-- Same reasoning as log_workspace_activity above: raw workspace_id, no
-- membership check inside — must stay internal-only (called only from
-- notify_new_lead/notify_new_campaign triggers below), never directly
-- RPC-callable, or anyone could spam fake notifications (e.g. a
-- phishing link) to every member of any workspace.
revoke all on function public.notify_workspace_members from public;

create or replace function public.notify_new_lead() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_workspace_members(
    new.workspace_id, 'new_lead', 'عميل محتمل جديد',
    new.full_name, '/leads/' || new.id::text
  );
  return new;
end;
$$;

drop trigger if exists on_lead_created_notify on public.leads;
create trigger on_lead_created_notify
  after insert on public.leads
  for each row execute procedure public.notify_new_lead();

create or replace function public.notify_new_campaign() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_workspace_members(
    new.workspace_id, 'new_campaign', 'تم إنشاء حملة جديدة',
    new.name, '/campaigns/' || new.id::text
  );
  return new;
end;
$$;

drop trigger if exists on_campaign_created_notify on public.campaigns;
create trigger on_campaign_created_notify
  after insert on public.campaigns
  for each row execute procedure public.notify_new_campaign();

-- ---------------------------------------------------------------------
-- Plan expiry: adds the column a real subscription needs. There is no
-- background cron job checking this on a schedule (that needs pg_cron
-- scheduling, an infra decision left for go-live setup) — instead,
-- this function is called opportunistically from the dashboard page
-- load (see app code) and only creates one notification per 24h so it
-- can't spam on every page view.
-- ---------------------------------------------------------------------
do $$ begin
  alter table public.workspaces add column plan_expires_at timestamptz;
exception when duplicate_column then null;
end $$;

create or replace function public.check_plan_expiry_notification(p_workspace_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_expires_at timestamptz;
  v_already_notified boolean;
begin
  select plan_expires_at into v_expires_at from public.workspaces where id = p_workspace_id;
  if v_expires_at is null or v_expires_at > now() + interval '3 days' then
    return;
  end if;

  select exists(
    select 1 from public.notifications
    where workspace_id = p_workspace_id and type = 'plan_expiring'
      and created_at > now() - interval '24 hours'
  ) into v_already_notified;

  if not v_already_notified then
    perform public.notify_workspace_members(
      p_workspace_id, 'plan_expiring', 'اشتراكك على وشك الانتهاء',
      'يرجى التجديد لتجنب توقف الخدمة.', '/team'
    );
  end if;
end;
$$;

revoke all on function public.check_plan_expiry_notification from public;
grant execute on function public.check_plan_expiry_notification to authenticated;

-- ---------------------------------------------------------------------
-- Duplicate detection: lets the UI warn "this phone/email already
-- exists" before creating a lead, without a full fuzzy-matching
-- engine — exact match on phone or email within the same workspace.
-- ---------------------------------------------------------------------
create or replace function public.find_duplicate_lead(
  p_workspace_id uuid, p_phone text, p_email text
) returns table (id uuid, full_name text, status public.lead_status)
language sql security definer stable set search_path = public
as $$
  select id, full_name, status
  from public.leads
  where workspace_id = p_workspace_id
    and public.is_workspace_member(p_workspace_id)
    and (
      (p_phone is not null and phone = p_phone)
      or (p_email is not null and email = p_email)
    )
  limit 1;
$$;

revoke all on function public.find_duplicate_lead from public;
grant execute on function public.find_duplicate_lead to authenticated;
