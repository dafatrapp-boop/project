import { Skeleton } from '@/components/ui/skeleton';

function SettingsCardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="max-w-2xl rounded-lg border border-border p-4">
      <Skeleton className="mb-4 h-4 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="mb-2 h-8 w-full last:mb-0" />
      ))}
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64 max-w-2xl rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>
      <SettingsCardSkeleton lines={1} />
      <SettingsCardSkeleton lines={3} />
      <SettingsCardSkeleton lines={1} />
      <SettingsCardSkeleton lines={4} />
    </div>
  );
}
