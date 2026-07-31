import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
}

/**
 * Desktop/tablet: a normal <table>. Mobile: each row becomes a stacked
 * card with "label: value" pairs instead of a horizontally-scrolling
 * table, per the spec's "never allow horizontal overflow" rule.
 */
export function Table<T>({ columns, rows, keyField, emptyMessage }: TableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface py-10 text-center text-sm text-ink-muted">
        {emptyMessage ?? 'لا توجد بيانات لعرضها.'}
      </p>
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-surface sm:block">
        <table className="w-full text-start text-sm">
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
              <tr key={keyField(row)} className="border-b border-border last:border-0">
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
          <div key={keyField(row)} className="rounded-lg border border-border bg-surface p-4">
            {columns.map((col) => (
              <div key={col.header} className="flex justify-between gap-4 py-1 text-sm">
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
