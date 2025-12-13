import { Skeleton } from '@/components/ui/skeleton';

export const EquipesSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Team Cards */}
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded" />
                <Skeleton className="h-9 w-9 rounded" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-8 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
