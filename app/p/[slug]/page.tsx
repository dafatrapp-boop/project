import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SectionRenderer } from '@/components/landing-page/section-renderer';
import { MetaPixelScript } from '@/components/landing-page/meta-pixel-script';
import type { Section } from '@/lib/landing-pages/types';
import { hasFeature, type Plan } from '@/lib/plans/constants';

async function getPage(slug: string) {
  const supabase = createClient();
  // RLS policy `landing_pages_select_public_published` is the actual
  // security boundary here — this query relies on it, it does not
  // duplicate the "published" filter as a trust boundary itself.
  const { data } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await getPage(params.slug);
  if (!page) return {};
  return {
    title: page.meta_title || page.title,
    description: page.meta_description ?? undefined,
  };
}

export default async function PublicLandingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
}) {
  const page = await getPage(params.slug);
  if (!page) notFound();

  // Log the visit for analytics (Phase 7). Insert-only; the RLS policy
  // `views_insert_public` allows anon inserts and a trigger derives
  // workspace_id server-side, so a visitor can never spoof it.
  const supabase = createClient();
  const referrer = headers().get('referer') ?? null;
  await supabase.from('landing_page_views').insert({
    landing_page_id: page.id,
    referrer,
    utm_source: searchParams.utm_source ?? null,
    utm_medium: searchParams.utm_medium ?? null,
    utm_campaign: searchParams.utm_campaign ?? null,
  });

  // Only the merchant's own Pixel ID (entered in Settings) is ever used
  // here — this app never generates or infers one. Fetched via a
  // narrow SECURITY DEFINER function since anon has no direct read
  // access to `workspaces` (see 0006_meta_pixel.sql).
  const { data: pixelId } = await supabase.rpc('get_public_pixel_id', {
    p_landing_page_id: page.id,
  });
  const { data: plan } = await supabase.rpc('get_public_workspace_plan', {
    p_landing_page_id: page.id,
  });
  const showBranding = hasFeature((plan ?? 'free') as Plan, 'showBranding');

  const sections = page.sections as Section[];

  const needsTestimonials = sections.some((s) => s.type === 'testimonials');
  let testimonials: { id: string; customer_name: string; avatar_url: string | null; subtitle: string | null; rating: number; body: string }[] = [];
  if (needsTestimonials) {
    // RLS policy `testimonials_select_public` is the actual security
    // boundary (anon + is_visible=true + workspace has a published
    // page) — the .eq('is_visible', true) here just mirrors that for
    // query-planning clarity, same pattern as getPage() above.
    const { data } = await supabase
      .from('testimonials')
      .select('id, customer_name, avatar_url, subtitle, rating, body')
      .eq('workspace_id', page.workspace_id)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    testimonials = data ?? [];
  }

  return (
    <>
      {pixelId && <MetaPixelScript pixelId={pixelId} />}
      <main dir="rtl" className="min-h-screen bg-surface">
        {sections.map((section, i) => (
          <SectionRenderer
            key={i}
            section={section}
            whatsappNumber={page.whatsapp_number}
            landingPageId={page.id}
            testimonials={testimonials}
          />
        ))}
        {showBranding && (
          <div className="border-t border-border py-3 text-center text-xs text-ink-faint">
            صُنعت هذه الصفحة باستخدام{' '}
            <a href="/" className="font-medium text-brand-600 hover:underline">
              SocialSales OS
            </a>
          </div>
        )}
      </main>
    </>
  );
}
