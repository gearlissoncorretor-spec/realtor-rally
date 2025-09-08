import { useData } from '@/contexts/DataContext';

export const useSales = () => {
  const { 
    sales, 
    salesLoading, 
    createSale, 
    updateSale, 
    deleteSale, 
    refreshSales 
  } = useData();

  return {
    sales,
    loading: salesLoading,
    createSale,
    updateSale,
    deleteSale,
    refreshSales
  };
};