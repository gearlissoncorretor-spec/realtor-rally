import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommissionInstallment {
  id: string;
  commission_id: string;
  installment_number: number;
  value: number;
  due_date: string | null;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  observations: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useCommissionInstallments = (commissionId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['commission-installments', commissionId],
    queryFn: async () => {
      if (!commissionId) return [];
      const { data, error } = await supabase
        .from('commission_installments' as any)
        .select('*')
        .eq('commission_id', commissionId)
        .order('installment_number', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CommissionInstallment[];
    },
    enabled: !!commissionId,
  });

  const generateInstallments = useMutation({
    mutationFn: async ({ commissionId, totalValue, count, firstDueDate }: {
      commissionId: string; totalValue: number; count: number; firstDueDate: string;
    }) => {
      // Delete existing
      await supabase.from('commission_installments' as any).delete().eq('commission_id', commissionId);
      const installmentValue = totalValue / count;
      const rows = Array.from({ length: count }, (_, i) => {
        const due = new Date(firstDueDate);
        due.setMonth(due.getMonth() + i);
        return {
          commission_id: commissionId,
          installment_number: i + 1,
          value: Math.round(installmentValue * 100) / 100,
          due_date: due.toISOString().split('T')[0],
          status: 'pendente',
        };
      });
      const { error } = await supabase.from('commission_installments' as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-installments'] });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });

  const updateInstallment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CommissionInstallment> & { id: string }) => {
      const { error } = await supabase
        .from('commission_installments' as any)
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-installments'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });

  return {
    installments,
    loading: isLoading,
    generateInstallments: generateInstallments.mutateAsync,
    updateInstallment: updateInstallment.mutateAsync,
  };
};
