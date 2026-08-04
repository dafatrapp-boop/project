'use client';

import { useState, useTransition } from 'react';
import { Wallet } from 'lucide-react';
import { updateLeadValueAction } from '../actions';

export function ValueEditor({ leadId, initialValue }: { leadId: string; initialValue: number | null }) {
  const [value, setValue] = useState(initialValue !== null ? String(initialValue) : '');
  const [pending, startTransition] = useTransition();

  function commit() {
    const parsed = value.trim() === '' ? null : Number(value);
    startTransition(() => updateLeadValueAction(leadId, parsed));
  }

  return (
    <label className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-body-sm text-ink">
      <Wallet size={14} className="text-ink-faint" />
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        placeholder="قيمة الصفقة"
        className="w-28 bg-transparent outline-none placeholder:text-ink-faint"
        aria-label="قيمة الصفقة المتوقعة"
      />
    </label>
  );
}
