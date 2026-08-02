'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';

export async function updateMetaPixelAction(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/settings?error=not_authorized');
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
    redirect('/settings?error=missing_pixel_id');
  }
  if (!/^\d{10,20}$/.test(raw)) {
    redirect('/settings?error=invalid_pixel_id');
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ meta_pixel_id: raw })
    .eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] update/delete failed:', error);
    redirect('/settings?error=save_failed');
  }

  revalidatePath('/settings');
  redirect('/settings?success=1');
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
