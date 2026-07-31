'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where a monitoring integration (Sentry, etc.)
    // would report the error — none is wired up here (no service is
    // configured), so this is just a console log for now.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface py-16 text-center">
      <h2 className="text-base font-semibold text-ink">حدث خطأ غير متوقع</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        نعتذر عن الإزعاج. حاول تحديث الصفحة، وإذا استمرت المشكلة تواصل مع الدعم.
      </p>
      <Button onClick={reset} variant="secondary">
        إعادة المحاولة
      </Button>
    </div>
  );
}
