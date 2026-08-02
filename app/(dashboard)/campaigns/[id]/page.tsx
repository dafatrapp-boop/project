import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eye, Users, Trophy, TrendingUp, FileText, History, ExternalLink, Phone, MessageCircle } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table } from '@/components/ui/table';
import {
  PLATFORM_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONE,
} from '@/lib/campaigns/constants';
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONE, ACTIVITY_LABELS, type LeadStatus } from '@/lib/leads/constants';
import { digitsOnly, whatsAppLink } from '@/lib/utils';
import { CampaignStatusSelect } from './status-select';

interface LeadRow {
  id: string;
  full_name: string;
  phone: string | null;
  status: LeadStatus;
  created_at: string;
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, landing_pages(title, slug)')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!campaign) notFound();

  const [{ data: stats }, { data: leads }, { data: activities }] = await Promise.all([
    supabase
      .from('campaign_stats')
      .select('leads_count, won_count, views_count')
      .eq('campaign_id', campaign.id)
      .maybeSingle(),
    supabase
      .from('leads')
      .select('id, full_name, phone, status, created_at')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false }),
    // Additive read-only query: aggregates the existing lead_activities
    // table (already scoped by workspace_id, unchanged RLS) for every
    // lead tied to this campaign — answers the Phase 4.2 "activity
    // history" objective without any schema change.
    supabase
      .from('lead_activities')
      .select('id, type, created_at, leads!inner(full_name, campaign_id)')
      .eq('workspace_id', workspaceId)
      .eq('leads.campaign_id', campaign.id)
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  const landingPageRaw = campaign.landing_pages as
    | { title: string; slug: string }
    | { title: string; slug: string }[]
    | null;
  const landingPage = Array.isArray(landingPageRaw) ? landingPageRaw[0] ?? null : landingPageRaw;

  const conversionRate =
    stats && stats.views_count > 0 ? ((stats.leads_count / stats.views_count) * 100).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* No manual back-link — covered by the Phase 3 breadcrumb bar. */}
      <Card>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title-lg text-ink">{campaign.name}</h1>
              <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>
                {CAMPAIGN_STATUS_LABELS[campaign.status]}
              </Badge>
            </div>
            <p className="mt-1.5 text-body-sm text-ink-muted">{PLATFORM_LABELS[campaign.platform]}</p>
            <p className="mt-1 font-mono text-caption text-ink-faint" dir="ltr">
              utm_campaign={campaign.utm_campaign}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <CampaignStatusSelect campaignId={campaign.id} status={campaign.status} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Eye} label="الزيارات" value={stats?.views_count ?? 0} />
        <StatCard icon={Users} label="العملاء المحتملون" value={stats?.leads_count ?? 0} />
        <StatCard icon={Trophy} label="عمليات البيع" value={stats?.won_count ?? 0} />
        <StatCard icon={TrendingUp} label="معدل التحويل" value={conversionRate ? `${conversionRate}%` : '—'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card padding="none">
            <div className="p-4 pb-0">
              <CardHeader
                title="العملاء المحتملون المرتبطون بهذه الحملة"
                action={<Badge tone="neutral" size="sm">{leads?.length ?? 0}</Badge>}
              />
            </div>
            <div className="p-4 pt-0">
              <Table<LeadRow>
                keyField={(row) => row.id}
                rows={leads ?? []}
                emptyIcon={Users}
                emptyTitle="لا يوجد عملاء محتملون بعد"
                emptyMessage="لا يوجد عملاء محتملون مرتبطون بهذه الحملة بعد."
                columns={[
                  {
                    header: 'الاسم',
                    cell: (row) => (
                      <Link href={`/leads/${row.id}`} className="font-medium text-brand-600 hover:underline">
                        {row.full_name}
                      </Link>
                    ),
                  },
                  {
                    header: 'الهاتف',
                    cell: (row) =>
                      row.phone ? (
                        <span className="flex items-center gap-1.5">
                          <a href={`tel:${digitsOnly(row.phone)}`} aria-label={`اتصال بـ ${row.full_name}`} className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-brand-50 hover:text-brand-600">
                            <Phone size={12} />
                          </a>
                          <a href={whatsAppLink(row.phone)} target="_blank" rel="noopener noreferrer" aria-label={`واتساب ${row.full_name}`} className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-success-50 hover:text-success">
                            <MessageCircle size={12} />
                          </a>
                        </span>
                      ) : (
                        '—'
                      ),
                  },
                  {
                    header: 'الحالة',
                    cell: (row) => <Badge tone={LEAD_STATUS_TONE[row.status]}>{LEAD_STATUS_LABELS[row.status]}</Badge>,
                  },
                  { header: 'التاريخ', cell: (row) => new Date(row.created_at).toLocaleDateString('ar-SA') },
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="الصفحة المرتبطة" action={<FileText size={16} className="text-ink-faint" />} />
            {landingPage ? (
              <a
                href={`/p/${landingPage.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-md bg-surface-subtle px-3 py-2.5 text-body-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
              >
                {landingPage.title}
                <ExternalLink size={13} />
              </a>
            ) : (
              <p className="text-body-sm text-ink-faint">لا توجد صفحة هبوط مرتبطة بهذه الحملة.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="سجل النشاط" action={<History size={16} className="text-ink-faint" />} />
            {(activities ?? []).length === 0 ? (
              <p className="text-body-sm text-ink-faint">لا يوجد نشاط بعد.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {(activities ?? []).map((a) => {
                  const lead = a.leads as unknown as { full_name: string } | null;
                  return (
                    <li key={a.id} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                      <p className="text-body-sm text-ink">
                        {ACTIVITY_LABELS[a.type] ?? a.type} <span className="text-ink-faint">—</span>{' '}
                        <span className="font-medium">{lead?.full_name ?? 'عميل'}</span>
                      </p>
                      <p className="text-caption text-ink-faint">{new Date(a.created_at).toLocaleString('ar-SA')}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
