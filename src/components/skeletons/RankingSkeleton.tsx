import { Skeleton } from '@/components/ui/skeleton';

export const RankingSkeleton = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Period Filter */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Podium */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex justify-center items-end gap-4 h-64">
          {/* 2nd place */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full mb-2" />
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-32 w-24 mt-2 rounded-t-lg" />
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-20 w-20 rounded-full mb-2" />
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-44 w-28 mt-2 rounded-t-lg" />
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-14 w-14 rounded-full mb-2" />
            <Skeleton className="h-4 w-18 mb-1" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-24 w-22 mt-2 rounded-t-lg" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 pb-3 border-b">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-4 border-b last:border-b-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-3 w-12 mt-1" />
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
