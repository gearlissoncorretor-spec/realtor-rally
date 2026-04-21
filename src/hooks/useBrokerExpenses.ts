import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface BrokerExpense {
  id: string;
  user_id: string;
  company_id: string;
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  data: string;
  created_at: string;
}

export interface BrokerExpenseInsert {
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  data: string;
}

export const useBrokerExpenses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['broker_expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_corretor')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as BrokerExpense[];
    },
    enabled: !!user,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: BrokerExpenseInsert) => {
      if (!user || !profile?.company_id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('gastos_corretor')
        .insert({
          ...expense,
          user_id: user.id,
          company_id: profile.company_id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker_expenses'] });
      toast({ title: "Gasto registrado", description: "O gasto foi salvo com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
    }
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gastos_corretor')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker_expenses'] });
      toast({ title: "Gasto excluído", description: "O registro foi removido." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  });

  return {
    expenses,
    isLoading,
    createExpense: createExpense.mutateAsync,
    deleteExpense: deleteExpense.mutateAsync,
  };
};
