'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateCampaignStatusAction } from '../actions';
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_TONE, type CampaignStatus } from '@/lib/campaigns/constants';

// Phase 4.3 — consistent status-tinted control treatment across every
// inline status select in the product (Orders, Appointments, Leads,
// Campaigns).
const TONE_CLASS: Record<string, string> = {
  neutral: '',
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  success: 'border-success/25 bg-success-50 text-success',
  warning: 'border-warning/25 bg-warning-50 text-warning',
  danger: 'border-danger/25 bg-danger-50 text-danger',
};

export function CampaignStatusSelect({
  campaignId,
  status,
}: {
  campaignId: string;
  status: CampaignStatus;
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
      className={TONE_CLASS[CAMPAIGN_STATUS_TONE[status]]}
      onChange={(e) => {
        const next = e.target.value as CampaignStatus;
        startTransition(async () => {
          await updateCampaignStatusAction(campaignId, next);
          show('تم تحديث حالة الحملة', 'success');
        });
      }}
    >
      {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
