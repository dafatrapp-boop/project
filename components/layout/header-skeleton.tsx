import { Skeleton } from '@/components/ui/skeleton';

/** Matches Header's real h-14 sticky bar exactly — no layout shift on swap-in. */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur-sm md:px-8">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </header>
  );
}
