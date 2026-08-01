'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';

export async function dismissOnboardingWizardAction() {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('workspaces')
    .update({ onboarding_dismissed_at: new Date().toISOString() })
    .eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] update/delete failed:', error);
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
