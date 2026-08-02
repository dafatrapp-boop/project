'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
      <Textarea
        name="body"
        required
        placeholder="أضف ملاحظة عن هذا العميل المحتمل..."
        rows={3}
      />
      <Button type="submit" size="sm" className="self-end">
        إضافة ملاحظة
      </Button>
    </form>
  );
}
