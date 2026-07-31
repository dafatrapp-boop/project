import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import {
  PLATFORM_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONE,
} from '@/lib/campaigns/constants';
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONE, type LeadStatus } from '@/lib/leads/constants';
import { CampaignStatusSelect } from './status-select';

interface LeadRow {
  id: string;
  full_name: string;
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

  const [{ data: stats }, { data: leads }] = await Promise.all([
    supabase
      .from('campaign_stats')
      .select('leads_count, won_count, views_count')
      .eq('campaign_id', campaign.id)
      .maybeSingle(),
    supabase
      .from('leads')
      .select('id, full_name, status, created_at')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false }),
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
      <Link href="/campaigns" className="flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronRight size={16} className="icon-flip" />
        العودة إلى الحملات
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{campaign.name}</h1>
            <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {PLATFORM_LABELS[campaign.platform]}
            {landingPage && (
              <>
                {' · '}
                <a href={`/p/${landingPage.slug}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                  {landingPage.title}
                </a>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-ink-faint" dir="ltr">
            utm_campaign={campaign.utm_campaign}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <CampaignStatusSelect campaignId={campaign.id} status={campaign.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="الزيارات" value={stats?.views_count ?? 0} />
        <Stat label="العملاء المحتملون" value={stats?.leads_count ?? 0} />
        <Stat label="عمليات البيع" value={stats?.won_count ?? 0} />
        <Stat label="معدل التحويل" value={conversionRate ? `${conversionRate}%` : '—'} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">العملاء المحتملون المرتبطون بهذه الحملة</h2>
        <Table<LeadRow>
          keyField={(row) => row.id}
          rows={leads ?? []}
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
              header: 'الحالة',
              cell: (row) => <Badge tone={LEAD_STATUS_TONE[row.status]}>{LEAD_STATUS_LABELS[row.status]}</Badge>,
            },
            { header: 'التاريخ', cell: (row) => new Date(row.created_at).toLocaleDateString('ar-SA') },
          ]}
        />
      </div>
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
