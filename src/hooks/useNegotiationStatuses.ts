import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NegotiationStatus {
  id: string;
  value: string;
  label: string;
  color: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
}

export const DEFAULT_NEGOTIATION_STATUSES = [
  { value: 'em_contato', label: 'Em Contato', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '📞', order_index: 0, is_active: true, is_system: true },
  { value: 'em_aprovacao', label: 'Em Aprovação', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: '🟡', order_index: 1, is_active: true, is_system: true },
  { value: 'cliente_reprovado', label: 'Cliente Reprovado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: '🔴', order_index: 2, is_active: true, is_system: true },
  { value: 'cliente_aprovado', label: 'Cliente Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: '🟢', order_index: 3, is_active: true, is_system: true },
  { value: 'perdida', label: 'Perdida', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: '❌', order_index: 98, is_active: true, is_system: true },
  { value: 'venda_concluida', label: 'Venda Concluída', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: '💰', order_index: 99, is_active: true, is_system: true },
];

export const useNegotiationStatuses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading: loading } = useQuery({
    queryKey: ['negotiation-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negotiation_statuses')
        .select('*')
        .order('order_index');

      if (error) throw error;

      // If no statuses exist yet, seed defaults
      if (data.length === 0) {
        const { data: seeded, error: seedError } = await supabase
          .from('negotiation_statuses')
          .insert(DEFAULT_NEGOTIATION_STATUSES)
          .select();

        if (seedError) {
          console.error('Error seeding statuses:', seedError);
          // Return defaults as fallback
          return DEFAULT_NEGOTIATION_STATUSES.map((s, i) => ({
            ...s,
            id: `default-${i}`,
            created_at: new Date().toISOString(),
          })) as NegotiationStatus[];
        }
        return (seeded || []) as NegotiationStatus[];
      }

      return data as NegotiationStatus[];
    },
  });

  const addStatusMutation = useMutation({
    mutationFn: async (status: Omit<NegotiationStatus, 'id' | 'created_at' | 'is_system'>) => {
      const { data, error } = await supabase
        .from('negotiation_statuses')
        .insert({ ...status, is_system: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiation-statuses'] });
      toast({ title: 'Status criado', description: 'O status foi adicionado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível criar o status.', variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<NegotiationStatus>) => {
      const { data, error } = await supabase
        .from('negotiation_statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiation-statuses'] });
      toast({ title: 'Status atualizado', description: 'As alterações foram salvas.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('negotiation_statuses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiation-statuses'] });
      toast({ title: 'Status excluído', description: 'O status foi removido.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível excluir o status.', variant: 'destructive' });
    },
  });

  const addStatus = (status: Omit<NegotiationStatus, 'id' | 'created_at' | 'is_system'>) => {
    return addStatusMutation.mutateAsync(status);
  };

  const updateStatus = (id: string, updates: Partial<NegotiationStatus>) => {
    return updateStatusMutation.mutateAsync({ id, ...updates });
  };

  const deactivateStatus = (id: string) => {
    const status = statuses.find(s => s.id === id);
    if (status?.is_system) {
      toast({ title: 'Erro', description: 'Status do sistema não podem ser desativados.', variant: 'destructive' });
      return;
    }
    return updateStatusMutation.mutateAsync({ id, is_active: false });
  };

  const reactivateStatus = (id: string) => {
    return updateStatusMutation.mutateAsync({ id, is_active: true });
  };

  const deleteStatus = (id: string) => {
    const status = statuses.find(s => s.id === id);
    if (status?.is_system) {
      toast({ title: 'Erro', description: 'Status do sistema não podem ser excluídos.', variant: 'destructive' });
      return;
    }
    return deleteStatusMutation.mutateAsync(id);
  };

  const activeStatuses = statuses.filter(s => s.is_active);
  const flowStatuses = activeStatuses.filter(s => !['perdida', 'venda_concluida'].includes(s.value));
  const getStatusByValue = (value: string) => statuses.find(s => s.value === value);

  return {
    statuses,
    activeStatuses,
    flowStatuses,
    loading,
    addStatus,
    updateStatus,
    deactivateStatus,
    reactivateStatus,
    deleteStatus,
    getStatusByValue,
  };
};
