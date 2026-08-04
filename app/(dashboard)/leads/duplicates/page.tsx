import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users2, GitMerge } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { mergeLeadsAction } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'يلزم أن تكون مالكًا أو مشرفًا لهذا الإجراء.',
  merge_failed: 'تعذر الدمج. حاول مرة أخرى.',
};

export default async function DuplicateLeadsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads');
  }

  const { data: pairs } = await supabase.rpc('find_duplicate_lead_pairs', { p_workspace_id: workspaceId });
  const rows = pairs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="العملاء المحتملون المكررون"
        description="تطابق في رقم الهاتف أو البريد الإلكتروني — ادمجهم في سجل واحد بدلًا من تشتت تاريخ التواصل."
        actions={
          <Link href="/leads">
            <Button variant="secondary" size="sm">رجوع للقائمة</Button>
          </Link>
        }
      />

      {searchParams.error && (
        <div className="rounded-md border border-danger/30 bg-danger-50 px-3 py-2 text-body-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ.'}
        </div>
      )}
      {searchParams.success && (
        <div className="rounded-md border border-success/30 bg-success-50 px-3 py-2 text-body-sm text-success">
          تم الدمج بنجاح.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Users2} title="لا يوجد عملاء مكررون" description="لم يتم العثور على تطابق في الهاتف أو البريد الإلكتروني." />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((pair) => (
            <Card key={`${pair.primary_id}-${pair.duplicate_id}`} padding="md">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-2 text-body-sm">
                  <Link href={`/leads/${pair.primary_id}`} className="font-medium text-brand-600 hover:underline">
                    {pair.primary_name}
                  </Link>
                  <span className="text-ink-faint">مع</span>
                  <Link href={`/leads/${pair.duplicate_id}`} className="font-medium text-brand-600 hover:underline">
                    {pair.duplicate_name}
                  </Link>
                  <Badge tone="neutral" size="sm">
                    تطابق في {pair.matched_on === 'phone' ? 'الهاتف' : 'البريد الإلكتروني'}
                  </Badge>
                </div>
                <form action={mergeLeadsAction.bind(null, pair.primary_id, pair.duplicate_id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    <GitMerge size={14} />
                    دمج في الأول
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
