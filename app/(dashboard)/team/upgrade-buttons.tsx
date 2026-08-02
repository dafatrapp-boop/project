'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLAN_LABELS, PLAN_LIMITS, type Plan } from '@/lib/plans/constants';
import { cn } from '@/lib/utils';

async function goToCheckout(plan: 'starter' | 'growth' | 'pro', setLoading: (v: boolean) => void, setError: (v: string | null) => void) {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setError(data.message ?? 'تعذر بدء عملية الدفع.');
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  } catch {
    setError('تعذر الاتصال بخدمة الدفع.');
    setLoading(false);
  }
}

async function goToPortal(setLoading: (v: boolean) => void, setError: (v: string | null) => void) {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setError(data.error === 'no_subscription' ? 'لا يوجد اشتراك نشط لإدارته.' : 'تعذر فتح صفحة إدارة الاشتراك.');
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  } catch {
    setError('تعذر الاتصال بخدمة الدفع.');
    setLoading(false);
  }
}

const UPGRADE_PLANS: Plan[] = ['starter', 'growth', 'pro'];

function limitText(n: number) {
  return n === -1 ? 'غير محدود' : n.toString();
}

/**
 * Phase 4.4 — "billing clarity": three bare same-weight buttons gave
 * no sense of what upgrading actually changes. Each plan now shows its
 * real limits (from the same PLAN_LIMITS the rest of the product reads
 * from — no invented pricing, since prices live in Stripe, not this
 * codebase) so the choice is informed, not blind.
 */
export function UpgradeButtons({ hasStripeSubscription, currentPlan }: { hasStripeSubscription: boolean; currentPlan: Plan }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-body-sm text-danger" role="alert">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {UPGRADE_PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan];
          const isCurrent = plan === currentPlan;
          return (
            <Card key={plan} tone={isCurrent ? 'elevated' : 'default'} className={cn(isCurrent && 'border-brand-300')}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{PLAN_LABELS[plan]}</p>
                {isCurrent && <Badge tone="brand" size="sm">باقتك الحالية</Badge>}
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-caption text-ink-muted">
                <li className="flex items-center gap-1.5"><Check size={12} className="text-success" /> {limitText(limits.maxLandingPages)} صفحة هبوط</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-success" /> {limitText(limits.maxTeamMembers)} أعضاء فريق</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-success" /> {limitText(limits.maxCampaigns)} حملة</li>
              </ul>
              <Button
                size="sm"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={loading || isCurrent}
                onClick={() => goToCheckout(plan, setLoading, setError)}
                className="mt-3 w-full"
              >
                {isCurrent ? 'باقتك الحالية' : 'الترقية'}
              </Button>
            </Card>
          );
        })}
      </div>
      {hasStripeSubscription && (
        <Button variant="secondary" size="sm" disabled={loading} onClick={() => goToPortal(setLoading, setError)} className="self-start">
          إدارة الاشتراك
        </Button>
      )}
    </div>
  );
}
