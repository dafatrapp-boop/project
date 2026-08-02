'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Same field contract as <Input type="password" /> (same name/value/
 * onChange), just with a visibility toggle. Purely presentational —
 * does not alter what gets submitted.
 *
 * Phase 4.4 audit fix: this had drifted from Input's Phase 2 styling
 * (rounded-lg vs rounded-md, arbitrary text-[15px] vs the type scale,
 * duration-150 vs the duration tokens, a different hover border color)
 * since it wasn't touched during the Phase 2 primitive pass. Now shares
 * Input's exact visual language, just with the added toggle button.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-body-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(
              'h-11 w-full rounded-md border border-border bg-surface px-3.5 pe-11 text-body-lg text-ink',
              'shadow-subtle transition-all duration-fast ease-out',
              'placeholder:text-ink-faint',
              'hover:border-border-strong',
              'focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/12',
              error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/12',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-ink-faint transition-colors hover:text-ink"
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-caption text-ink-faint">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
