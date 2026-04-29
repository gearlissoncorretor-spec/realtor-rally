import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CashFlowItem {
  company_id: string;
  due_date: string;
  type: 'income' | 'expense';
  category: string;
  value: number;
  status: string;
  description: string;
}

export const useCashFlow = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: cashFlow = [], isLoading } = useQuery({
    queryKey: ['cash_flow', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_cash_flow' as any)
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as CashFlowItem[];
    },
    enabled: !!user && !authLoading,
  });

  return {
    cashFlow,
    loading: isLoading,
  };
};
