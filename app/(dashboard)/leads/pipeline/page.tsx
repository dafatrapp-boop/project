import Link from 'next/link';
import { List } from 'lucide-react';
import { requireWorkspace, requirePlanFeature } from '@/lib/workspace';
import { KanbanBoard } from './kanban-board';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { PIPELINE_GUIDE } from '@/lib/guide/content';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

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

      <KanbanBoard initialLeads={leads ?? []} />
    </div>
  );
}
