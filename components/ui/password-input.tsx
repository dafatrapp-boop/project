'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Password field with a show/hide toggle. Ships with:
 * - a leading lock icon (visual affordance, not decorative-only — it
 *   reinforces the field's purpose for users scanning quickly)
 * - a toggle button that is keyboard-reachable and announces its
 *   current action via aria-label + aria-pressed
 * - optional hint text (e.g. "8 أحرف على الأقل") rendered below,
 *   linked with aria-describedby so screen readers read it with the field
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
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
          <Lock
            className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-ink-faint"
            aria-hidden="true"
          />
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(
              'h-11 w-full rounded-md border border-border bg-surface ps-9 pe-11 text-sm text-ink',
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
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            aria-pressed={visible}
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-ink-faint transition-colors hover:text-ink-muted focus-visible:text-ink-muted"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
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
PasswordInput.displayName = 'PasswordInput';
