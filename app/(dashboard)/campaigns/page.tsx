import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { CampaignsList, type CampaignRow } from './campaigns-list';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { CAMPAIGNS_GUIDE } from '@/lib/guide/content';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, getPageRange, parsePageParam, splitPage } from '@/lib/pagination';

export default async function CampaignsListPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { supabase, workspaceId, user } = await requireWorkspace();
  const page = parsePageParam(searchParams.page);
  const [from, to] = getPageRange(page, DEFAULT_PAGE_SIZE);

  const [guideDismissed, { data: campaignsRaw }] = await Promise.all([
    getGuideDismissed(supabase, user.id, 'campaigns'),
    supabase
      .from('campaigns')
      .select('id, name, platform, status')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(from, to),
  ]);

  const { rows: campaigns, hasMore } = splitPage(campaignsRaw ?? [], DEFAULT_PAGE_SIZE);
  const campaignIds = campaigns.map((c) => c.id);
  const { data: stats } =
    campaignIds.length > 0
      ? await supabase
          .from('campaign_stats')
          .select('campaign_id, leads_count, views_count')
          .eq('workspace_id', workspaceId)
          .in('campaign_id', campaignIds)
      : { data: [] };
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
      <PageHeader
        title="الحملات"
        description="تتبع أداء كل حملة إعلانية من الزيارة حتى العميل المحتمل."
        actions={
          <Link href="/campaigns/new">
            <Button>
              <Plus size={16} />
              حملة جديدة
            </Button>
          </Link>
        }
      />

      <PageGuide guideKey="campaigns" title={CAMPAIGNS_GUIDE.title} steps={CAMPAIGNS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      <CampaignsList rows={rows} />

      <Pagination page={page} hasMore={hasMore} searchParams={searchParams} basePath="/campaigns" />
    </div>
  );
}
