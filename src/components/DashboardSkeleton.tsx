import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Charts + Ranking Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </div>
          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-5">
          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};
