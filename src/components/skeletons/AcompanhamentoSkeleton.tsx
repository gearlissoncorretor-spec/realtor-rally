import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const AcompanhamentoSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>

      {/* Search bar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map(col => (
          <div key={col} className="min-w-[280px] space-y-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-1.5 w-full mt-3 rounded-full" />
            </Card>
            {[1, 2, 3].map(card => (
              <Card key={card} className="p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-36" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-28 mt-2" />
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcompanhamentoSkeleton;
