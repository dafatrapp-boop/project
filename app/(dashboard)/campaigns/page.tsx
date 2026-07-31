import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { PLATFORM_LABELS, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_TONE } from '@/lib/campaigns/constants';
import type { CampaignPlatform, CampaignStatus } from '@/lib/campaigns/constants';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { CAMPAIGNS_GUIDE } from '@/lib/guide/content';

interface CampaignRow {
  id: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  leadsCount: number;
  viewsCount: number;
}

export default async function CampaignsListPage() {
  const { supabase, workspaceId, user } = await requireWorkspace();
  const guideDismissed = await getGuideDismissed(supabase, user.id, 'campaigns');

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, platform, status')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  const { data: stats } = await supabase
    .from('campaign_stats')
    .select('campaign_id, leads_count, views_count')
    .eq('workspace_id', workspaceId);

  const statsById = new Map((stats ?? []).map((s) => [s.campaign_id, s]));

  const rows: CampaignRow[] = (campaigns ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    platform: c.platform,
    status: c.status,
    leadsCount: statsById.get(c.id)?.leads_count ?? 0,
    viewsCount: statsById.get(c.id)?.views_count ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink">الحملات</h1>
          <p className="text-sm text-ink-muted">تتبع أداء كل حملة إعلانية من الزيارة حتى العميل المحتمل.</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus size={16} />
            حملة جديدة
          </Button>
        </Link>
      </div>

      <PageGuide guideKey="campaigns" title={CAMPAIGNS_GUIDE.title} steps={CAMPAIGNS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      <Table<CampaignRow>
        keyField={(row) => row.id}
        rows={rows}
        emptyMessage="لا توجد حملات بعد. أنشئ حملتك الأولى واربطها بصفحة هبوط لبدء تتبع الإسناد."
        columns={[
          {
            header: 'اسم الحملة',
            cell: (row) => (
              <Link href={`/campaigns/${row.id}`} className="font-medium text-brand-600 hover:underline">
                {row.name}
              </Link>
            ),
          },
          { header: 'المنصة', cell: (row) => PLATFORM_LABELS[row.platform] },
          {
            header: 'الحالة',
            cell: (row) => (
              <Badge tone={CAMPAIGN_STATUS_TONE[row.status]}>{CAMPAIGN_STATUS_LABELS[row.status]}</Badge>
            ),
          },
          { header: 'الزيارات', cell: (row) => row.viewsCount },
          { header: 'العملاء المحتملون', cell: (row) => row.leadsCount },
          {
            header: 'معدل التحويل',
            cell: (row) =>
              row.viewsCount > 0 ? `${((row.leadsCount / row.viewsCount) * 100).toFixed(1)}%` : '—',
          },
        ]}
      />
    </div>
  );
}
