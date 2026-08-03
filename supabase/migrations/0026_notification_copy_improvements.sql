-- =====================================================================
-- Notification copy — addresses the audit's finding that every
-- notification title was a static, generic per-type string ("عميل
-- محتمل جديد") with only the body carrying the real entity name. On a
-- lock screen or a collapsed notification shade, the title is what's
-- actually glanceable — the specific name should be there, not one tap
-- away. Rewrites the three existing notify_* functions to put the real
-- name in the title and a genuine next-step sentence in the body,
-- matching the pattern already used for reminders (migration 0024's
-- process_due_reminders sends the user's own title/description
-- directly, which is inherently specific).
--
-- Purely a `create or replace function` change — no schema change, no
-- trigger redefinition needed (the triggers already point at these
-- function names).
-- =====================================================================

create or replace function public.notify_new_lead() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_workspace_members(
    new.workspace_id, 'new_lead',
    'عميل محتمل جديد: ' || new.full_name,
    'تمت إضافته وهو بانتظار المتابعة.',
    '/leads/' || new.id::text
  );
  return new;
end;
$$;

create or replace function public.notify_new_campaign() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_workspace_members(
    new.workspace_id, 'new_campaign',
    'حملة جديدة: ' || new.name,
    'تم إنشاؤها وهي جاهزة الآن لتتبع الأداء.',
    '/campaigns/' || new.id::text
  );
  return new;
end;
$$;

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
      p_workspace_id, 'plan_expiring',
      'اشتراكك ينتهي في ' || to_char(v_expires_at, 'YYYY-MM-DD'),
      'جدّد الآن لتجنب توقف الخدمة عن مساحة عملك.',
      '/team'
    );
  end if;
end;
$$;
