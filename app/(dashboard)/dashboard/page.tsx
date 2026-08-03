import { requireWorkspace } from '@/lib/workspace';
import { Users, TrendingUp, Clock, Trophy, UserPlus, Activity as ActivityIcon, ShoppingBag, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ACTIVITY_LABELS } from '@/lib/leads/constants';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { DASHBOARD_GUIDE } from '@/lib/guide/content';
import { ORDER_RELEVANT_INDUSTRIES } from '@/lib/orders/constants';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

const WORKSPACE_ACTION_LABELS: Record<string, string> = {
  landing_page_updated: 'عدّل صفحة هبوط',
  landing_page_deleted: 'حذف صفحة هبوط',
  lead_deleted: 'حذف عميلًا محتملًا',
  member_added: 'أضاف عضوًا للفريق',
  member_removed: 'أزال عضوًا من الفريق',
};

export default async function DashboardOverviewPage() {
  const { supabase, user, workspaceId, name: workspaceName, industry } = await requireWorkspace();
  const showOrders = ORDER_RELEVANT_INDUSTRIES.includes(
    industry as (typeof ORDER_RELEVANT_INDUSTRIES)[number]
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const todayDateOnly = todayIso.slice(0, 10);

  const [
    { count: leadsCount },
    { count: todayLeadsCount },
    { data: todayViewsRow },
    { count: todayWonCount },
    { data: dueFollowUps },
    { data: campaignRows },
    { data: campaignStatsRows },
    { data: recentLeadActivities },
    { data: recentWorkspaceActivity },
    { data: orderStats },
    ,
    guideDismissed,
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', todayIso),
    supabase
      .from('page_views_daily_counts')
      .select('views_count')
      .eq('workspace_id', workspaceId)
      .eq('day', todayDateOnly)
      .maybeSingle(),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'won')
      .gte('updated_at', todayIso),
    supabase
      .from('lead_follow_ups')
      .select('id, due_at, leads(id, full_name)')
      .eq('workspace_id', workspaceId)
      .is('completed_at', null)
      .lte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true })
      .limit(5),
    supabase.from('campaigns').select('id, name').eq('workspace_id', workspaceId),
    supabase.from('campaign_stats').select('campaign_id, leads_count').eq('workspace_id', workspaceId),
    supabase
      .from('lead_activities')
      .select('id, type, created_at, leads(full_name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('workspace_activity_log')
      .select('id, action, entity_label, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5),
    showOrders
      ? supabase.from('order_stats').select('*').eq('workspace_id', workspaceId).maybeSingle()
      : Promise.resolve({ data: null }),
    // Opportunistic automation pass — see run_workspace_automations() in
    // 0019_automation.sql: there's no background scheduler in this
    // project, so time-based rules (stale-lead reminders, inactivity
    // flags) are checked here, on a page every merchant visits daily.
    // Independent of every other query above — only needs workspaceId,
    // already resolved by requireWorkspace() — so it belongs in this
    // same batch instead of a separate sequential await.
    supabase.rpc('run_workspace_automations', { p_workspace_id: workspaceId }),
    getGuideDismissed(supabase, user.id, 'dashboard'),
  ]);

  const todayViews = todayViewsRow?.views_count ?? 0;
  const todayConversion = todayViews > 0 ? (((todayLeadsCount ?? 0) / todayViews) * 100).toFixed(1) : null;

  const campaignNameById = new Map((campaignRows ?? []).map((c) => [c.id, c.name]));
  const bestCampaign = (campaignStatsRows ?? [])
    .filter((s) => s.leads_count > 0)
    .sort((a, b) => b.leads_count - a.leads_count)[0];
  const bestCampaignName = bestCampaign ? campaignNameById.get(bestCampaign.campaign_id) : null;

  // Merge the two activity sources into one feed, sorted by time.
  type FeedItem = { id: string; label: string; created_at: string; href?: string };
  const feed: FeedItem[] = [
    ...(recentLeadActivities ?? []).map((a) => ({
      id: `lead-${a.id}`,
      label: `${ACTIVITY_LABELS[a.type] ?? a.type} — ${(a.leads as unknown as { full_name: string } | null)?.full_name ?? 'عميل'}`,
      created_at: a.created_at,
    })),
    ...(recentWorkspaceActivity ?? []).map((a) => ({
      id: `ws-${a.id}`,
      label: `${WORKSPACE_ACTION_LABELS[a.action] ?? a.action}${a.entity_label ? `: ${a.entity_label}` : ''}`,
      created_at: a.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`مرحبًا بك، ${workspaceName}`}
        description="نظرة تنفيذية سريعة على أداء اليوم."
        actions={
          <Link href="/leads">
            <Button variant="secondary" size="sm">
              عرض كل العملاء
            </Button>
          </Link>
        }
      />

      <PageGuide
        guideKey="dashboard"
        title={DASHBOARD_GUIDE.title}
        steps={DASHBOARD_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStat
          icon={Users}
          tone="brand"
          label="عملاء اليوم"
          value={todayLeadsCount ?? 0}
          helper={`الإجمالي: ${leadsCount ?? 0}`}
        />
        <DashboardStat
          icon={TrendingUp}
          tone="success"
          label="تحويل اليوم"
          value={todayConversion !== null ? `${todayConversion}%` : '—'}
          helper={todayViews > 0 ? `من ${todayViews} زيارة اليوم` : 'لا توجد زيارات اليوم بعد'}
        />
        <DashboardStat
          icon={Trophy}
          tone="warning"
          label="أفضل حملة"
          value={bestCampaignName ?? '—'}
          valueClassName="truncate text-title text-ink"
          helper={bestCampaign ? `${bestCampaign.leads_count} عميل محتمل (كل الأوقات)` : 'لا توجد حملات بعد'}
        />
        <DashboardStat
          icon={UserPlus}
          tone="info"
          label="عملاء جدد (بيع اليوم)"
          value={todayWonCount ?? 0}
        />
      </div>

      {showOrders && orderStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStat icon={ShoppingBag} tone="brand" label="إجمالي الطلبات" value={orderStats.total_orders} />
          <DashboardStat icon={ShoppingBag} tone="success" label="إجمالي المبيعات" value={orderStats.total_sales} />
          <DashboardStat icon={ShoppingBag} tone="info" label="الإيراد المُحصَّل" value={orderStats.revenue} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="متابعات تحتاج إلى إجراء"
            action={<Clock size={16} className="text-ink-faint" />}
          />
          {(dueFollowUps ?? []).length === 0 ? (
            <EmptyState
              icon={Clock}
              title="لا توجد متابعات مستحقة"
              description="كل المتابعات محدّثة الآن — عمل رائع."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {(dueFollowUps ?? []).map((f) => {
                const lead = f.leads as unknown as { id: string; full_name: string } | null;
                const overdue = new Date(f.due_at) < todayStart;
                return (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Link href={`/leads/${lead?.id}`} className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={lead?.full_name ?? '?'} size="sm" />
                      <span className="truncate text-body-sm font-medium text-ink hover:text-brand-600">
                        {lead?.full_name ?? 'عميل محتمل'}
                      </span>
                    </Link>
                    <Badge tone={overdue ? 'danger' : 'warning'} size="sm">
                      {overdue ? 'متأخر' : 'اليوم'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="آخر النشاطات"
            action={<ActivityIcon size={16} className="text-ink-faint" />}
          />
          {feed.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="لا يوجد نشاط بعد" description="ستظهر هنا آخر التحديثات على مساحتك." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {feed.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        item.id.startsWith('lead-') ? 'bg-brand-500' : 'bg-neutral-500'
                      )}
                      aria-hidden
                    />
                    <span className="truncate text-body-sm text-ink">{item.label}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-caption text-ink-faint">
                    {new Date(item.created_at).toLocaleString('ar-SA')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function DashboardStat({
  icon: Icon,
  tone,
  label,
  value,
  helper,
  valueClassName,
}: {
  icon: LucideIcon;
  tone: 'brand' | 'success' | 'warning' | 'info';
  label: string;
  value: string | number;
  helper?: string;
  valueClassName?: string;
}) {
  const toneClasses: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success',
    warning: 'bg-warning-50 text-warning',
    info: 'bg-info-50 text-info',
  };
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-ink-muted">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', toneClasses[tone])}>
          <Icon size={16} />
        </span>
      </div>
      <p className={valueClassName ?? 'mt-3 text-title-lg text-ink'}>{value}</p>
      {helper && <p className="mt-1 text-caption text-ink-faint">{helper}</p>}
    </Card>
  );
}
