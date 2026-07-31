'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { TEMPLATES } from '@/lib/landing-pages/templates';
import type { Section } from '@/lib/landing-pages/types';
import { PLAN_LIMITS, isUnderLimit, hasFeature } from '@/lib/plans/constants';

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `page-${Date.now()}`
  );
}

export async function createLandingPageAction(formData: FormData) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  const title = String(formData.get('title') ?? '').trim();
  const templateId = String(formData.get('template') ?? 'general');

  if (!title) {
    redirect('/landing-pages/new?error=missing_title');
  }

  const { count: existingCount } = await supabase
    .from('landing_pages')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  const limit = PLAN_LIMITS[plan].maxLandingPages;
  if (!isUnderLimit(existingCount ?? 0, limit)) {
    redirect('/landing-pages/new?error=plan_limit_reached');
  }

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[TEMPLATES.length - 1];
  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
    .from('landing_pages')
    .insert({
      workspace_id: workspaceId,
      title,
      slug,
      template: template.id,
      status: 'draft',
      sections: template.sections,
      whatsapp_number: null,
      meta_title: null,
      meta_description: null,
    })
    .select('id')
    .single();


  if (error || !data) {
    redirect('/landing-pages/new?error=create_failed');
  }

  revalidatePath('/landing-pages');
  redirect(`/landing-pages/${data.id}/edit`);
}

export async function updateSectionsAction(pageId: string, sections: Section[]) {
  const { supabase, workspaceId } = await requireWorkspace();

  await supabase
    .from('landing_pages')
    .update({ sections })
    .eq('id', pageId)
    .eq('workspace_id', workspaceId);

  revalidatePath(`/landing-pages/${pageId}/edit`);
}

export async function updatePageMetaAction(pageId: string, formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  const title = String(formData.get('title') ?? '').trim();
  const whatsappNumber = String(formData.get('whatsappNumber') ?? '').trim() || null;
  const metaTitle = String(formData.get('metaTitle') ?? '').trim() || null;
  const metaDescription = String(formData.get('metaDescription') ?? '').trim() || null;

  if (!title) return;

  await supabase
    .from('landing_pages')
    .update({
      title,
      whatsapp_number: whatsappNumber,
      meta_title: metaTitle,
      meta_description: metaDescription,
    })
    .eq('id', pageId)
    .eq('workspace_id', workspaceId);

  revalidatePath(`/landing-pages/${pageId}/edit`);
}

export async function togglePublishAction(pageId: string, publish: boolean) {
  const { supabase, workspaceId } = await requireWorkspace();

  await supabase
    .from('landing_pages')
    .update({
      status: publish ? 'published' : 'draft',
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq('id', pageId)
    .eq('workspace_id', workspaceId);

  revalidatePath(`/landing-pages/${pageId}/edit`);
  revalidatePath('/landing-pages');
}

export async function deleteLandingPageAction(pageId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  await supabase.from('landing_pages').delete().eq('id', pageId).eq('workspace_id', workspaceId);

  revalidatePath('/landing-pages');
  redirect('/landing-pages');
}

export async function duplicateLandingPageAction(pageId: string) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  if (!hasFeature(plan, 'duplicateLandingPage')) {
    redirect('/landing-pages?error=feature_requires_upgrade');
  }

  const { count: existingCount } = await supabase
    .from('landing_pages')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  const limit = PLAN_LIMITS[plan].maxLandingPages;
  if (!isUnderLimit(existingCount ?? 0, limit)) {
    redirect('/landing-pages?error=plan_limit_reached');
  }

  const { data: original } = await supabase
    .from('landing_pages')
    .select('title, template, sections, whatsapp_number, meta_title, meta_description')
    .eq('id', pageId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!original) {
    redirect('/landing-pages?error=not_found');
  }

  const newTitle = `${original.title} (نسخة)`;
  const slug = `${slugify(newTitle)}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: copy, error } = await supabase
    .from('landing_pages')
    .insert({
      workspace_id: workspaceId,
      title: newTitle,
      slug,
      template: original.template,
      status: 'draft', // duplicates always start unpublished, even if the original was live
      sections: original.sections,
      whatsapp_number: original.whatsapp_number,
      meta_title: original.meta_title,
      meta_description: original.meta_description,
    })
    .select('id')
    .single();

  if (error || !copy) {
    redirect('/landing-pages?error=duplicate_failed');
  }

  revalidatePath('/landing-pages');
  redirect(`/landing-pages/${copy.id}/edit`);
}
