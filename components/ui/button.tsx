import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-glow hover:bg-brand-600 active:bg-brand-700 active:shadow-none',
  secondary:
    'bg-surface-raised text-ink border border-border hover:border-ink/20 hover:bg-surface-subtle active:bg-surface-subtle',
  ghost: 'text-ink-muted hover:bg-surface-subtle hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-90',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-11 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
};

/**
 * Base button for the design system. All interactive buttons in the
 * product should use this component instead of raw <button> tags so
 * that focus states, sizing, and RTL spacing stay consistent.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'relative inline-flex items-center justify-center font-medium tracking-[-0.01em]',
          'transition-all duration-150 ease-out active:scale-[0.98]',
          'disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
