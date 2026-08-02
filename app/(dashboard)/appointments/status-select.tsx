'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateAppointmentStatusAction } from './actions';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_ORDER,
  APPOINTMENT_STATUS_TONE,
  type AppointmentStatus,
} from '@/lib/appointments/constants';

// Phase 4.3 — same status-tinted control treatment as OrderStatusSelect,
// so status reads at a glance without opening the dropdown.
const TONE_CLASS: Record<string, string> = {
  neutral: '',
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  success: 'border-success/25 bg-success-50 text-success',
  warning: 'border-warning/25 bg-warning-50 text-warning',
  danger: 'border-danger/25 bg-danger-50 text-danger',
};

export function AppointmentStatusSelect({ id, status }: { id: string; status: AppointmentStatus }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
      className={TONE_CLASS[APPOINTMENT_STATUS_TONE[status]]}
      onChange={(e) => {
        const next = e.target.value as AppointmentStatus;
        startTransition(async () => {
          await updateAppointmentStatusAction(id, next);
          show('تم تحديث حالة الموعد', 'success');
        });
      }}
    >
      {APPOINTMENT_STATUS_ORDER.map((s) => (
        <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
      ))}
    </Select>
  );
}
