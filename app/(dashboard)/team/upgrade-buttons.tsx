'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

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

export function UpgradeButtons({ hasStripeSubscription }: { hasStripeSubscription: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button disabled={loading} onClick={() => goToCheckout('starter', setLoading, setError)}>
          الترقية إلى الأساسية
        </Button>
        <Button disabled={loading} onClick={() => goToCheckout('growth', setLoading, setError)}>
          الترقية إلى النمو
        </Button>
        <Button disabled={loading} onClick={() => goToCheckout('pro', setLoading, setError)}>
          الترقية إلى الاحترافية
        </Button>
        {hasStripeSubscription && (
          <Button variant="secondary" disabled={loading} onClick={() => goToPortal(setLoading, setError)}>
            إدارة الاشتراك
          </Button>
        )}
      </div>
    </div>
  );
}
