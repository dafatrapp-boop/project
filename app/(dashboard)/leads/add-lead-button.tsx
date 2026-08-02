'use client';

import { useState, useTransition } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { createLeadAction, checkDuplicateLeadAction } from './actions';

export function AddLeadButton() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [duplicate, setDuplicate] = useState<{ id: string; full_name: string } | null>(null);
  const [, startTransition] = useTransition();

  function checkDuplicate(nextPhone: string, nextEmail: string) {
    if (!nextPhone && !nextEmail) {
      setDuplicate(null);
      return;
    }
    startTransition(async () => {
      const found = await checkDuplicateLeadAction(nextPhone, nextEmail);
      setDuplicate(found);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        إضافة عميل محتمل
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="إضافة عميل محتمل جديد">
        {duplicate && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning-50 px-3 py-2 text-body-sm text-warning">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              يوجد عميل محتمل بنفس الهاتف أو البريد باسم &quot;{duplicate.full_name}&quot;.{' '}
              <Link href={`/leads/${duplicate.id}`} className="underline" onClick={() => setOpen(false)}>
                عرضه
              </Link>{' '}
              — يمكنك المتابعة إذا كان هذا فعلًا عميلًا جديدًا.
            </span>
          </div>
        )}

        <form action={createLeadAction} className="flex flex-col gap-4">
          <Input name="fullName" label="الاسم الكامل" placeholder="مثال: سارة أحمد" required />
          <Input
            name="phone"
            label="رقم الهاتف"
            placeholder="+9665xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => checkDuplicate(phone, email)}
          />
          <Input
            name="email"
            type="email"
            label="البريد الإلكتروني (اختياري)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => checkDuplicate(phone, email)}
          />
          <Input name="source" label="المصدر" placeholder="مثال: instagram, whatsapp" />
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
