'use client';

import { useRef } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFollowUpAction, completeFollowUpAction } from '../actions';

export function FollowUpForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createFollowUpAction(leadId, formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Input name="dueAt" type="datetime-local" label="موعد المتابعة" required />
      </div>
      <div className="flex-1">
        <Input name="note" label="ملاحظة (اختياري)" placeholder="مثال: الاتصال لتأكيد الموعد" />
      </div>
      <Button type="submit">جدولة متابعة</Button>
    </form>
  );
}

export function CompleteFollowUpButton({ followUpId, leadId }: { followUpId: string; leadId: string }) {
  return (
    <form action={() => completeFollowUpAction(followUpId, leadId)}>
      <Button type="submit" size="sm" variant="secondary">
        <Check size={14} />
        تم الإنجاز
      </Button>
    </form>
  );
}
