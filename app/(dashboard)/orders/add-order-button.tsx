'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { createOrderAction } from './actions';
import { PAYMENT_METHODS, CURRENCIES } from '@/lib/orders/constants';

export function AddOrderButton({ leads }: { leads: { id: string; full_name: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        طلب جديد
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="إضافة طلب جديد">
        <form action={createOrderAction} className="flex flex-col gap-4">
          <Input name="productName" label="المنتج / الخدمة" placeholder="مثال: باقة تنظيف بشرة" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="price" type="number" step="0.01" min={0} label="السعر" required />
            <Select name="currency" label="العملة" defaultValue="SAR">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <Select name="paymentMethod" label="طريقة الدفع">
            <option value="">— اختر —</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
          {leads.length > 0 && (
            <Select name="leadId" label="ربط بعميل (اختياري)">
              <option value="">— بدون ربط —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.full_name}</option>
              ))}
            </Select>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
