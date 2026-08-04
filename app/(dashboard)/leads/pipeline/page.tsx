import Link from 'next/link';
import { List } from 'lucide-react';
import { requireWorkspace, requirePlanFeature } from '@/lib/workspace';
import { KanbanBoard } from './kanban-board';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { PIPELINE_GUIDE } from '@/lib/guide/content';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { LEAD_STATUS_ORDER } from '@/lib/leads/constants';

// A single combined `.limit(200)` query used to mean that once a
// workspace passed 200 active leads TOTAL, the oldest leads vanished
// from every column at once — including ones sitting untouched in
// early stages. Querying per-status instead means one busy column
// (e.g. a pile of "new" leads) can never silently evict cards out of
// other columns; each stage gets its own bounded budget.
const PER_STATUS_LIMIT = 100;

export default async function PipelinePage() {
  const { supabase, workspaceId, plan, user } = await requireWorkspace();
  requirePlanFeature(plan, 'kanbanPipeline', '/leads');

  const perStatusResults = await Promise.all(
    LEAD_STATUS_ORDER.map((status) =>
      supabase
        .from('leads')
        .select('id, full_name, phone, tags, status, estimated_value')
        .eq('workspace_id', workspaceId)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(PER_STATUS_LIMIT)
    )
  );
  const leads = perStatusResults.flatMap((r) => r.data ?? []);
  const truncatedStatuses = LEAD_STATUS_ORDER.filter(
    (status, i) => (perStatusResults[i].data?.length ?? 0) >= PER_STATUS_LIMIT
  );

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'pipeline');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pipeline المبيعات"
        description="اسحب البطاقة لتغيير حالة العميل، أو استخدم قائمة النقل السريع على كل بطاقة."
        actions={
          <Link href="/leads">
            <Button variant="secondary" size="sm">
              <List size={15} />
              عرض القائمة
            </Button>
          </Link>
        }
      />

      <PageGuide guideKey="pipeline" title={PIPELINE_GUIDE.title} steps={PIPELINE_GUIDE.steps} initiallyDismissed={guideDismissed} />

      {truncatedStatuses.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning-50 px-3 py-2 text-body-sm text-warning">
          بعض الأعمدة تحتوي على أكثر من {PER_STATUS_LIMIT} عميل ويعرض هذا اللوح أحدثها فقط — استخدم{' '}
          <Link href="/leads" className="underline">
            القائمة الكاملة
          </Link>{' '}
          لرؤية الجميع.
        </div>
      )}

      <KanbanBoard initialLeads={leads} workspaceId={workspaceId} />
    </div>
  );
}
