'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic, HAPTIC_LIGHT } from '@/lib/haptics';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * A bottom sheet on mobile (slides up, rounded top corners, drag-down
 * to dismiss — the pattern iOS/Android users actually expect from a
 * "add/create" surface on a phone), a centered dialog on desktop
 * (spring scale-in, matching the previous behavior). One component,
 * reused everywhere a Modal was already used (lead creation, reminder
 * creation, etc.) — improving it once upgrades every such surface in
 * the app at once.
 *
 * Rebuilt from a native <dialog> to a plain animated overlay because
 * <dialog>'s imperative show/close lifecycle can't drive a real exit
 * animation or a drag gesture — both need React to control mount
 * timing via AnimatePresence. Accessibility (focus trap, Escape-to-
 * close, focus restore) is reimplemented manually below instead of
 * getting it for free from <dialog>.
 *
 * Rendered through a portal into document.body rather than inline
 * where it's called. This isn't cosmetic: every dashboard page's
 * content is wrapped in PullToRefresh's `motion.div` (a bound `y`
 * motion value), and per the CSS spec any element with an active
 * `transform` becomes the containing block for descendant `position:
 * fixed` elements — this modal's overlay uses `fixed inset-0`. Left
 * inline, the modal would be confined to that transformed ancestor
 * instead of the real viewport, which on a scrolled-down page means it
 * could render offset or only partially covering the screen. A portal
 * sidesteps this — and any future ancestor styling — entirely by
 * mounting the modal directly under <body>, which is the standard,
 * correct place for any overlay to live regardless of this specific
 * interaction.
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  // document.body doesn't exist during SSR, and no caller ever opens a
  // modal on first paint (`open` always starts false), so gating the
  // portal on mount costs nothing in practice.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // `onClose` is passed as a fresh inline arrow function by every
  // caller (`onClose={() => setOpen(false)}`), so its reference
  // changes on every render of the parent — including a render caused
  // by typing into a controlled input inside this modal. Reading it
  // through a ref (always current, updated below) instead of a
  // dependency keeps the effect from re-running on every keystroke —
  // it previously depended on [open, onClose] and called
  // panelRef.current?.focus() on each run, which stole focus back
  // from whatever input the user was actively typing into.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      // Minimal focus trap — Tab/Shift+Tab cycle within the panel only.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    // Focus the panel itself first — individual forms can refine this
    // (e.g. autofocus the first input) without fighting this effect.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus?.();
    };
    // Deliberately only [open] — see onCloseRef above. Re-running this
    // effect on anything other than an actual open/close transition is
    // what caused the focus-steal bug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      haptic(HAPTIC_LIGHT);
      onClose();
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            drag={prefersReducedMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%', opacity: 1 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%', opacity: 1 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className={cn(
              'relative flex max-h-[85vh] w-full flex-col overflow-hidden',
              'rounded-t-2xl border border-border bg-surface-overlay shadow-elevated',
              'pb-[env(safe-area-inset-bottom)]',
              'sm:max-w-md sm:rounded-xl',
              className
            )}
          >
            {/* Drag handle — mobile-only affordance hinting this sheet can be swiped down. */}
            <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
              <span className="h-1 w-9 rounded-full bg-border-strong" aria-hidden />
            </div>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-title-sm text-ink">{title}</h2>
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
