import { Skeleton } from '@/components/ui/skeleton';

export const CorretoresSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Broker Cards */}
      <div className="grid gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card">
            <div className="flex items-center justify-between">
              {/* Avatar and Info */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded" />
                <Skeleton className="h-9 w-9 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
