'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateCampaignStatusAction } from '../actions';
import { CAMPAIGN_STATUS_LABELS, type CampaignStatus } from '@/lib/campaigns/constants';

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
