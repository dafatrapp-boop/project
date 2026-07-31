'use client';

import { useTransition } from 'react';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { setPlanForTestingAction } from './actions';
import { PLAN_LABELS, type Plan } from '@/lib/plans/constants';

export function PlanTestingSelector({ currentPlan }: { currentPlan: Plan }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <div className="w-48">
      <Select
        value={currentPlan}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Plan;
          startTransition(async () => {
            await setPlanForTestingAction(next);
            show('تم تغيير الباقة (وضع الاختبار)', 'success');
          });
        }}
      >
        {Object.entries(PLAN_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </div>
  );
}
