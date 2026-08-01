'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

/**
 * Phase 2 — new primitive. Built to fix a concrete Phase 1 finding:
 * list-page toolbars (Leads: Pipeline/Import/Export CSV/Export
 * Excel/Add) render up to 5 same-weight buttons in a row. Phase 3/4
 * will move secondary actions into one of these, keeping only the
 * single primary action as a full Button. Full keyboard support
 * (Arrow/Home/End/Escape) since this replaces the Kanban board's
 * mouse-only drag pattern in spirit — nothing here should be
 * pointer-only.
 */
export function DropdownMenu({
  trigger,
  items,
  align = 'end',
}: {
  trigger: ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    }
    if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(items.length - 1);
    }
  }

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setActiveIndex(0);
        }}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          onKeyDown={onKeyDown}
          className={cn(
            'animate-scale-in absolute z-50 mt-2 min-w-[200px] origin-top rounded-lg border border-border bg-surface-overlay p-1.5 shadow-overlay',
            align === 'end' ? 'end-0' : 'start-0'
          )}
        >
          {items.map((item, i) => {
            const content = (
              <>
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </>
            );
            const sharedClass = cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-start text-body-sm font-medium transition-colors',
              'focus-visible:outline-none',
              item.tone === 'danger' ? 'text-danger hover:bg-danger-50' : 'text-ink hover:bg-surface-subtle',
              item.disabled && 'pointer-events-none opacity-40'
            );
            return item.href ? (
              <a
                key={item.label}
                ref={(el) => (itemRefs.current[i] = el)}
                role="menuitem"
                href={item.href}
                tabIndex={-1}
                className={sharedClass}
                onClick={() => setOpen(false)}
              >
                {content}
              </a>
            ) : (
              <button
                key={item.label}
                ref={(el) => (itemRefs.current[i] = el)}
                role="menuitem"
                type="button"
                tabIndex={-1}
                disabled={item.disabled}
                className={sharedClass}
                onClick={() => {
                  item.onSelect?.();
                  setOpen(false);
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
