'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';

export async function dismissOnboardingWizardAction() {
  const { supabase, workspaceId } = await requireWorkspace();

  await supabase
    .from('workspaces')
    .update({ onboarding_dismissed_at: new Date().toISOString() })
    .eq('id', workspaceId);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
