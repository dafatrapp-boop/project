'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { addNoteAction } from '../actions';

export function NoteForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addNoteAction(leadId, formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        name="body"
        required
        placeholder="أضف ملاحظة عن هذا العميل المحتمل..."
        rows={3}
        className="w-full rounded-md border border-border bg-surface p-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500"
      />
      <Button type="submit" size="sm" className="self-end">
        إضافة ملاحظة
      </Button>
    </form>
  );
}
