import { type InputHTMLAttributes, forwardRef, useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

/**
 * Base text input for the design system.
 * - h-11 (44px) meets the minimum touch-target size on mobile.
 * - Optional leading `icon` for scannability (e.g. mail icon on email
 *   fields) — purely decorative, so it's marked aria-hidden and never
 *   carries meaning on its own.
 * - `hint` renders persistent helper text (e.g. format examples) and is
 *   wired to aria-describedby; `error` replaces it visually and is
 *   announced via role="alert" without needing focus to move.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? props.name ?? autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute inset-y-0 start-3 my-auto flex h-4 w-4 items-center justify-center text-ink-faint"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink',
              icon && 'ps-9',
              'placeholder:text-ink-faint',
              'transition-colors focus-visible:border-brand-500',
              'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-faint',
              error && 'border-danger',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={cn(hintId, errorId) || undefined}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-faint">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
