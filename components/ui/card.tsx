import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'sunken' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const toneStyles: Record<Tone, string> = {
  default: 'bg-surface border border-border shadow-subtle',
  sunken: 'bg-surface-sunken border border-transparent',
  elevated: 'bg-surface-raised border border-border shadow-card',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Phase 2 — new shared primitive replacing the hand-repeated
 * `rounded-lg border border-border bg-surface p-4 shadow-subtle` div
 * pattern found across every dashboard page. Not wired into pages
 * yet (Phase 3/4); this is the building block those passes will use.
 */
export function Card({ className, tone = 'default', padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg', toneStyles[tone], paddingStyles[padding], className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-title-sm text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-body-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
