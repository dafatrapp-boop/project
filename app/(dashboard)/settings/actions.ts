'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';

/**
 * The team page shows each member's name from `profiles.full_name`.
 * Signup requires a full name today, but accounts created before that
 * validation existed can still have a null value here — and until now
 * there was no way to fix it short of editing the database directly.
 * This gives every user a self-service way to set/correct their own
 * display name (RLS already restricts profiles_update_own to the
 * caller's own row, so no extra authorization check is needed here).
 */
export async function updateProfileAction(formData: FormData) {
  const { supabase, user } = await requireWorkspace();

  const fullName = String(formData.get('fullName') ?? '').trim();

  if (!fullName) {
    redirect('/settings?error=missing_name');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);
  if (error) {
    console.error('[profiles] update failed:', error);
    redirect('/settings?error=save_failed');
  }

  revalidatePath('/settings');
  revalidatePath('/team');
  redirect('/settings?success=profile');
}

export async function updateMetaPixelAction(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings/integrations?error=not_authorized');
  }

  const raw = String(formData.get('metaPixelId') ?? '').trim();

  // Meta Pixel IDs are purely numeric, typically 15-16 digits. We only
  // validate shape here — we never generate or infer this value; it
  // must be the merchant's own ID from their Meta Events Manager.
  //
  // This field is required: previously an empty submission skipped
  // validation entirely, saved `null`, and still redirected to the
  // generic success message — so clearing the field (or a typo that
  // produced an empty string) looked like a successful save when
  // nothing valid had actually been stored.
  if (!raw) {
    redirect('/settings/integrations?error=missing_pixel_id');
  }
  if (!/^\d{10,20}$/.test(raw)) {
    redirect('/settings/integrations?error=invalid_pixel_id');
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ meta_pixel_id: raw })
    .eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] update/delete failed:', error);
    redirect('/settings/integrations?error=save_failed');
  }

  revalidatePath('/settings/integrations');
  redirect('/settings/integrations?success=1');
}

/** GA4 (architecture review 4.2) — same "merchant-owned, never
 * generated" rule as Meta Pixel; empty value clears tracking. */
export async function updateGa4Action(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings/integrations?error=not_authorized');
  }

  const raw = String(formData.get('ga4MeasurementId') ?? '').trim();
  if (raw && !/^G-[A-Z0-9]{4,15}$/.test(raw)) {
    redirect('/settings/integrations?error=invalid_ga4_id');
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ ga4_measurement_id: raw || null })
    .eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] ga4 update failed:', error);
    redirect('/settings/integrations?error=save_failed');
  }

  revalidatePath('/settings/integrations');
  redirect('/settings/integrations?success=ga4');
}

/** Workspace-level default WhatsApp number — inherited by every new
 * landing page at creation time (migration 0040) so it's only ever
 * typed once instead of once per page. */
export async function updateDefaultWhatsAppAction(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings/integrations?error=not_authorized');
  }

  const raw = String(formData.get('whatsapp') ?? '').trim();
  let normalized: string | null = null;
  if (raw) {
    const { validateIraqiPhone } = await import('@/lib/phone');
    const check = validateIraqiPhone(raw);
    if (!check.valid) {
      redirect(`/settings/integrations?error=${check.reason}`);
    }
    normalized = check.normalized!.replace('+', '');
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ default_whatsapp_number: normalized })
    .eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] default whatsapp update failed:', error);
    redirect('/settings/integrations?error=save_failed');
  }

  revalidatePath('/settings/integrations');
  redirect('/settings/integrations?success=whatsapp');
}

export async function updateAppointmentSettingsAction(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings?error=not_authorized');
  }

  const enabled = formData.get('enabled') === 'on';
  const workingDays = formData.getAll('workingDays').map((d) => Number(d));
  const startTime = String(formData.get('startTime') ?? '09:00');
  const endTime = String(formData.get('endTime') ?? '17:00');
  const slotDuration = Number(formData.get('slotDuration') ?? 30);
  const maxPerSlot = Number(formData.get('maxPerSlot') ?? 1);
  const holidaysRaw = String(formData.get('holidays') ?? '').trim();
  const holidays = holidaysRaw
    ? holidaysRaw.split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  if (startTime >= endTime) {
    redirect('/settings?error=invalid_hours');
  }

  if (workingDays.length === 0) {
    redirect('/settings?error=missing_working_days');
  }

  const { error } = await supabase
    .from('appointment_settings')
    .update({
      enabled,
      working_days: workingDays,
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: slotDuration,
      max_bookings_per_slot: maxPerSlot,
      holidays,
    })
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[appointment_settings] update/delete failed:', error);
  }

  revalidatePath('/settings');
  redirect('/settings?success=appointments');
}

/**
 * Controls whether plain 'agent' members see every lead in the
 * workspace or only ones assigned to them (plus unassigned ones).
 * Default (false) is the safe/restricted behavior added by the RLS fix
 * in migration 0028 — this lets an owner/admin explicitly opt back
 * into "everyone sees everything" for small teams that want it.
 */
export async function updateLeadVisibilityAction(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings?error=not_authorized');
  }

  const agentsViewAll = formData.get('agentsViewAllLeads') === 'on';

  const { error } = await supabase
    .from('workspaces')
    .update({ agents_view_all_leads: agentsViewAll })
    .eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] lead visibility update failed:', error);
    redirect('/settings?error=save_failed');
  }

  revalidatePath('/settings');
  redirect('/settings?success=lead_visibility');
}

/**
 * Round-robin lead assignment (migration 0040) — when on, a new lead
 * with no explicit assignee is auto-assigned to whichever team member
 * currently has the fewest open leads, instead of sitting unassigned
 * until someone manually claims it.
 */
export async function updateAutoAssignAction(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings?error=not_authorized');
  }

  const autoAssign = formData.get('autoAssignLeads') === 'on';

  const { error } = await supabase
    .from('workspaces')
    .update({ auto_assign_leads: autoAssign })
    .eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] auto-assign update failed:', error);
    redirect('/settings?error=save_failed');
  }

  revalidatePath('/settings');
  redirect('/settings?success=auto_assign');
}

/** Custom fields (migration 0033, product-gaps review ب.1) — lets an
 * owner/admin define extra per-lead fields specific to their business
 * (e.g. "تاريخ الميلاد" for a clinic, "الميزانية" for real estate). */
export async function addCustomFieldAction(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();
  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings?error=not_authorized');
  }

  const label = String(formData.get('label') ?? '').trim();
  const fieldType = String(formData.get('fieldType') ?? 'text');
  const optionsRaw = String(formData.get('options') ?? '').trim();

  if (!label) {
    redirect('/settings?error=missing_field_label');
  }
  if (!['text', 'number', 'date', 'select'].includes(fieldType)) {
    redirect('/settings?error=invalid_field_type');
  }

  const key = label
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
  const options = fieldType === 'select'
    ? optionsRaw.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const { error } = await supabase.from('custom_field_definitions').insert({
    workspace_id: workspaceId,
    key: key || `field_${Date.now()}`,
    label,
    field_type: fieldType as 'text' | 'number' | 'date' | 'select',
    options,
  });
  if (error) {
    console.error('[custom_field_definitions] insert failed:', error);
    redirect('/settings?error=save_failed');
  }

  revalidatePath('/settings');
  redirect('/settings?success=custom_field_added');
}

export async function deleteCustomFieldAction(fieldId: string) {
  const { supabase, role } = await requireWorkspace();
  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings?error=not_authorized');
  }

  const { error } = await supabase.from('custom_field_definitions').delete().eq('id', fieldId);
  if (error) {
    console.error('[custom_field_definitions] delete failed:', error);
  }

  revalidatePath('/settings');
  redirect('/settings?success=custom_field_removed');
}

/** "أعد تفعيله من الإعدادات" — clears every dismissed in-app guide for
 * this user so the small page tips start showing again everywhere. */
export async function resetGuidesAction() {
  const { supabase, user } = await requireWorkspace();

  const { error } = await supabase.from('user_guide_state').delete().eq('user_id', user.id);
  if (error) {
    console.error('[user_guide_state] update/delete failed:', error);
  }

  revalidatePath('/settings');
  redirect('/settings?success=guides_reset');
}
