'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { addNoteAction } from '../actions';

const NOTE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'general', label: 'ملاحظة عامة' },
  { value: 'call', label: 'مكالمة هاتفية' },
  { value: 'meeting', label: 'اجتماع' },
  { value: 'email', label: 'بريد إلكتروني' },
  { value: 'whatsapp', label: 'واتساب' },
];

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
      <div className="flex items-center justify-between gap-2">
        <div className="w-40">
          <Select name="noteType" defaultValue="general">
            {NOTE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" size="sm">
          إضافة ملاحظة
        </Button>
      </div>
    </form>
  );
}
