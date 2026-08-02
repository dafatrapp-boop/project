import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import type { Section } from '@/lib/landing-pages/types';
import { SectionsEditor } from './sections-editor';
import { PageSettingsForm } from './page-settings-form';
import { PublishToggle } from './publish-toggle';

export default async function LandingPageEditPage({ params }: { params: { id: string } }) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { data: page } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!page) notFound();

  return (
    <div className="flex flex-col gap-6">
      {/* No manual "back" link — the Phase 3 breadcrumb bar already
          covers this route (صفحات الهبوط > تعديل). */}
      <Card className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-title-lg text-ink">{page.title}</h1>
            <Badge tone={page.status === 'published' ? 'success' : 'neutral'}>
              {page.status === 'published' ? 'منشورة' : 'مسودة'}
            </Badge>
          </div>
          {page.status === 'published' && (
            <a
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-body-sm text-brand-600 hover:underline"
            >
              /p/{page.slug} <ExternalLink size={12} />
            </a>
          )}
        </div>
        <PublishToggle pageId={page.id} isPublished={page.status === 'published'} />
      </Card>

      <Tabs
        tabs={[
          {
            id: 'sections',
            label: 'محتوى الصفحة',
            content: (
              <SectionsEditor
                pageId={page.id}
                workspaceId={workspaceId}
                initialSections={page.sections as Section[]}
                whatsappNumber={page.whatsapp_number}
              />
            ),
          },
          {
            id: 'settings',
            label: 'الإعدادات',
            content: (
              <PageSettingsForm
                pageId={page.id}
                title={page.title}
                whatsappNumber={page.whatsapp_number}
                metaTitle={page.meta_title}
                metaDescription={page.meta_description}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
