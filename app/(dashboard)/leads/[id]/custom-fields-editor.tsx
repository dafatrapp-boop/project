'use client';

import { useState, useTransition } from 'react';
import { updateLeadCustomFieldsAction } from '../actions';

export interface CustomFieldDef {
  id: string;
  key: string;
  label: string;
  field_type: 'text' | 'number' | 'date' | 'select';
  options: string[];
}

export function CustomFieldsEditor({
  leadId,
  fields,
  initialValues,
}: {
  leadId: string;
  fields: CustomFieldDef[];
  initialValues: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [pending, startTransition] = useTransition();

  function commit(next: Record<string, string>) {
    setValues(next);
    startTransition(() => updateLeadCustomFieldsAction(leadId, next));
  }

  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.id} className="flex flex-col gap-1 text-body-sm">
          <span className="text-ink-muted">{field.label}</span>
          {field.field_type === 'select' ? (
            <select
              value={values[field.key] ?? ''}
              disabled={pending}
              onChange={(e) => commit({ ...values, [field.key]: e.target.value })}
              className="h-9 rounded-md border border-border bg-surface px-2 text-ink"
            >
              <option value="">—</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
              value={values[field.key] ?? ''}
              disabled={pending}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              onBlur={() => commit(values)}
              className="h-9 rounded-md border border-border bg-surface px-2 text-ink"
            />
          )}
        </label>
      ))}
    </div>
  );
}
