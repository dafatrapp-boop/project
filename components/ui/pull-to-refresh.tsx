'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic, HAPTIC_LIGHT, HAPTIC_MEDIUM } from '@/lib/haptics';

const THRESHOLD = 64;
const MAX_PULL = 96;
const INDICATOR_SIZE = 40;

/**
 * Native touch events rather than a gesture library's generic `drag`
 * prop — the one thing that actually matters here is gating the pull
 * gesture to "only when the page is already scrolled to the very top,"
 * so a user scrolling up through a long list never accidentally
 * triggers it. That check has to happen at touchstart, before any
 * gesture recognizer would otherwise commit to a direction.
 *
 * The pull distance itself is a Framer Motion `useMotionValue`, not
 * React state. A `useState` here was the actual cause of the reported
 * "heavy/laggy" feel: touchmove fires dozens of times a second, and
 * each `setState` call both re-rendered every page under this
 * component AND (since that state was in this effect's dependency
 * array) tore down and re-attached the document-level touch listeners
 * on every single frame of the gesture. A motion value updates the
 * DOM directly, bypassing React's render cycle entirely, so dragging
 * costs nothing per frame beyond the actual visual update.
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
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pull = useMotionValue(0);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const crossedThreshold = useRef(false);

  const rotate = useTransform(pull, [0, THRESHOLD], [0, 180]);
  const indicatorOpacity = useTransform(pull, [0, 24], [0, 1]);
  const contentY = useTransform(pull, (v) => Math.min(v, MAX_PULL) * 0.4);
  // The indicator slides into view via translateY instead of animating
  // `height` — `height` is a layout property, so animating it forces a
  // reflow on every single frame of the drag (the actual cause of the
  // reported "heavy" feel, alongside the state-per-touchmove issue
  // fixed above). translateY is compositor-only, costing nothing extra
  // per frame regardless of how much content sits below it.
  const indicatorY = useTransform(pull, (v) => Math.min(v, MAX_PULL) - INDICATOR_SIZE);

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
      crossedThreshold.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) return;

      const scrollTop = document.scrollingElement?.scrollTop ?? 0;
      if (scrollTop > 0) {
        startY.current = null;
        pull.set(0);
        return;
      }

      pulling.current = true;
      // Resistance curve — the further you pull, the less it moves,
      // so it never feels like it could scroll away indefinitely.
      const resisted = Math.min(MAX_PULL, delta * 0.45);
      pull.set(resisted); // direct motion-value write — no React re-render per frame

      if (resisted >= THRESHOLD && !crossedThreshold.current) {
        crossedThreshold.current = true;
        haptic(HAPTIC_LIGHT); // a light tick right as it crosses the trigger point
      } else if (resisted < THRESHOLD) {
        crossedThreshold.current = false;
      }

      if (e.cancelable) e.preventDefault();
    }

    function onTouchEnd() {
      if (!pulling.current) {
        startY.current = null;
        return;
      }
      pulling.current = false;
      startY.current = null;

      if (pull.get() >= THRESHOLD) {
        setRefreshing(true);
        haptic(HAPTIC_MEDIUM);
        animate(pull, THRESHOLD * 0.6, { type: 'spring', damping: 30, stiffness: 300 });
        // Wrapped in startTransition — router.refresh() called bare
        // was the cause of the reported flickering: Next.js treats
        // <Link> navigation as a transition automatically (so existing
        // content stays on screen while the new RSC payload streams
        // in), but a direct router.refresh() call is not, which made
        // every Suspense boundary in the shell (Header, Sidebar) drop
        // back to its fallback and pop back in. Wrapping it here keeps
        // the current UI visible until the refreshed data is ready.
        startTransition(() => {
          router.refresh();
        });
      } else {
        animate(pull, 0, { type: 'spring', damping: 30, stiffness: 300 });
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
    // `pull` is a stable motion-value ref (its identity never changes),
    // so it's safe to omit without triggering re-subscription churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing, router]);

  // Settle back to rest once the transition (the actual refreshed
  // render) has really landed — not a guessed timeout.
  useEffect(() => {
    if (refreshing && !isPending) {
      setRefreshing(false);
      animate(pull, 0, { type: 'spring', damping: 30, stiffness: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing, isPending]);

  return (
    // No overflow-hidden on this outer wrapper deliberately — it wraps
    // every dashboard page's real content, and clipping here would cut
    // off any dropdown/popover (search results, notification bell,
    // menus) that visually extends past this box. Only the small
    // indicator slot below needs its own clipping, scoped to itself.
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 overflow-hidden md:hidden">
        {/* Slides into view purely via transform — never participates
            in layout, never pushes or resizes anything else. Only ever
            visible on touch devices (the listeners above only fire
            from touch events). */}
        <motion.div aria-hidden style={{ y: indicatorY, opacity: indicatorOpacity }} className="flex h-10 items-center justify-center">
          <motion.span style={{ rotate: refreshing ? undefined : rotate }}>
            <RotateCw size={18} className={cn('text-brand-600', refreshing && 'animate-spin')} />
          </motion.span>
        </motion.div>
      </div>
      <motion.div style={{ y: refreshing ? 4 : contentY }}>{children}</motion.div>
    </div>
  );
}
