import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';

export interface Negotiation {
  id: string;
  broker_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  property_address: string;
  property_type: string;
  negotiated_value: number;
  status: string;
  start_date: string;
  observations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNegotiationInput {
  broker_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  property_address: string;
  property_type?: string;
  negotiated_value: number;
  status?: string;
  start_date?: string;
  observations?: string;
}

export const useNegotiations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createSale } = useData();

  const { data: negotiations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['negotiations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negotiations')
        .select('*')
        .neq('status', 'venda_concluida') // Excluir negociações concluídas
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Negotiation[];
    },
    enabled: !!user,
  });

  const createNegotiationMutation = useMutation({
    mutationFn: async (input: CreateNegotiationInput) => {
      const { data, error } = await supabase
        .from('negotiations')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      toast({
        title: 'Negociação criada',
        description: 'A negociação foi registrada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a negociação.',
        variant: 'destructive',
      });
    },
  });

  const updateNegotiationMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Negotiation> & { id: string }) => {
      // Se o status for "venda_concluida", criar uma venda automaticamente
      if (updates.status === 'venda_concluida') {
        // Buscar a negociação atual
        const { data: negotiation, error: fetchError } = await supabase
          .from('negotiations')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // Criar a venda a partir da negociação
        await createSale({
          broker_id: negotiation.broker_id,
          client_name: negotiation.client_name,
          client_email: negotiation.client_email,
          client_phone: negotiation.client_phone,
          property_address: negotiation.property_address,
          property_type: negotiation.property_type as 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural',
          property_value: negotiation.negotiated_value,
          vgv: negotiation.negotiated_value,
          vgc: negotiation.negotiated_value * 0.06, // 6% de comissão padrão
          sale_date: new Date().toISOString().split('T')[0],
          status: 'confirmada',
          notes: `Venda originada da negociação. ${negotiation.observations || ''}`,
        });

        toast({
          title: 'Venda concluída!',
          description: 'A negociação foi convertida em venda automaticamente.',
        });
      }

      const { data, error } = await supabase
        .from('negotiations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      if (variables.status !== 'venda_concluida') {
        toast({
          title: 'Negociação atualizada',
          description: 'A negociação foi atualizada com sucesso.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a negociação.',
        variant: 'destructive',
      });
    },
  });

  const deleteNegotiationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('negotiations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      toast({
        title: 'Negociação excluída',
        description: 'A negociação foi excluída com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a negociação.',
        variant: 'destructive',
      });
    },
  });

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('negotiations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'negotiations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['negotiations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    negotiations,
    loading: isLoading,
    error,
    createNegotiation: createNegotiationMutation.mutateAsync,
    updateNegotiation: updateNegotiationMutation.mutateAsync,
    deleteNegotiation: deleteNegotiationMutation.mutateAsync,
    refreshNegotiations: refetch,
  };
};
