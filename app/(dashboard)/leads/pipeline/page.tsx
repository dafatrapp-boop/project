import Link from 'next/link';
import { List } from 'lucide-react';
import { requireWorkspace, requirePlanFeature } from '@/lib/workspace';
import { KanbanBoard } from './kanban-board';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { PIPELINE_GUIDE } from '@/lib/guide/content';

export default async function PipelinePage() {
  const { supabase, workspaceId, plan, user } = await requireWorkspace();
  requirePlanFeature(plan, 'kanbanPipeline', '/leads');

  const { data: leads } = await supabase
    .from('leads')
    .select('id, full_name, phone, tags, status')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(200);

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'pipeline');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Pipeline المبيعات</h1>
          <p className="text-sm text-ink-muted">اسحب البطاقة لتغيير حالة العميل (أو استخدم القائمة على الجوال).</p>
        </div>
        <Link href="/leads" className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-subtle">
          <List size={16} />
          عرض القائمة
        </Link>
      </div>

      <PageGuide guideKey="pipeline" title={PIPELINE_GUIDE.title} steps={PIPELINE_GUIDE.steps} initiallyDismissed={guideDismissed} />

      <KanbanBoard initialLeads={leads ?? []} />
    </div>
  );
}
