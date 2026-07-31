'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateLeadStatusAction } from '../actions';
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadStatus } from '@/lib/leads/constants';

export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
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
