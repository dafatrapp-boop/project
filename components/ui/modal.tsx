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
        'w-full max-w-md rounded-lg border border-border bg-surface p-0 shadow-card backdrop:bg-ink/40',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="rounded-md p-1 text-ink-faint hover:bg-surface-subtle hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
