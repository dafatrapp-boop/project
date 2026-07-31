'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateOrderStatusAction } from './actions';
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER, type OrderStatus } from '@/lib/orders/constants';

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
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
