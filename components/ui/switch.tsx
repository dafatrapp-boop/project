'use client';

import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Phase 4.3 — new primitive. Built specifically to fix the Automations
 * "enable/disable" interaction: a plain checkbox required a separate
 * "Save" click before the toggle actually took effect, which reads as
 * broken (you flip a switch, nothing happens until a second action).
 * A real switch fires its callback immediately, matching every other
 * instant-toggle in the product (VisibilityToggle, PublishToggle).
 */
export function Switch({ checked, onChange, disabled, label, className }: SwitchProps) {
  return (
    <label className={cn('inline-flex items-center gap-2.5', disabled && 'opacity-50', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-fast ease-out',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
          checked ? 'bg-brand-500' : 'bg-neutral-300',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-subtle transition-[inset-inline-start] duration-fast ease-out',
            checked ? 'start-[18px]' : 'start-0.5'
          )}
        />
      </button>
      {label && <span className="text-body-sm font-medium text-ink">{label}</span>}
    </label>
  );
}
