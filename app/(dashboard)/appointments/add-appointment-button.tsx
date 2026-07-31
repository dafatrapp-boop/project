'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { createAppointmentAction } from './actions';

export function AddAppointmentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        موعد جديد
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="إضافة موعد يدويًا">
        <form action={createAppointmentAction} className="flex flex-col gap-4">
          <Input name="customerName" label="اسم العميل" required />
          <Input name="phone" label="رقم الهاتف" placeholder="+9665xxxxxxxx" />
          <Input name="email" type="email" label="البريد الإلكتروني (اختياري)" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="date" type="date" label="التاريخ" required />
            <Input name="time" type="time" label="الوقت" required />
          </div>
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
