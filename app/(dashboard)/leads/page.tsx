import Link from 'next/link';
import { Download, Upload, KanbanSquare } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Table, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AddLeadButton } from './add-lead-button';
import { hasFeature } from '@/lib/plans/constants';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { LEADS_GUIDE } from '@/lib/guide/content';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TONE,
  LEAD_STATUS_ORDER,
  type LeadStatus,
} from '@/lib/leads/constants';

interface LeadRow {
  id: string;
  full_name: string;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  tags: string[];
  created_at: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  feature_requires_upgrade: 'هذه الميزة تتطلب ترقية باقتك. راجع صفحة الفريق والباقة.',
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; tag?: string; error?: string };
}) {
  const { supabase, workspaceId, plan, user } = await requireWorkspace();
  const showTags = hasFeature(plan, 'tags');
  const showKanban = hasFeature(plan, 'kanbanPipeline');
  const showImport = hasFeature(plan, 'csvImport');
  const showExcel = hasFeature(plan, 'excelExport');
  const guideDismissed = await getGuideDismissed(supabase, user.id, 'leads');

  let query = supabase
    .from('leads')
    .select('id, full_name, phone, source, status, tags, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (searchParams.status) {
    query = query.eq('status', searchParams.status as LeadStatus);
  }
  if (searchParams.tag && showTags) {
    query = query.contains('tags', [searchParams.tag]);
  }
  if (searchParams.q) {
    // textSearch uses the generated search_vector column (Phase 2 migration).
    query = query.textSearch('search_vector', searchParams.q, { type: 'websearch' });
  }

  const { data: leads } = await query;

  const columns: Column<LeadRow>[] = [
    {
      header: 'الاسم',
      cell: (row) => (
        <Link href={`/leads/${row.id}`} className="font-medium text-brand-600 hover:underline">
          {row.full_name}
        </Link>
      ),
    },
    { header: 'الهاتف', cell: (row) => row.phone ?? '—' },
    { header: 'المصدر', cell: (row) => row.source ?? '—' },
    {
      header: 'الحالة',
      cell: (row) => <Badge tone={LEAD_STATUS_TONE[row.status]}>{LEAD_STATUS_LABELS[row.status]}</Badge>,
    },
  ];

  if (showTags) {
    columns.push({
      header: 'الوسوم',
      cell: (row) =>
        row.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.tags.map((t) => (
              <Badge key={t} tone="neutral">{t}</Badge>
            ))}
          </div>
        ) : (
          '—'
        ),
    });
  }

  columns.push({
    header: 'تاريخ الإضافة',
    cell: (row) => new Date(row.created_at).toLocaleDateString('ar-SA'),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink">العملاء المحتملون</h1>
          <p className="text-sm text-ink-muted">تابع كل زائر تحول إلى عميل محتمل من إعلاناتك.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showKanban && (
            <Link
              href="/leads/pipeline"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <KanbanSquare size={16} />
              عرض Pipeline
            </Link>
          )}
          {showImport && (
            <Link
              href="/leads/import"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <Upload size={16} />
              استيراد CSV
            </Link>
          )}
          <a
            href="/api/exports/leads"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            <Download size={16} />
            تصدير CSV
          </a>
          {showExcel && (
            <a
              href="/api/exports/leads-xlsx"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <Download size={16} />
              تصدير Excel
            </a>
          )}
          <AddLeadButton />
        </div>
      </div>

      <PageGuide guideKey="leads" title={LEADS_GUIDE.title} steps={LEADS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      {searchParams.error && (
        <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ.'}
        </div>
      )}

      <form className="flex flex-col gap-3 sm:flex-row" method="get">
        <div className="flex-1">
          <Input
            name="q"
            defaultValue={searchParams.q}
            placeholder="ابحث بالاسم أو الهاتف أو البريد الإلكتروني..."
          />
        </div>
        <div className="sm:w-48">
          <Select name="status" defaultValue={searchParams.status ?? ''}>
            <option value="">كل الحالات</option>
            {LEAD_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
        {showTags && (
          <div className="sm:w-40">
            <Select name="tag" defaultValue={searchParams.tag ?? ''}>
              <option value="">كل الوسوم</option>
              <option value="VIP">VIP</option>
              <option value="ساخن">ساخن</option>
              <option value="بارد">بارد</option>
            </Select>
          </div>
        )}
      </form>

      <Table<LeadRow>
        keyField={(row) => row.id}
        rows={leads ?? []}
        emptyMessage="لا يوجد عملاء محتملون بعد. أضف أول عميل أو انتظر أول استمارة من صفحة الهبوط."
        columns={columns}
      />
    </div>
  );
}
