'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import type { ReminderType } from '@/lib/reminders/constants';

const VALID_TYPES: ReminderType[] = [
  'lead_followup', 'call', 'meeting', 'task', 'callback', 'campaign', 'sales_activity', 'custom',
];

export async function createReminderAction(formData: FormData) {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const reminderType = String(formData.get('reminderType') ?? 'custom') as ReminderType;
  // Computed client-side from the datetime-local input using the
  // browser's own local time, then converted to a UTC instant before
  // it ever reaches this action — see reminder-form.tsx. `timezone` is
  // stored purely so the UI can redisplay "10:00 صباحًا بتوقيتك" later;
  // it is never used for the actual due-time comparison.
  const scheduledAtIso = String(formData.get('scheduledAtIso') ?? '');
  const timezone = String(formData.get('timezone') ?? 'UTC');
  const leadId = String(formData.get('leadId') ?? '').trim() || null;
  const campaignId = String(formData.get('campaignId') ?? '').trim() || null;
  const taskId = String(formData.get('taskId') ?? '').trim() || null;

  if (!title) redirect('/reminders?error=missing_title');
  if (!VALID_TYPES.includes(reminderType)) redirect('/reminders?error=invalid_type');

  const scheduledAt = new Date(scheduledAtIso);
  if (Number.isNaN(scheduledAt.getTime())) redirect('/reminders?error=invalid_time');
  // A small grace window (rather than a strict >now check) tolerates
  // the few seconds it naturally takes between the user picking "now"
  // via a preset and the form actually submitting.
  if (scheduledAt.getTime() < Date.now() - 60_000) redirect('/reminders?error=time_in_past');

  const { error } = await supabase.from('reminders').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    lead_id: leadId,
    task_id: taskId,
    campaign_id: campaignId,
    reminder_type: reminderType,
    title,
    description,
    scheduled_at: scheduledAt.toISOString(),
    timezone,
  });

  if (error) {
    console.error('[reminders] create failed:', error);
    redirect('/reminders?error=create_failed');
  }

  revalidatePath('/reminders');
  if (leadId) revalidatePath(`/leads/${leadId}`);
  redirect('/reminders?success=created');
}

export async function cancelReminderAction(reminderId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('reminders')
    .update({ status: 'cancelled' })
    .eq('id', reminderId)
    .eq('workspace_id', workspaceId) // RLS also enforces this; kept explicit for consistency
    .eq('status', 'pending'); // never cancel something already sent/processing

  if (error) {
    console.error('[reminders] cancel failed:', error);
  }

  revalidatePath('/reminders');
}
