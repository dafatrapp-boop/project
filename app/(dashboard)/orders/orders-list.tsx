'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, ShoppingBag, Trash2, Phone, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { IconButton } from '@/components/ui/button';
import { Table, type Column } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { digitsOnly, whatsAppLink } from '@/lib/utils';
import { deleteOrderAction } from './actions';
import { OrderStatusSelect } from './status-select';
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER, type OrderStatus } from '@/lib/orders/constants';

export interface OrderRow {
  id: string;
  product_name: string;
  price: number;
  currency: string;
  payment_method: string | null;
  status: OrderStatus;
  created_at: string;
  leads: { full_name: string; phone: string | null } | null;
}

function DeleteOrderButton({ orderId, productName }: { orderId: string; productName: string }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={`حذف طلب ${productName}`}
      disabled={pending}
      className="hover:bg-danger-50 hover:text-danger"
      onClick={() => {
        // Phase 4.3 — this delete previously had zero confirmation
        // anywhere it appeared in the product. Same server action,
        // same permission check underneath; only a client-side
        // confirmation step was added before calling it.
        if (!window.confirm(`هل تريد حذف طلب "${productName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
        startTransition(async () => {
          await deleteOrderAction(orderId);
          show('تم حذف الطلب', 'success');
        });
      }}
    >
      <Trash2 size={14} />
    </IconButton>
  );
}

export function OrdersList({ rows }: { rows: OrderRow[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | OrderStatus>('');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (q) {
        const needle = q.toLowerCase();
        const matches =
          r.product_name.toLowerCase().includes(needle) ||
          (r.leads?.full_name ?? '').toLowerCase().includes(needle);
        if (!matches) return false;
      }
      return true;
    });
  }, [rows, q, status]);

  const columns: Column<OrderRow>[] = [
    { header: 'المنتج / الخدمة', cell: (row) => <span className="font-medium text-ink">{row.product_name}</span> },
    { header: 'السعر', cell: (row) => `${row.price} ${row.currency}` },
    { header: 'طريقة الدفع', cell: (row) => row.payment_method ?? '—' },
    {
      header: 'العميل',
      cell: (row) =>
        row.leads ? (
          <span className="flex items-center gap-1.5">
            {row.leads.full_name}
            {row.leads.phone && (
              <span className="flex items-center gap-1">
                <a href={`tel:${digitsOnly(row.leads.phone)}`} aria-label={`اتصال بـ ${row.leads.full_name}`} className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-brand-50 hover:text-brand-600">
                  <Phone size={12} />
                </a>
                <a href={whatsAppLink(row.leads.phone)} target="_blank" rel="noopener noreferrer" aria-label={`واتساب ${row.leads.full_name}`} className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-success-50 hover:text-success">
                  <MessageCircle size={12} />
                </a>
              </span>
            )}
          </span>
        ) : (
          '—'
        ),
    },
    { header: 'الحالة', cell: (row) => <OrderStatusSelect orderId={row.id} status={row.status} /> },
    { header: 'تاريخ الإنشاء', cell: (row) => new Date(row.created_at).toLocaleDateString('ar-SA') },
    { header: '', cell: (row) => <DeleteOrderButton orderId={row.id} productName={row.product_name} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالمنتج أو اسم العميل..." className="!ps-9" />
        </div>
        <div className="sm:w-48">
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">كل الحالات</option>
            {ORDER_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>
      </div>

      <Table<OrderRow>
        keyField={(row) => row.id}
        rows={filtered}
        emptyIcon={ShoppingBag}
        emptyTitle={rows.length === 0 ? 'لا توجد طلبات بعد' : 'لا توجد نتائج مطابقة'}
        emptyMessage={rows.length === 0 ? 'أضف أول طلب لعميلك لتبدأ بمتابعة المبيعات من هنا.' : 'جرّب كلمة بحث أو فلتر مختلف.'}
        columns={columns}
      />
    </div>
  );
}
