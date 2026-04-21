import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface FinancialRecord {
  id: string;
  description: string;
  value: number;
  due_date: string;
  status: 'pendente' | 'pago' | 'atrasado';
  category: string;
  payment_method: string | null;
  observations: string | null;
  user_id: string;
  company_id: string;
  agency_id: string | null;
  commission_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialRecordInsert {
  description: string;
  value: number;
  due_date: string;
  status?: 'pendente' | 'pago' | 'atrasado';
  category: string;
  payment_method?: string | null;
  observations?: string | null;
  user_id: string;
  company_id: string;
  agency_id?: string | null;
  commission_id?: string | null;
}

export const useFinancialRecords = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, loading: authLoading, getUserRole } = useAuth();
  const userRole = getUserRole();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['financial_records', user?.id, userRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      
      // Client-side check for "atrasado" status
      const today = new Date().toISOString().split('T')[0];
      return (data as FinancialRecord[]).map(record => {
        if (record.status === 'pendente' && record.due_date < today) {
          return { ...record, status: 'atrasado' as const };
        }
        return record;
      });
    },
    enabled: !!user && !authLoading,
  });

  const createRecord = useMutation({
    mutationFn: async (record: FinancialRecordInsert) => {
      const { error } = await supabase
        .from('financial_records')
        .insert(record as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_records'] });
      toast({ title: 'Sucesso', description: 'Registro financeiro criado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FinancialRecord> & { id: string }) => {
      const { error } = await supabase
        .from('financial_records')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_records'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_records'] });
      toast({ title: 'Sucesso', description: 'Registro removido.' });
    },
  });

  return {
    records,
    loading: isLoading,
    createRecord: createRecord.mutateAsync,
    updateRecord: updateRecord.mutateAsync,
    deleteRecord: deleteRecord.mutateAsync,
  };
};
