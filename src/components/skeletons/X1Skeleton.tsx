import { Skeleton } from '@/components/ui/skeleton';

export const X1Skeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="p-6 rounded-xl border bg-card">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Broker Cards */}
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl border bg-card">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
