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
        // The datetime-local input carries no timezone info at all — a
        // bare "2026-08-05T14:30" string. Converting it to a Date HERE,
        // in the browser, correctly resolves "local" to the visitor's
        // own timezone before it ever reaches the server. Letting the
        // server do that same conversion (as this used to) resolves
        // "local" to the SERVER's timezone (UTC on Vercel) instead,
        // silently shifting the stored due time by whatever offset
        // separates the visitor from UTC — the real reason scheduled
        // follow-ups could fire at the wrong wall-clock time.
        const rawDueAt = String(formData.get('dueAt') ?? '');
        if (rawDueAt) {
          const dueAtDate = new Date(rawDueAt);
          if (!Number.isNaN(dueAtDate.getTime())) {
            formData.set('dueAtIso', dueAtDate.toISOString());
          }
        }
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
