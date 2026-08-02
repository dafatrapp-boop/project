'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { TEMPLATES } from '@/lib/landing-pages/templates';
import type { Section } from '@/lib/landing-pages/types';
import { PLAN_LIMITS, isUnderLimit, hasFeature } from '@/lib/plans/constants';

function slugify(input: string) {
  // Deliberately Latin/ASCII-only. An earlier version kept Arabic
  // characters in the slug (since most titles here are Arabic), but
  // Arabic text in a URL path is fragile across browsers, messaging
  // apps (WhatsApp/Instagram link previews), and copy-paste — it's
  // what broke https://…/p/سارع-بالحجز-عرض-شهر-رمضان-mur6 above. The
  // Arabic title is already shown everywhere in the dashboard UI;
  // the public URL itself just needs to be a short, robust identifier.
  const ascii = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || 'page';
}

function randomSlugSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

const POSTGRES_UNIQUE_VIOLATION = '23505';

/**
 * `slug` is now unique across every workspace, not just within one
 * (see migration 0022 — closes the cross-tenant slug collision bug
 * from the architecture review). A collision on the random suffix is
 * rare but no longer impossible to hit in practice with many tenants,
 * so instead of surfacing the raw DB error to the user, retry a few
 * times with a fresh suffix before giving up.
 */
async function insertWithUniqueSlug<T>(
  attemptInsert: (slug: string) => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>,
  baseSlug: string,
  maxAttempts = 5
): Promise<{ data: T | null; error: { code?: string; message: string } | null }> {
  let lastResult: { data: T | null; error: { code?: string; message: string } | null } = {
    data: null,
    error: { message: 'unreachable' },
  };
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = `${baseSlug}-${randomSlugSuffix()}`;
    lastResult = await attemptInsert(slug);
    if (!lastResult.error || lastResult.error.code !== POSTGRES_UNIQUE_VIOLATION) {
      return lastResult;
    }
  }
  return lastResult;
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

  const { data, error } = await insertWithUniqueSlug(
    (slug) =>
      supabase
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
        .single(),
    baseSlug
  );

  if (error || !data) {
    redirect('/landing-pages/new?error=create_failed');
  }

  revalidatePath('/landing-pages');
  redirect(`/landing-pages/${data.id}/edit`);
}

export async function updateSectionsAction(pageId: string, sections: Section[]) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('landing_pages')
    .update({ sections })
    .eq('id', pageId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[landing_pages] update/delete failed:', error);
  }

  revalidatePath(`/landing-pages/${pageId}/edit`);
}

export async function updatePageMetaAction(pageId: string, formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  const title = String(formData.get('title') ?? '').trim();
  const whatsappNumber = String(formData.get('whatsappNumber') ?? '').trim() || null;
  const metaTitle = String(formData.get('metaTitle') ?? '').trim() || null;
  const metaDescription = String(formData.get('metaDescription') ?? '').trim() || null;

  if (!title) return;

  const { error } = await supabase
    .from('landing_pages')
    .update({
      title,
      whatsapp_number: whatsappNumber,
      meta_title: metaTitle,
      meta_description: metaDescription,
    })
    .eq('id', pageId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[landing_pages] update/delete failed:', error);
  }

  revalidatePath(`/landing-pages/${pageId}/edit`);
}

export async function togglePublishAction(
  pageId: string,
  publish: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, workspaceId } = await requireWorkspace();

  const { data, error } = await supabase
    .from('landing_pages')
    .update({
      status: publish ? 'published' : 'draft',
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq('id', pageId)
    .eq('workspace_id', workspaceId)
    .select('id')
    .maybeSingle();

  revalidatePath(`/landing-pages/${pageId}/edit`);
  revalidatePath('/landing-pages');

  // A silent no-op update (0 rows affected, no thrown error) almost
  // always means Row Level Security blocked the write rather than an
  // actual query failure — surface that distinctly so it isn't
  // reported to the user as a generic success.
  if (error) {
    console.error('[landing_pages.togglePublish] update failed:', error);
    return { ok: false, error: `تعذر تحديث حالة النشر: ${error.message} (code: ${error.code ?? 'n/a'})` };
  }
  if (!data) {
    console.error('[landing_pages.togglePublish] update matched 0 rows (likely RLS) for page', pageId);
    return {
      ok: false,
      error: 'لم يتم حفظ التغيير — لم تُطابق أي صفوف (على الأغلب RLS تمنع هذا التحديث لهذه الصفحة).',
    };
  }
  return { ok: true };
}

export async function deleteLandingPageAction(pageId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase.from('landing_pages').delete().eq('id', pageId).eq('workspace_id', workspaceId);
  if (error) {
    console.error('[landing_pages] update/delete failed:', error);
  }

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
  const baseSlug = slugify(newTitle);

  const { data: copy, error } = await insertWithUniqueSlug(
    (slug) =>
      supabase
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
        .single(),
    baseSlug
  );

  if (error || !copy) {
    redirect('/landing-pages?error=duplicate_failed');
  }

  revalidatePath('/landing-pages');
  redirect(`/landing-pages/${copy.id}/edit`);
}
