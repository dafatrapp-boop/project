'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic, HAPTIC_MEDIUM } from '@/lib/haptics';

const THRESHOLD = 64;
const MAX_PULL = 96;

/**
 * Native touch events rather than a gesture library's generic `drag`
 * prop — the one thing that actually matters here is gating the pull
 * gesture to "only when the page is already scrolled to the very top,"
 * so a user scrolling up through a long list never accidentally
 * triggers it. That check has to happen at touchstart, before any
 * gesture recognizer would otherwise commit to a direction.
 *
 * PWA-specific motivation: standalone display mode has no browser
 * chrome to provide the OS's native pull-to-refresh, and this app sets
 * no `overscroll-behavior` override, so without this the whole feature
 * is simply absent in an installed PWA — exactly the "feels like a
 * website, not an app" gap the audit called out.
 */
export function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (refreshing) return;
      const scrollTop = document.scrollingElement?.scrollTop ?? 0;
      if (scrollTop > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) return;

      const scrollTop = document.scrollingElement?.scrollTop ?? 0;
      if (scrollTop > 0) {
        startY.current = null;
        setPull(0);
        return;
      }

      pulling.current = true;
      // Resistance curve — the further you pull, the less it moves,
      // so it never feels like it could scroll away indefinitely.
      const resisted = Math.min(MAX_PULL, delta * 0.45);
      setPull(resisted);
      if (e.cancelable) e.preventDefault();
    }

    function onTouchEnd() {
      if (!pulling.current) {
        startY.current = null;
        return;
      }
      pulling.current = false;
      startY.current = null;

      if (pull >= THRESHOLD) {
        setRefreshing(true);
        haptic(HAPTIC_MEDIUM);
        router.refresh();
        // router.refresh() has no completion promise to await — a
        // short fixed hold reads better than snapping back instantly
        // before the user could register anything happened.
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 700);
      } else {
        setPull(0);
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pull, refreshing]);

  const active = refreshing || pull > 0;

  return (
    <div>
      {/* Indicator only ever has non-zero height on touch devices (the
          listeners above only ever fire from a touchmove/touchend), but
          the wrapper itself is hidden md:up too since desktop has no
          touch gesture to react to in the first place. */}
      <motion.div
        aria-hidden
        animate={{ height: active ? Math.max(pull, refreshing ? 40 : 0) : 0, opacity: active ? 1 : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 300 }}
        className="flex items-center justify-center overflow-hidden md:hidden"
      >
        <RotateCw
          size={18}
          className={cn(
            'text-brand-600',
            refreshing && 'animate-spin',
            !refreshing && !prefersReducedMotion && 'transition-transform'
          )}
          style={!refreshing ? { transform: `rotate(${Math.min(180, (pull / THRESHOLD) * 180)}deg)` } : undefined}
        />
      </motion.div>
      <motion.div
        animate={{ y: refreshing ? 4 : 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
