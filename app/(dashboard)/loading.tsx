export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-48 animate-pulse rounded bg-surface-subtle" />
        <div className="h-4 w-72 animate-pulse rounded bg-surface-subtle" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface-subtle" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-border bg-surface-subtle" />
    </div>
  );
}
