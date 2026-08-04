import { redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, getPageRange, parsePageParam, splitPage } from '@/lib/pagination';

/**
 * Self-hosted error monitoring viewer (migration 0038, architecture
 * review 7.3) — owner/admin only. Not a replacement for a real APM,
 * but means production errors are visible somewhere instead of only
 * in a browser console no one is looking at.
 */
export default async function ErrorsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/dashboard');
  }

  const page = parsePageParam(searchParams.page);
  const [from, to] = getPageRange(page, DEFAULT_PAGE_SIZE);

  const { data: errorsRaw } = await supabase
    .from('error_log')
    .select('id, message, url, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, to);
  const { rows: errors, hasMore } = splitPage(errorsRaw ?? [], DEFAULT_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="سجل الأخطاء" description="أخطاء واجهها المستخدمون في التطبيق — آخر 30 يومًا." />

      {errors.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد أخطاء مسجلة" description="لم يتم تسجيل أي خطأ حتى الآن." />
      ) : (
        <div className="flex flex-col gap-2">
          {errors.map((e) => (
            <Card key={e.id} padding="sm">
              <p className="text-body-sm font-medium text-ink">{e.message}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-ink-faint">
                <span>{new Date(e.created_at).toLocaleString('ar-SA')}</span>
                {e.url && <span className="truncate" dir="ltr">{e.url}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} hasMore={hasMore} searchParams={searchParams} basePath="/errors" />
    </div>
  );
}
