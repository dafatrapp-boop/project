'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateOrderStatusAction } from './actions';
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER, ORDER_STATUS_TONE, type OrderStatus } from '@/lib/orders/constants';

// Phase 4.3 — tints the control itself by current status (not just an
// adjacent badge) so status is readable at a glance across a long
// table without needing to open the dropdown.
const TONE_CLASS: Record<string, string> = {
  neutral: '',
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  success: 'border-success/25 bg-success-50 text-success',
  warning: 'border-warning/25 bg-warning-50 text-warning',
  danger: 'border-danger/25 bg-danger-50 text-danger',
};

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
      className={TONE_CLASS[ORDER_STATUS_TONE[status]]}
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        startTransition(async () => {
          await updateOrderStatusAction(orderId, next);
          show('تم تحديث حالة الطلب', 'success');
        });
      }}
    >
      {ORDER_STATUS_ORDER.map((s) => (
        <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
      ))}
    </Select>
  );
}
