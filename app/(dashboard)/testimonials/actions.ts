'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';

export async function createTestimonialAction(formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  const customerName = String(formData.get('customerName') ?? '').trim();
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null;
  const rating = Number(formData.get('rating') ?? 5);
  const body = String(formData.get('body') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim() || null;

  if (!customerName || !body) {
    redirect('/testimonials?error=missing_fields');
  }

  const { error } = await supabase.from('testimonials').insert({
    workspace_id: workspaceId,
    customer_name: customerName,
    subtitle,
    rating: Math.min(5, Math.max(1, rating)),
    body,
    avatar_url: avatarUrl,
  });

  if (error) {
    redirect('/testimonials?error=create_failed');
  }

  revalidatePath('/testimonials');
  redirect('/testimonials');
}

export async function toggleTestimonialVisibilityAction(testimonialId: string, isVisible: boolean) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('testimonials')
    .update({ is_visible: isVisible })
    .eq('id', testimonialId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[testimonials] update/delete failed:', error);
  }

  revalidatePath('/testimonials');
}

export async function deleteTestimonialAction(testimonialId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase.from('testimonials').delete().eq('id', testimonialId).eq('workspace_id', workspaceId);
  if (error) {
    console.error('[testimonials] update/delete failed:', error);
  }

  revalidatePath('/testimonials');
}
