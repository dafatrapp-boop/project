import Link from 'next/link';
import { Download, Upload, KanbanSquare, MoreVertical, Phone, MessageCircle, Users, Trash2, Users2 } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Table, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { AddLeadButton } from './add-lead-button';
import { hasFeature } from '@/lib/plans/constants';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { LEADS_GUIDE } from '@/lib/guide/content';
import { digitsOnly, whatsAppLink } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, getPageRange, parsePageParam, splitPage } from '@/lib/pagination';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TONE,
  LEAD_STATUS_ORDER,
  formatLeadSource,
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
  searchParams: { q?: string; status?: string; tag?: string; error?: string; page?: string };
}) {
  const { supabase, workspaceId, plan, user, role } = await requireWorkspace();
  const showTags = hasFeature(plan, 'tags');
  const showKanban = hasFeature(plan, 'kanbanPipeline');
  const showImport = hasFeature(plan, 'csvImport');
  const showExcel = hasFeature(plan, 'excelExport');

  const page = parsePageParam(searchParams.page);
  const [from, to] = getPageRange(page, DEFAULT_PAGE_SIZE);

  let query = supabase
    .from('leads')
    .select('id, full_name, phone, source, status, tags, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, to);

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

  // Independent of each other — only need workspaceId/user.id, both
  // already resolved above.
  const [{ data: leadsRaw }, guideDismissed] = await Promise.all([
    query,
    getGuideDismissed(supabase, user.id, 'leads'),
  ]);
  const { rows: leads, hasMore } = splitPage(leadsRaw ?? [], DEFAULT_PAGE_SIZE);

  const columns: Column<LeadRow>[] = [
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
          <span className="flex items-center gap-2.5">
            <span className="text-ink">{row.phone}</span>
            <span className="flex items-center gap-1">
              <a
                href={`tel:${digitsOnly(row.phone)}`}
                aria-label={`اتصال بـ ${row.full_name}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <Phone size={14} />
              </a>
              <a
                href={whatsAppLink(row.phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`واتساب ${row.full_name}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-success-50 hover:text-success"
              >
                <MessageCircle size={14} />
              </a>
            </span>
          </span>
        ) : (
          '—'
        ),
    },
    { header: 'المصدر', cell: (row) => formatLeadSource(row.source) },
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

  // Overflow menu items — CSV/Excel import/export used to render as
  // 3-4 same-weight buttons in the toolbar (Phase 1 finding). Pipeline
  // stays a first-class visible action since it's a primary way of
  // working leads, not a secondary utility.
  const overflowItems = [
    ...(showImport ? [{ label: 'استيراد CSV', icon: <Upload size={15} />, href: '/leads/import' }] : []),
    { label: 'تصدير CSV', icon: <Download size={15} />, href: '/api/exports/leads' },
    ...(showExcel ? [{ label: 'تصدير Excel', icon: <Download size={15} />, href: '/api/exports/leads-xlsx' }] : []),
    ...(role === 'owner' || role === 'admin'
      ? [
          { label: 'العملاء المكررون', icon: <Users2 size={15} />, href: '/leads/duplicates' },
          { label: 'سلة المحذوفات', icon: <Trash2 size={15} />, href: '/leads/trash' },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="العملاء المحتملون"
        description="تابع كل زائر تحول إلى عميل محتمل من إعلاناتك."
        actions={
          <>
            {showKanban && (
              <Link href="/leads/pipeline">
                <Button variant="secondary" size="sm">
                  <KanbanSquare size={15} />
                  عرض Pipeline
                </Button>
              </Link>
            )}
            {overflowItems.length > 0 && (
              <DropdownMenu
                trigger={
                  <IconButton variant="secondary" size="sm" aria-label="المزيد من الإجراءات">
                    <MoreVertical size={16} />
                  </IconButton>
                }
                items={overflowItems}
              />
            )}
            <AddLeadButton />
          </>
        }
      />

      <PageGuide guideKey="leads" title={LEADS_GUIDE.title} steps={LEADS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      {searchParams.error && (
        <div className="rounded-md border border-warning/30 bg-warning-50 px-3 py-2 text-body-sm text-warning">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ.'}
        </div>
      )}

      <Card padding="md" tone="sunken">
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
          <Button type="submit" variant="secondary" className="sm:w-auto">
            تصفية
          </Button>
        </form>
      </Card>

      <Table<LeadRow>
        keyField={(row) => row.id}
        rows={leads}
        emptyIcon={Users}
        emptyTitle="لا يوجد عملاء محتملون بعد"
        emptyMessage="أضف أول عميل أو انتظر أول استمارة من صفحة الهبوط."
        emptyAction={<AddLeadButton />}
        columns={columns}
      />

      <Pagination page={page} hasMore={hasMore} searchParams={searchParams} basePath="/leads" />
    </div>
  );
}
