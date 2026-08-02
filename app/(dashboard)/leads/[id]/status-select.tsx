'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateLeadStatusAction } from '../actions';
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, LEAD_STATUS_TONE, type LeadStatus } from '@/lib/leads/constants';

const TONE_CLASS: Record<string, string> = {
  neutral: '',
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  success: 'border-success/25 bg-success-50 text-success',
  warning: 'border-warning/25 bg-warning-50 text-warning',
  danger: 'border-danger/25 bg-danger-50 text-danger',
};

export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
      className={TONE_CLASS[LEAD_STATUS_TONE[status]]}
      onChange={(e) => {
        const next = e.target.value as LeadStatus;
        startTransition(async () => {
          await updateLeadStatusAction(leadId, next);
          show('تم تحديث حالة العميل المحتمل', 'success');
        });
      }}
    >
      {LEAD_STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {LEAD_STATUS_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}
