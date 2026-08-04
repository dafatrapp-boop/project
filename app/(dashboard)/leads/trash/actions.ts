'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';

export async function restoreLeadAction(leadId: string) {
  const { supabase, role } = await requireWorkspace();
  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads/trash?error=not_authorized');
  }

  const { error } = await supabase.rpc('restore_lead', { p_lead_id: leadId });
  if (error) {
    console.error('[leads] restore failed:', error);
    redirect('/leads/trash?error=restore_failed');
  }

  revalidatePath('/leads');
  revalidatePath('/leads/trash');
  redirect('/leads/trash?success=restored');
}

export async function purgeLeadAction(leadId: string) {
  const { supabase, role } = await requireWorkspace();
  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads/trash?error=not_authorized');
  }

  const { error } = await supabase.rpc('purge_lead', { p_lead_id: leadId });
  if (error) {
    console.error('[leads] purge failed:', error);
    redirect('/leads/trash?error=purge_failed');
  }

  revalidatePath('/leads/trash');
  redirect('/leads/trash?success=purged');
}
