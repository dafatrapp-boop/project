'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateAppointmentStatusAction } from './actions';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_ORDER,
  type AppointmentStatus,
} from '@/lib/appointments/constants';

export function AppointmentStatusSelect({ id, status }: { id: string; status: AppointmentStatus }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
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
