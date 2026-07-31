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
          <label htmlFor={selectId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-10 w-full appearance-none rounded-md border border-border bg-surface ps-3 pe-9 text-sm text-ink',
              'focus-visible:border-brand-500',
              error && 'border-danger',
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
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
