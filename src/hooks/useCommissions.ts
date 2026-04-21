import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export interface Commission {
  id: string;
  sale_id: string | null;
  broker_id: string | null;
  company_id: string | null;
  commission_percentage: number;
  commission_value: number;
  base_value: number;
  commission_type: string;
  description: string | null;
  status: string;
  payment_date: string | null;
  due_date: string | null;
  received_at: string | null;
  payment_method: string | null;
  installments: number;
  paid_installments: number;
  observations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionInsert {
  sale_id?: string | null;
  broker_id: string;
  commission_percentage: number;
  commission_value: number;
  base_value: number;
  commission_type?: string;
  description?: string | null;
  status?: string;
  payment_date?: string | null;
  due_date?: string | null;
  received_at?: string | null;
  payment_method?: string | null;
  installments?: number;
  paid_installments?: number;
  observations?: string | null;
  agency_id?: string | null;
}

export const useCommissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, loading: authLoading, getUserRole } = useAuth();
  const userRole = getUserRole();

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions', user?.id, userRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!user && !authLoading,
  });

  const createCommission = useMutation({
    mutationFn: async (commission: CommissionInsert) => {
      const { error } = await supabase
        .from('commissions')
        .insert(commission as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updateCommission = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Commission> & { id: string }) => {
      const { error } = await supabase
        .from('commissions')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCommission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });

  return {
    commissions,
    loading: isLoading,
    createCommission: createCommission.mutateAsync,
    updateCommission: updateCommission.mutateAsync,
    deleteCommission: deleteCommission.mutateAsync,
  };
};
