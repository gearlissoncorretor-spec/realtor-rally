import { Skeleton } from '@/components/ui/skeleton';

export const TarefasKanbanSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Broker Selector */}
      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="min-w-[280px] w-[280px] bg-muted/30 rounded-xl p-4 flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-6 w-6 rounded" />
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1">
                {Array.from({ length: 3 - i % 2 }).map((_, j) => (
                  <div 
                    key={j} 
                    className="bg-card rounded-lg p-4 border shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-5 w-5 rounded" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-3" />
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Button */}
              <Skeleton className="h-9 w-full mt-4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
