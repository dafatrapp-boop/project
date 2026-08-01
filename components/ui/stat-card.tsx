import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Positive = up-good (green), negative = down (red), omit for neutral metrics. */
  trend?: number;
  className?: string;
}

/**
 * Phase 2 — new primitive replacing the ad hoc `<Stat>` helper defined
 * inline on the Analytics/Dashboard pages. Not wired in yet (Phase
 * 3/4); this is the shared building block those passes will consume
 * so dashboard, analytics, and team-usage KPIs render identically.
 */
export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-4 shadow-subtle', className)}>
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-ink-muted">{label}</span>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-title-lg text-ink">{value}</span>
        {typeof trend === 'number' && trend !== 0 && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-caption font-semibold',
              trend > 0 ? 'text-success' : 'text-danger'
            )}
          >
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
