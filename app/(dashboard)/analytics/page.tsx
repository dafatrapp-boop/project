import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Badge } from '@/components/ui/badge';
import { TrendChart, type TrendPoint } from '@/components/analytics/trend-chart';
import { SourceBreakdownChart, type SourceCount } from '@/components/analytics/source-breakdown-chart';
import { CampaignBreakdownChart, type CampaignCount } from '@/components/analytics/campaign-breakdown-chart';
import { FunnelChart } from '@/components/analytics/funnel-chart';
import { CampaignTrendChart, type CampaignTrendPoint } from '@/components/analytics/campaign-trend-chart';
import { RefreshButton } from '@/components/analytics/refresh-button';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { ANALYTICS_GUIDE } from '@/lib/guide/content';

const RANGE_OPTIONS = [
  { value: '7', label: 'آخر 7 أيام' },
  { value: '30', label: 'آخر 30 يومًا' },
  { value: '90', label: 'آخر 90 يومًا' },
];

function formatDay(day: string) {
  return new Date(day).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const { supabase, workspaceId, user } = await requireWorkspace();
  const guideDismissed = await getGuideDismissed(supabase, user.id, 'analytics');

  const rangeDays = Number(searchParams.range ?? '30');
  const validRange = [7, 30, 90].includes(rangeDays) ? rangeDays : 30;
  const since = new Date();
  since.setDate(since.getDate() - validRange);
  const sinceIso = since.toISOString();

  const [
    { data: leadsDaily },
    { data: viewsDaily },
    { data: leadsInRange },
    { data: campaigns },
    { data: campaignRows },
    { data: campaignDaily },
  ] = await Promise.all([
    supabase
      .from('leads_daily_counts')
      .select('day, leads_count, won_count')
      .eq('workspace_id', workspaceId)
      .gte('day', sinceIso.slice(0, 10)),
    supabase
      .from('page_views_daily_counts')
      .select('day, views_count')
      .eq('workspace_id', workspaceId)
      .gte('day', sinceIso.slice(0, 10)),
    supabase
      .from('leads')
      .select('id, source, status, campaign_id')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceIso),
    supabase.from('campaigns').select('budget').eq('workspace_id', workspaceId),
    supabase.from('campaigns').select('id, name').eq('workspace_id', workspaceId),
    supabase
      .from('campaign_daily_leads_counts')
      .select('campaign_id, day, leads_count')
      .eq('workspace_id', workspaceId)
      .gte('day', sinceIso.slice(0, 10)),
  ]);

  // Build a complete day-by-day series (filling gaps with 0) rather
  // than only plotting days that had activity — a flat line at 0 is
  // real signal, not a rendering gap.
  const leadsByDay = new Map((leadsDaily ?? []).map((d) => [d.day, d.leads_count]));
  const viewsByDay = new Map((viewsDaily ?? []).map((d) => [d.day, d.views_count]));
  const trendData: TrendPoint[] = [];
  for (let i = validRange - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trendData.push({
      day: formatDay(key),
      views: viewsByDay.get(key) ?? 0,
      leads: leadsByDay.get(key) ?? 0,
    });
  }

  const totalViews = (viewsDaily ?? []).reduce((sum, d) => sum + d.views_count, 0);
  const totalLeads = leadsInRange?.length ?? 0;
  const totalWon = (leadsInRange ?? []).filter((l) => l.status === 'won').length;
  const totalContacted = (leadsInRange ?? []).filter((l) => l.status !== 'new').length;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : null;

  const sourceCounts = new Map<string, number>();
  for (const lead of leadsInRange ?? []) {
    const key = lead.source ?? 'غير معروف';
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const sourceData: SourceCount[] = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totalBudget = (campaigns ?? []).reduce((sum, c) => sum + (c.budget ?? 0), 0);
  const attributedLeads = (leadsInRange ?? []).filter((l) => l.campaign_id !== null).length;
  const costPerLead =
    totalBudget > 0 && attributedLeads > 0 ? (totalBudget / attributedLeads).toFixed(2) : null;

  // Aggregate from leadsInRange (already filtered by the selected date
  // range) rather than the all-time campaign_stats view, so this chart
  // actually respects the 7/30/90-day picker like the rest of the page.
  const campaignNameById = new Map((campaignRows ?? []).map((c) => [c.id, c.name]));
  const leadsPerCampaign = new Map<string, number>();
  for (const lead of leadsInRange ?? []) {
    if (!lead.campaign_id) continue;
    leadsPerCampaign.set(lead.campaign_id, (leadsPerCampaign.get(lead.campaign_id) ?? 0) + 1);
  }
  const campaignData: CampaignCount[] = Array.from(leadsPerCampaign.entries())
    .map(([campaignId, count]) => ({ campaign: campaignNameById.get(campaignId) ?? 'حملة محذوفة', count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Day-by-day trend, one line per campaign — limited to the top 5 by
  // volume in this range, since a line per campaign past that point
  // stops being readable.
  const topCampaignIds = Array.from(leadsPerCampaign.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const topCampaignNames = topCampaignIds.map((id) => campaignNameById.get(id) ?? 'حملة محذوفة');

  const dailyByCampaignAndDay = new Map<string, Map<string, number>>();
  for (const row of campaignDaily ?? []) {
    if (!topCampaignIds.includes(row.campaign_id)) continue;
    const name = campaignNameById.get(row.campaign_id) ?? 'حملة محذوفة';
    if (!dailyByCampaignAndDay.has(name)) dailyByCampaignAndDay.set(name, new Map());
    dailyByCampaignAndDay.get(name)!.set(row.day, row.leads_count);
  }

  const campaignTrendData: CampaignTrendPoint[] = [];
  for (let i = validRange - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const point: CampaignTrendPoint = { day: formatDay(key) };
    for (const name of topCampaignNames) {
      point[name] = dailyByCampaignAndDay.get(name)?.get(key) ?? 0;
    }
    campaignTrendData.push(point);
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink">التحليلات</h1>
          <p className="text-sm text-ink-muted">أداء صفحاتك وحملاتك خلال الفترة المحددة.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
            {RANGE_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/analytics?range=${opt.value}`}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  validRange === Number(opt.value)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
          <RefreshButton />
          <a
            href={`/api/exports/analytics?range=${validRange}`}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            <Download size={16} />
            تصدير CSV
          </a>
        </div>
      </div>

      <PageGuide guideKey="analytics" title={ANALYTICS_GUIDE.title} steps={ANALYTICS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="الزيارات" value={totalViews} />
        <Stat label="العملاء المحتملون" value={totalLeads} />
        <Stat label="عمليات البيع" value={totalWon} />
        <Stat label="معدل التحويل" value={conversionRate ? `${conversionRate}%` : '—'} />
        <Stat label="تكلفة العميل المحتمل" value={costPerLead ? costPerLead : '—'} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold text-ink">قمع التحويل (Funnel)</h2>
        <FunnelChart
          stages={[
            { label: 'الزيارات', value: totalViews },
            { label: 'العملاء المحتملون (نماذج)', value: totalLeads },
            { label: 'تم التواصل', value: totalContacted },
            { label: 'عمليات البيع', value: totalWon },
          ]}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold text-ink">الزيارات مقابل العملاء المحتملين</h2>
        {totalViews === 0 && totalLeads === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            لا توجد بيانات كافية بعد لهذه الفترة. انشر صفحة هبوط وشارك رابطها لتبدأ برؤية الأرقام.
          </p>
        ) : (
          <TrendChart data={trendData} />
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold text-ink">مصادر العملاء المحتملين</h2>
        {sourceData.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">لا توجد بيانات مصادر بعد.</p>
        ) : (
          <SourceBreakdownChart data={sourceData} />
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <h2 className="mb-1 text-sm font-semibold text-ink">العملاء المحتملون حسب الحملة</h2>
        <p className="mb-3 text-xs text-ink-faint">خلال الفترة المختارة أعلاه</p>
        {campaignData.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">لا توجد حملات بعد.</p>
        ) : (
          <CampaignBreakdownChart data={campaignData} />
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <h2 className="mb-1 text-sm font-semibold text-ink">اتجاه العملاء المحتملين يوميًا لكل حملة</h2>
        <p className="mb-3 text-xs text-ink-faint">
          أعلى {topCampaignNames.length} حملات من حيث عدد العملاء المحتملين خلال هذه الفترة
        </p>
        {topCampaignNames.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            لا توجد بيانات كافية بعد لعرض اتجاه يومي لكل حملة.
          </p>
        ) : (
          <CampaignTrendChart data={campaignTrendData} campaignNames={topCampaignNames} />
        )}
      </div>

      {costPerLead === null && (
        <Badge tone="neutral" className="w-fit">
          تكلفة العميل المحتمل تظهر بعد إضافة ميزانية لحملاتك وربطها بصفحات الهبوط
        </Badge>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
