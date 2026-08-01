'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Uses <dialog> so we get native focus-trapping, Escape-to-close, and
 * a real modal a11y tree for free instead of reimplementing it.
 *
 * Phase 2: elevated to the same "premium surface" tier as AuthCard
 * (rounded-xl + shadow-elevated) instead of the flatter rounded-lg/
 * shadow-card it used before — dialogs are the highest-attention
 * surface in the product and should read that way.
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className={cn(
        'w-full max-w-md rounded-xl border border-border bg-surface-overlay p-0 shadow-elevated backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]',
        'open:animate-scale-in',
        className
      )}
    >
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
      <div className="px-5 py-5">{children}</div>
    </dialog>
  );
}
