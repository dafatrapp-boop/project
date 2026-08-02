import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-md" />
        <Skeleton className="h-11 w-48 rounded-md" />
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <Skeleton className="mb-3 h-5 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between border-t border-border py-3 first:border-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
