import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './empty-state';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  emptyMessage?: string;
  /** Phase 4 additions — optional, every existing caller keeps working unchanged. */
  emptyTitle?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
}

/**
 * Desktop/tablet: a normal <table>. Mobile: each row becomes a stacked
 * card with "label: value" pairs instead of a horizontally-scrolling
 * table, per the spec's "never allow horizontal overflow" rule.
 *
 * Phase 4: empty state now uses the shared EmptyState primitive
 * (was a plain muted paragraph); rows get a hover affordance so the
 * table reads as interactive, not static data.
 */
export function Table<T>({
  columns,
  rows,
  keyField,
  emptyMessage,
  emptyTitle,
  emptyIcon,
  emptyAction,
}: TableProps<T>) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon ?? Inbox}
        title={emptyTitle ?? 'لا توجد بيانات'}
        description={emptyMessage ?? 'لا توجد بيانات لعرضها.'}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-surface shadow-subtle sm:block">
        <table className="w-full text-start text-body-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              {columns.map((col) => (
                <th key={col.header} className="px-4 py-3 text-start font-medium text-ink-muted">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyField(row)}
                className="border-b border-border transition-colors last:border-0 hover:bg-surface-subtle"
              >
                {columns.map((col) => (
                  <td key={col.header} className={cn('px-4 py-3 text-ink', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={keyField(row)} className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
            {columns.map((col) => (
              <div key={col.header} className="flex justify-between gap-4 py-1 text-body-sm">
                <span className="text-ink-muted">{col.header}</span>
                <span className="text-ink">{col.cell(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
