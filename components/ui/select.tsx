import { type SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-body-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              // h-11 matches Input/Button md so mixed form rows share a baseline.
              'h-11 w-full appearance-none rounded-md border border-border bg-surface ps-3.5 pe-9 text-body-lg text-ink',
              'shadow-subtle transition-all duration-fast ease-out',
              'hover:border-border-strong',
              'focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/12',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border',
              error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/12',
              className
            )}
            aria-invalid={!!error}
            {...props}
          >
            {children}
          </select>
          {/* Chevron sits on the "end" side so it mirrors correctly in RTL */}
          <ChevronDown
            size={16}
            className="pointer-events-none absolute inset-y-0 end-3 my-auto text-ink-faint"
          />
        </div>
        {error && <p className="text-body-sm text-danger" role="alert">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
