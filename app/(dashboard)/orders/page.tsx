import { ShoppingBag, Trash2 } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Table, type Column } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { AddOrderButton } from './add-order-button';
import { OrderStatusSelect } from './status-select';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { ORDERS_GUIDE } from '@/lib/guide/content';
import { deleteOrderAction } from './actions';
import type { OrderStatus } from '@/lib/orders/constants';

interface OrderRow {
  id: string;
  product_name: string;
  price: number;
  currency: string;
  payment_method: string | null;
  status: OrderStatus;
  created_at: string;
  leads: { full_name: string } | null;
}

export default async function OrdersPage() {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const [{ data: orders }, { data: leads }, { data: stats }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, product_name, price, currency, payment_method, status, created_at, leads(full_name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('leads').select('id, full_name').eq('workspace_id', workspaceId).order('full_name').limit(200),
    supabase.from('order_stats').select('*').eq('workspace_id', workspaceId).maybeSingle(),
  ]);

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'orders');

  const rows = (orders ?? []) as unknown as OrderRow[];

  const columns: Column<OrderRow>[] = [
    { header: 'المنتج / الخدمة', cell: (row) => row.product_name },
    {
      header: 'السعر',
      cell: (row) => `${row.price} ${row.currency}`,
    },
    { header: 'طريقة الدفع', cell: (row) => row.payment_method ?? '—' },
    { header: 'العميل', cell: (row) => row.leads?.full_name ?? '—' },
    {
      header: 'الحالة',
      cell: (row) => <OrderStatusSelect orderId={row.id} status={row.status} />,
    },
    {
      header: 'تاريخ الإنشاء',
      cell: (row) => new Date(row.created_at).toLocaleDateString('ar-SA'),
    },
    {
      header: '',
      cell: (row) => (
        <form action={deleteOrderAction.bind(null, row.id)}>
          <button type="submit" className="rounded p-1 text-danger hover:bg-danger/10" aria-label="حذف الطلب">
            <Trash2 size={16} />
          </button>
        </form>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">الطلبات</h1>
          <p className="text-sm text-ink-muted">سجّل بسيط للطلبات — بدون مخزون أو شحن أو محاسبة معقدة.</p>
        </div>
        <AddOrderButton leads={leads ?? []} />
      </div>

      <PageGuide guideKey="orders" title={ORDERS_GUIDE.title} steps={ORDERS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <p className="text-sm text-ink-muted">إجمالي الطلبات</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{stats?.total_orders ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <p className="text-sm text-ink-muted">إجمالي المبيعات</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{stats?.total_sales ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <p className="text-sm text-ink-muted">الإيراد المُحصَّل</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{stats?.revenue ?? 0}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="لا توجد طلبات بعد"
          description="أضف أول طلب لعميلك لتبدأ بمتابعة المبيعات من هنا."
        />
      ) : (
        <Table columns={columns} rows={rows} keyField={(row) => row.id} />
      )}
    </div>
  );
}
