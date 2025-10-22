import { useEffect } from 'react';
import { useData } from '@/contexts/DataContext';

interface PreloadDataProps {
  children: React.ReactNode;
  preload?: ('brokers' | 'sales' | 'targets')[];
}

/**
 * Component to preload data before rendering children
 * This prevents the "loading then showing data" flash
 */
export const PreloadData: React.FC<PreloadDataProps> = ({ 
  children, 
  preload = ['brokers', 'sales'] 
}) => {
  const { 
    refreshBrokers, 
    refreshSales, 
    refreshTargets,
    brokersLoading,
    salesLoading,
    targetsLoading 
  } = useData();

  useEffect(() => {
    // Preload requested data
    if (preload.includes('brokers') && !brokersLoading) {
      refreshBrokers();
    }
    if (preload.includes('sales') && !salesLoading) {
      refreshSales();
    }
    if (preload.includes('targets') && !targetsLoading) {
      refreshTargets();
    }
  }, []); // Only run on mount

  return <>{children}</>;
};
