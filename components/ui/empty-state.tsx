import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional CTA (e.g. a Button) rendered below the description. New in Phase 2 — optional, existing callers unaffected. */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <h2 className="text-title-sm text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-body text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
