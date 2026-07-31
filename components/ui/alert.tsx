import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'error' | 'success' | 'info';

const styles: Record<Variant, { wrap: string; icon: string }> = {
  error: {
    wrap: 'border-danger/30 bg-danger/5 text-danger',
    icon: 'text-danger',
  },
  success: {
    wrap: 'border-success/30 bg-success/5 text-success',
    icon: 'text-success',
  },
  info: {
    wrap: 'border-brand-500/30 bg-brand-50 text-brand-700',
    icon: 'text-brand-600',
  },
};

const icons: Record<Variant, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

/**
 * Standard state banner used for form-level errors, success confirmations,
 * and informational notices. Always announced to assistive tech via
 * role="alert" (error) or role="status" (success/info) so screen reader
 * users get the same feedback as sighted users without extra clicks.
 */
export function Alert({
  variant = 'info',
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm leading-5',
        styles[variant].wrap,
        className
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', styles[variant].icon)} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
