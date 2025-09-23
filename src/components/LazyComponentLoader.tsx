import React, { Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoaderProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const DefaultSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  </div>
);

export const LazyComponentLoader: React.FC<LazyLoaderProps> = ({ 
  fallback = <DefaultSkeleton />, 
  children 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Helper function to create lazy-loaded components with custom skeletons
export const createLazyComponent = (
  componentImport: () => Promise<{ default: any }>,
  customSkeleton?: React.ReactNode
) => {
  const LazyComponent = React.lazy(componentImport);
  
  return (props: any) => (
    <LazyComponentLoader fallback={customSkeleton}>
      <LazyComponent {...props} />
    </LazyComponentLoader>
  );
};

// Chart skeleton specifically for dashboard charts
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-40" />
    <Skeleton className="w-full" style={{ height: `${height}px` }} />
  </div>
);

// Table skeleton for data tables
export const TableSkeleton = ({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-6 gap-4 p-4 border-b">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-6 gap-4 p-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4" />
        ))}
      </div>
    ))}
  </div>
);