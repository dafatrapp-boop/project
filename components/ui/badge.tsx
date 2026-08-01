import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
type Size = 'sm' | 'md';

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-surface-subtle text-ink-muted',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-micro',
  md: 'px-2.5 py-0.5 text-caption',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: Size;
  /** Renders a small leading status dot instead of relying on color alone. */
  dot?: boolean;
}

export function Badge({ className, tone = 'neutral', size = 'md', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        toneStyles[tone],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
