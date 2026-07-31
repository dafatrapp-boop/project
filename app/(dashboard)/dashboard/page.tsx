import { createClient } from '@/lib/supabase/server';
import { Users, TrendingUp, Clock, Trophy, UserPlus, Activity as ActivityIcon, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { ACTIVITY_LABELS } from '@/lib/leads/constants';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { DASHBOARD_GUIDE } from '@/lib/guide/content';
import { ORDER_RELEVANT_INDUSTRIES } from '@/lib/orders/constants';

const WORKSPACE_ACTION_LABELS: Record<string, string> = {
  landing_page_updated: 'عدّل صفحة هبوط',
  landing_page_deleted: 'حذف صفحة هبوط',
  lead_deleted: 'حذف عميلًا محتملًا',
  member_added: 'أضاف عضوًا للفريق',
  member_removed: 'أزال عضوًا من الفريق',
};

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(name, industry)')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle();

  const workspaceId = membership?.workspace_id ?? '';
  const workspacesRaw = membership?.workspaces as
  | { name: string; industry: string }
  | { name: string; industry: string }[]
  | undefined;
const workspaceMeta = Array.isArray(workspacesRaw) ? workspacesRaw[0] ?? null : workspacesRaw ?? null;
  const workspaceName = workspaceMeta?.name ?? '';
  const showOrders = ORDER_RELEVANT_INDUSTRIES.includes(
    (workspaceMeta?.industry ?? 'other') as (typeof ORDER_RELEVANT_INDUSTRIES)[number]
  );

  // Opportunistic automation pass — see run_workspace_automations() in
  // 0019_automation.sql: there's no background scheduler in this
  // project, so time-based rules (stale-lead reminders, inactivity
  // flags) are checked here, on a page every merchant visits daily.
  if (workspaceId) {
    await supabase.rpc('run_workspace_automations', { p_workspace_id: workspaceId });
  }

  const guideDismissed = await getGuideDismissed(supabase, user!.id, 'dashboard');

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
      <div>
        <h1 className="text-xl font-semibold text-ink">مرحبًا بك، {workspaceName}</h1>
        <p className="text-sm text-ink-muted">هذه نظرة تنفيذية سريعة على أداء اليوم.</p>
      </div>

      <PageGuide
        guideKey="dashboard"
        title={DASHBOARD_GUIDE.title}
        steps={DASHBOARD_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <div className="mb-2 flex items-center gap-2 text-ink-muted">
            <Users size={16} />
            <span className="text-sm">عملاء اليوم</span>
          </div>
          <p className="text-2xl font-semibold text-ink">{todayLeadsCount ?? 0}</p>
          <p className="mt-1 text-xs text-ink-faint">الإجمالي: {leadsCount ?? 0}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <div className="mb-2 flex items-center gap-2 text-ink-muted">
            <TrendingUp size={16} />
            <span className="text-sm">تحويل اليوم</span>
          </div>
          <p className="text-2xl font-semibold text-ink">{todayConversion !== null ? `${todayConversion}%` : '—'}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {todayViews > 0 ? `من ${todayViews} زيارة اليوم` : 'لا توجد زيارات اليوم بعد'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <div className="mb-2 flex items-center gap-2 text-ink-muted">
            <Trophy size={16} />
            <span className="text-sm">أفضل حملة</span>
          </div>
          <p className="truncate text-lg font-semibold text-ink">{bestCampaignName ?? '—'}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {bestCampaign ? `${bestCampaign.leads_count} عميل محتمل (كل الأوقات)` : 'لا توجد حملات بعد'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <div className="mb-2 flex items-center gap-2 text-ink-muted">
            <UserPlus size={16} />
            <span className="text-sm">عملاء جدد (بيع اليوم)</span>
          </div>
          <p className="text-2xl font-semibold text-ink">{todayWonCount ?? 0}</p>
        </div>
      </div>

      {showOrders && orderStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
            <div className="mb-2 flex items-center gap-2 text-ink-muted">
              <ShoppingBag size={16} />
              <span className="text-sm">إجمالي الطلبات</span>
            </div>
            <p className="text-2xl font-semibold text-ink">{orderStats.total_orders}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
            <div className="mb-2 flex items-center gap-2 text-ink-muted">
              <ShoppingBag size={16} />
              <span className="text-sm">إجمالي المبيعات</span>
            </div>
            <p className="text-2xl font-semibold text-ink">{orderStats.total_sales}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
            <div className="mb-2 flex items-center gap-2 text-ink-muted">
              <ShoppingBag size={16} />
              <span className="text-sm">الإيراد المُحصَّل</span>
            </div>
            <p className="text-2xl font-semibold text-ink">{orderStats.revenue}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <div className="mb-3 flex items-center gap-2 text-ink-muted">
            <Clock size={16} />
            <span className="text-sm font-medium">متابعات تحتاج إلى إجراء</span>
          </div>
          {(dueFollowUps ?? []).length === 0 ? (
            <p className="text-sm text-ink-faint">لا توجد متابعات متأخرة أو مستحقة الآن.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(dueFollowUps ?? []).map((f) => {
                const lead = f.leads as unknown as { id: string; full_name: string } | null;
                return (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <Link href={`/leads/${lead?.id}`} className="text-brand-600 hover:underline">
                      {lead?.full_name ?? 'عميل محتمل'}
                    </Link>
                    <span className="text-ink-faint">{new Date(f.due_at).toLocaleString('ar-SA')}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <div className="mb-3 flex items-center gap-2 text-ink-muted">
            <ActivityIcon size={16} />
            <span className="text-sm font-medium">آخر النشاطات</span>
          </div>
          {feed.length === 0 ? (
            <p className="text-sm text-ink-faint">لا يوجد نشاط بعد.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {feed.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{item.label}</span>
                  <span className="whitespace-nowrap text-xs text-ink-faint">
                    {new Date(item.created_at).toLocaleString('ar-SA')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
