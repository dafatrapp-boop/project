'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import type { AppointmentStatus } from '@/lib/appointments/constants';

export async function createAppointmentAction(formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  const customerName = String(formData.get('customerName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim() || null;
  const date = String(formData.get('date') ?? '');
  const time = String(formData.get('time') ?? '');

  if (!customerName || !date || !time) {
    redirect('/appointments?error=missing_fields');
  }

  const { error } = await supabase.from('appointments').insert({
    workspace_id: workspaceId,
    customer_name: customerName,
    phone,
    email,
    appointment_date: date,
    start_time: time,
    status: 'confirmed',
    source: 'manual',
  });

  if (error) {
    redirect('/appointments?error=create_failed');
  }

  revalidatePath('/appointments');
  redirect('/appointments');
}

export async function updateAppointmentStatusAction(appointmentId: string, status: AppointmentStatus) {
  const { supabase, workspaceId } = await requireWorkspace();

  await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .eq('workspace_id', workspaceId);

  revalidatePath('/appointments');
}
