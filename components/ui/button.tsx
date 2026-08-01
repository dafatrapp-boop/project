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

// Every state (hover/active/disabled/loading) is defined per variant so
// none of them can silently regress to browser defaults.
const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-ink-onbrand shadow-glow hover:bg-brand-600 active:bg-brand-700 active:shadow-none disabled:shadow-none',
  secondary:
    'bg-surface-raised text-ink border border-border hover:border-border-strong hover:bg-surface-subtle active:bg-surface-subtle',
  ghost: 'text-ink-muted hover:bg-surface-subtle hover:text-ink active:bg-surface-sunken',
  danger: 'bg-danger text-white hover:opacity-90 active:opacity-100',
};

// Height scale is shared verbatim with Input/Select so a form row never
// misaligns: sm=h-9, md=h-11, lg=h-12.
const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-3 text-body-sm gap-1.5 rounded-sm',
  md: 'h-11 px-4 text-body gap-2 rounded-md',
  lg: 'h-12 px-5 text-body-lg gap-2 rounded-md',
};

/**
 * Base button for the design system. All interactive buttons in the
 * product should use this component instead of raw <button>/<a> tags so
 * that focus states, sizing, and RTL spacing stay consistent.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center font-medium tracking-[-0.01em]',
          'transition-all duration-fast ease-out active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
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

/**
 * Icon-only button — same height scale as Button, square, with an
 * accessible label required (visually hidden via aria-label).
 */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & { 'aria-label': string }
>(({ className, variant = 'ghost', size = 'md', loading = false, disabled, children, ...props }, ref) => {
  const dims: Record<Size, string> = { sm: 'h-9 w-9 rounded-sm', md: 'h-11 w-11 rounded-md', lg: 'h-12 w-12 rounded-md' };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        'transition-all duration-fast ease-out active:scale-[0.96]',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        dims[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : children}
    </button>
  );
});
IconButton.displayName = 'IconButton';
