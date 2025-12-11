import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="relative overflow-hidden rounded-b-[40px] h-[240px] bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Skeleton className="h-10 w-64 bg-white/10" />
          <Skeleton className="h-6 w-48 bg-white/10" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border bg-card">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="p-6 rounded-xl border bg-card">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="p-6 rounded-xl border bg-card">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
