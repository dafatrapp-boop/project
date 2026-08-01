-- =====================================================================
-- SocialSales OS — Phase 16: Appointment Booking
--
-- Auto-enabled for appointment-driven industries at signup, but the
-- merchant can always flip it on/off manually from Settings regardless
-- of industry (appointment_settings.enabled is the single source of
-- truth the whole feature reads from — nav visibility, the landing
-- page section, and the public booking RPCs all check this one flag).
-- =====================================================================

-- Additive, non-breaking: existing rows/values are untouched.
alter type public.workspace_industry add value if not exists 'beauty_salon';
alter type public.workspace_industry add value if not exists 'lawyer';
alter type public.workspace_industry add value if not exists 'consultant';

-- ---------------------------------------------------------------------
-- appointment_settings: one row per workspace (created automatically,
-- see trigger below). Holidays kept as a plain date[] — a dedicated
-- table would be overkill for "a merchant blocks a handful of days a
-- year".
-- ---------------------------------------------------------------------
create table if not exists public.appointment_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  enabled boolean not null default false,
  -- 0 = Sunday .. 6 = Saturday. Default matches the typical Sun-Thu week.
  working_days smallint[] not null default '{0,1,2,3,4}',
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  slot_duration_minutes smallint not null default 30,
  max_bookings_per_slot smallint not null default 1,
  holidays date[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.appointment_settings enable row level security;

drop policy if exists "appointment_settings_select_member" on public.appointment_settings;
create policy "appointment_settings_select_member"
  on public.appointment_settings for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "appointment_settings_update_admin" on public.appointment_settings;
create policy "appointment_settings_update_admin"
  on public.appointment_settings for update
  using (public.is_workspace_admin(workspace_id));

-- Industries that ship with the feature switched on by default. Kept as
-- a SQL function (not a hardcoded array literal repeated everywhere) so
-- the one place that defines "which businesses need appointments" is
-- also the one place the app code calls to check it at signup time.
create or replace function public.industry_defaults_to_appointments(p_industry public.workspace_industry)
returns boolean
language sql immutable
as $$
  select p_industry::text in ('clinic', 'training_center', 'beauty_salon', 'lawyer', 'consultant');
$$;

create or replace function public.create_appointment_settings_for_workspace()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.appointment_settings (workspace_id, enabled)
  values (new.id, public.industry_defaults_to_appointments(new.industry));
  return new;
end;
$$;

drop trigger if exists on_workspace_created_appointment_settings on public.workspaces;
create trigger on_workspace_created_appointment_settings
  after insert on public.workspaces
  for each row execute procedure public.create_appointment_settings_for_workspace();

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
do $$ begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_name text not null,
  phone text,
  email text,
  appointment_date date not null,
  start_time time not null,
  status public.appointment_status not null default 'pending',
  source text not null default 'manual', -- 'manual' | 'public_booking'
  created_at timestamptz not null default now()
);

create index if not exists appointments_workspace_date_idx
  on public.appointments (workspace_id, appointment_date, start_time);

alter table public.appointments enable row level security;

drop policy if exists "appointments_select_member" on public.appointments;
create policy "appointments_select_member"
  on public.appointments for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "appointments_insert_member" on public.appointments;
create policy "appointments_insert_member"
  on public.appointments for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "appointments_update_member" on public.appointments;
create policy "appointments_update_member"
  on public.appointments for update
  using (public.is_workspace_member(workspace_id));

drop policy if exists "appointments_delete_admin" on public.appointments;
create policy "appointments_delete_admin"
  on public.appointments for delete
  using (public.is_workspace_admin(workspace_id));

-- ---------------------------------------------------------------------
-- Public booking surface. Mirrors the get_public_pixel_id /
-- submit_lead_from_landing_page pattern from 0003/0006: anon never
-- touches `workspaces` or `appointment_settings` directly, only through
-- narrow SECURITY DEFINER functions keyed off a published landing page.
-- ---------------------------------------------------------------------
create or replace function public.get_public_appointment_settings(p_landing_page_id uuid)
returns table (
  enabled boolean,
  working_days smallint[],
  start_time time,
  end_time time,
  slot_duration_minutes smallint,
  max_bookings_per_slot smallint,
  holidays date[]
)
language sql security definer stable set search_path = public
as $$
  select s.enabled, s.working_days, s.start_time, s.end_time, s.slot_duration_minutes, s.max_bookings_per_slot, s.holidays
  from public.appointment_settings s
  join public.landing_pages lp on lp.workspace_id = s.workspace_id
  where lp.id = p_landing_page_id and lp.status = 'published' and s.enabled = true;
$$;

revoke all on function public.get_public_appointment_settings from public;
grant execute on function public.get_public_appointment_settings to anon, authenticated;

-- Lets the booking widget grey out full slots without exposing any
-- customer data (name/phone/email) to anonymous visitors.
create or replace function public.get_public_booked_slots(p_landing_page_id uuid, p_date date)
returns table (start_time time, taken_count bigint)
language sql security definer stable set search_path = public
as $$
  select a.start_time, count(*)
  from public.appointments a
  join public.landing_pages lp on lp.workspace_id = a.workspace_id
  where lp.id = p_landing_page_id
    and lp.status = 'published'
    and a.appointment_date = p_date
    and a.status != 'cancelled'
  group by a.start_time;
$$;

revoke all on function public.get_public_booked_slots from public;
grant execute on function public.get_public_booked_slots to anon, authenticated;

create or replace function public.book_appointment_slot(
  p_landing_page_id uuid,
  p_date date,
  p_start_time time,
  p_customer_name text,
  p_phone text,
  p_email text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_settings public.appointment_settings;
  v_weekday smallint;
  v_taken_count int;
  v_appointment_id uuid;
begin
  select lp.workspace_id into v_workspace_id
  from public.landing_pages lp
  where lp.id = p_landing_page_id and lp.status = 'published';

  if v_workspace_id is null then
    raise exception 'invalid_landing_page';
  end if;

  select * into v_settings from public.appointment_settings where workspace_id = v_workspace_id;

  if v_settings is null or v_settings.enabled = false then
    raise exception 'appointments_disabled';
  end if;

  if trim(coalesce(p_customer_name, '')) = '' then
    raise exception 'missing_name';
  end if;

  if coalesce(trim(p_phone), '') = '' and coalesce(trim(p_email), '') = '' then
    raise exception 'missing_contact';
  end if;

  if p_date < current_date then
    raise exception 'date_in_past';
  end if;

  if p_date = any(v_settings.holidays) then
    raise exception 'holiday';
  end if;

  v_weekday := extract(dow from p_date);
  if not (v_weekday = any(v_settings.working_days)) then
    raise exception 'non_working_day';
  end if;

  if p_start_time < v_settings.start_time or p_start_time >= v_settings.end_time then
    raise exception 'outside_working_hours';
  end if;

  -- Advisory lock keyed to this exact workspace/date/time so two
  -- concurrent bookings for the last open seat can't both pass the
  -- count check below (the classic double-booking race).
  perform pg_advisory_xact_lock(hashtext(v_workspace_id::text || p_date::text || p_start_time::text));

  select count(*) into v_taken_count
  from public.appointments
  where workspace_id = v_workspace_id
    and appointment_date = p_date
    and start_time = p_start_time
    and status != 'cancelled';

  if v_taken_count >= v_settings.max_bookings_per_slot then
    raise exception 'slot_full';
  end if;

  insert into public.appointments (workspace_id, customer_name, phone, email, appointment_date, start_time, status, source)
  values (v_workspace_id, trim(p_customer_name), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), p_date, p_start_time, 'pending', 'public_booking')
  returning id into v_appointment_id;

  perform public.notify_workspace_members(
    v_workspace_id, 'new_appointment', 'حجز موعد جديد',
    trim(p_customer_name) || ' — ' || to_char(p_date, 'YYYY-MM-DD') || ' ' || to_char(p_start_time, 'HH24:MI'),
    '/appointments'
  );

  return v_appointment_id;
end;
$$;

revoke all on function public.book_appointment_slot from public;
grant execute on function public.book_appointment_slot to anon, authenticated;
