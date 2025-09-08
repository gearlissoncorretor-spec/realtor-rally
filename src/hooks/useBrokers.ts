import { useData } from '@/contexts/DataContext';

export const useBrokers = () => {
  const { 
    brokers, 
    brokersLoading, 
    createBroker, 
    updateBroker, 
    deleteBroker, 
    refreshBrokers 
  } = useData();

  return {
    brokers,
    loading: brokersLoading,
    createBroker,
    updateBroker,
    deleteBroker,
    refreshBrokers
  };
};