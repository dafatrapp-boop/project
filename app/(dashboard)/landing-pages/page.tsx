import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { LandingPagesList } from './landing-pages-list';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { LANDING_PAGES_GUIDE } from '@/lib/guide/content';

const ERROR_MESSAGES: Record<string, string> = {
  plan_limit_reached: 'وصلت للحد الأقصى لعدد صفحات الهبوط في باقتك الحالية.',
  duplicate_failed: 'تعذر نسخ الصفحة. حاول مرة أخرى.',
  not_found: 'الصفحة الأصلية غير موجودة.',
};

export default async function LandingPagesListPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const { data: pages } = await supabase
    .from('landing_pages')
    .select('id, title, slug, status, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'landing_pages');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="صفحات الهبوط"
        description="أنشئ صفحة تحوّل زوار إعلاناتك إلى عملاء."
        actions={
          <Link href="/landing-pages/new">
            <Button>
              <Plus size={16} />
              صفحة جديدة
            </Button>
          </Link>
        }
      />

      <PageGuide
        guideKey="landing_pages"
        title={LANDING_PAGES_GUIDE.title}
        steps={LANDING_PAGES_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      {searchParams.error && (
        <div className="rounded-md border border-danger/30 bg-danger-50 px-3 py-2 text-body-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ.'}
        </div>
      )}

      <LandingPagesList pages={pages ?? []} />
    </div>
  );
}
