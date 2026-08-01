import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * New in Phase 2 — no page currently imports this, added so future
 * multi-line fields (notes, descriptions) don't fall back to a raw
 * <textarea>. Mirrors Input's visual language exactly.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const fieldId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-body-sm font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={cn(
            'w-full resize-y rounded-md border border-border bg-surface px-3.5 py-2.5 text-body-lg text-ink',
            'shadow-subtle transition-all duration-fast ease-out',
            'placeholder:text-ink-faint',
            'hover:border-border-strong',
            'focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/12',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border',
            error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/12',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        {error ? (
          <p id={`${fieldId}-error`} className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={`${fieldId}-hint`} className="text-caption text-ink-faint">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
