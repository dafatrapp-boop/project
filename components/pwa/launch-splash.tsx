'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Native apps show a splash for a fixed, short beat before the real UI
// takes over — never an indefinite spinner. 320ms is long enough to
// read as an intentional brand moment, short enough that it never
// reads as a delay in itself; the fade-out overlaps with whatever the
// route underneath is already streaming (its own Suspense skeletons),
// so there is never a gap between "splash gone" and "content visible".
const HOLD_MS = 320;
const FADE_MS = 200;

/**
 * Mounted once in the root layout (app/layout.tsx). Renders instantly
 * on every hard navigation/reload — no data dependency, no network
 * call — which is exactly what makes it able to replace the blank
 * white/black flash that used to be the first thing a cold launch
 * painted. Client-side <Link> navigations never remount the root
 * layout, so this never re-triggers on ordinary in-app navigation.
 */
export function LaunchSplash() {
  const [stage, setStage] = useState<'hold' | 'fade' | 'done'>('hold');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('done');
      return;
    }
    const fadeTimer = setTimeout(() => setStage('fade'), HOLD_MS);
    const doneTimer = setTimeout(() => setStage('done'), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (stage === 'done') return null;

  return (
    <div
      aria-hidden
      className={cn(
        'fixed inset-0 z-[999] flex items-center justify-center bg-brand-500 transition-opacity ease-out',
        stage === 'fade' ? 'pointer-events-none opacity-0 duration-200' : 'opacity-100 duration-0'
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white animate-scale-in">
          <MessageCircle size={32} strokeWidth={2.2} />
        </span>
        <p className="text-body-sm font-semibold tracking-wide text-white/90 animate-rise-in">SocialSales OS</p>
      </div>
    </div>
  );
}
