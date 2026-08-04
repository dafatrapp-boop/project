import { redirect } from 'next/navigation';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { PageHeader } from '@/components/ui/page-header';
import { Table, type Column } from '@/components/ui/table';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LEAD_STATUS_LABELS, type LeadStatus } from '@/lib/leads/constants';
import { restoreLeadAction, purgeLeadAction } from './actions';

interface DeletedLeadRow {
  id: string;
  full_name: string;
  phone: string | null;
  status: LeadStatus;
  deleted_at: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'يلزم أن تكون مالكًا أو مشرفًا لهذا الإجراء.',
  restore_failed: 'تعذرت الاستعادة. حاول مرة أخرى.',
  purge_failed: 'تعذر الحذف النهائي. حاول مرة أخرى.',
};

export default async function LeadsTrashPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads');
  }

  const { data: deleted } = await supabase.rpc('list_deleted_leads', { p_workspace_id: workspaceId });
  const rows = (deleted ?? []) as unknown as DeletedLeadRow[];

  const columns: Column<DeletedLeadRow>[] = [
    { header: 'الاسم', cell: (row) => row.full_name },
    { header: 'الهاتف', cell: (row) => row.phone ?? '—' },
    { header: 'الحالة', cell: (row) => LEAD_STATUS_LABELS[row.status] },
    { header: 'تاريخ الحذف', cell: (row) => new Date(row.deleted_at).toLocaleDateString('ar-SA') },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <form action={restoreLeadAction.bind(null, row.id)}>
            <IconButton type="submit" variant="secondary" size="sm" aria-label="استعادة">
              <RotateCcw size={14} />
            </IconButton>
          </form>
          <form action={purgeLeadAction.bind(null, row.id)}>
            <IconButton type="submit" variant="danger" size="sm" aria-label="حذف نهائي">
              <X size={14} />
            </IconButton>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="سلة المحذوفات"
        description="العملاء المحذوفون يبقون هنا 30 يومًا قبل حذفهم نهائيًا تلقائيًا."
        actions={
          <a href="/leads">
            <Button variant="secondary" size="sm">
              رجوع للقائمة
            </Button>
          </a>
        }
      />

      {searchParams.error && (
        <div className="rounded-md border border-danger/30 bg-danger-50 px-3 py-2 text-body-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ.'}
        </div>
      )}
      {searchParams.success && (
        <div className="rounded-md border border-success/30 bg-success-50 px-3 py-2 text-body-sm text-success">
          تم بنجاح.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Trash2} title="سلة المحذوفات فارغة" description="لا يوجد عملاء محذوفون حاليًا." />
      ) : (
        <Table<DeletedLeadRow> keyField={(row) => row.id} rows={rows} columns={columns} />
      )}
    </div>
  );
}
