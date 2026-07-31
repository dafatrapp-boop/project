'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

/**
 * Not real-time (no push updates via Supabase Realtime) — this is a
 * one-click re-fetch of the current server data via router.refresh().
 * Documented as such in CHECKLIST.md rather than implied to be live.
 */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [justRefreshed, setJustRefreshed] = useState(false);

  return (
    <button
      onClick={() =>
        startTransition(() => {
          router.refresh();
          setJustRefreshed(true);
          setTimeout(() => setJustRefreshed(false), 1500);
        })
      }
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
      aria-label="تحديث البيانات"
    >
      <RefreshCw size={16} className={pending ? 'animate-spin' : ''} />
      {justRefreshed ? 'تم التحديث' : 'تحديث'}
    </button>
  );
}
