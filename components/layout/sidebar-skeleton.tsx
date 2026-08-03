import { Skeleton } from '@/components/ui/skeleton';

/**
 * Matches Sidebar's real dimensions exactly (w-64, h-14 brand row, same
 * paddings) so there is zero layout shift when the real sidebar swaps
 * in — this renders instantly (no data dependency) while
 * SidebarServer's workspace query is still in flight.
 */
export function SidebarSkeleton() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-border bg-surface md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <Skeleton className="h-7 w-7 rounded-md" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="mt-1.5 h-2.5 w-16" />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-5 px-3 py-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 3 }).map((_, group) => (
          <div key={group} className="flex flex-col gap-1">
            <Skeleton className="mb-1 h-2.5 w-16" />
            {Array.from({ length: 3 }).map((_, item) => (
              <Skeleton key={item} className="h-8 w-full" />
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <Skeleton className="h-8 w-full" />
      </div>
    </aside>
  );
}
