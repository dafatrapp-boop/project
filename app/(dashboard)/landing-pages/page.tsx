import Link from 'next/link';
import { Plus, ExternalLink, Copy } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { duplicateLandingPageAction } from './actions';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { LANDING_PAGES_GUIDE } from '@/lib/guide/content';

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
}

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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink">صفحات الهبوط</h1>
          <p className="text-sm text-ink-muted">أنشئ صفحة تحوّل زوار إعلاناتك إلى عملاء.</p>
        </div>
        <Link href="/landing-pages/new">
          <Button>
            <Plus size={16} />
            صفحة جديدة
          </Button>
        </Link>
      </div>

      <PageGuide
        guideKey="landing_pages"
        title={LANDING_PAGES_GUIDE.title}
        steps={LANDING_PAGES_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      {searchParams.error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ.'}
        </div>
      )}

      <Table<PageRow>
        keyField={(row) => row.id}
        rows={pages ?? []}
        emptyMessage="لا توجد صفحات هبوط بعد. أنشئ أول صفحة لتبدأ باستقبال العملاء."
        columns={[
          {
            header: 'العنوان',
            cell: (row) => (
              <Link href={`/landing-pages/${row.id}/edit`} className="font-medium text-brand-600 hover:underline">
                {row.title}
              </Link>
            ),
          },
          {
            header: 'الحالة',
            cell: (row) => (
              <Badge tone={row.status === 'published' ? 'success' : 'neutral'}>
                {row.status === 'published' ? 'منشورة' : 'مسودة'}
              </Badge>
            ),
          },
          {
            header: 'الرابط العام',
            cell: (row) =>
              row.status === 'published' ? (
                <a
                  href={`/p/${row.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                >
                  /p/{row.slug} <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-ink-faint">غير منشورة بعد</span>
              ),
          },
          {
            header: 'تاريخ الإنشاء',
            cell: (row) => new Date(row.created_at).toLocaleDateString('ar-SA'),
          },
          {
            header: '',
            cell: (row) => (
              <form action={duplicateLandingPageAction.bind(null, row.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
                  title="نسخ الصفحة"
                >
                  <Copy size={14} />
                  نسخ
                </button>
              </form>
            ),
          },
        ]}
      />
    </div>
  );
}
