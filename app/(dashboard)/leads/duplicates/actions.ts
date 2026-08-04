'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';

export async function mergeLeadsAction(primaryId: string, duplicateId: string) {
  const { supabase, role } = await requireWorkspace();
  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads/duplicates?error=not_authorized');
  }

  const { error } = await supabase.rpc('merge_leads', {
    p_primary_lead_id: primaryId,
    p_duplicate_lead_id: duplicateId,
  });
  if (error) {
    console.error('[leads] merge failed:', error);
    redirect('/leads/duplicates?error=merge_failed');
  }

  revalidatePath('/leads');
  revalidatePath('/leads/duplicates');
  redirect('/leads/duplicates?success=merged');
}
