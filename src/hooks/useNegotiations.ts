import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  loss_reason: string | null;
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

export interface UpdateNegotiationInput {
  id: string;
  broker_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  property_address?: string;
  property_type?: string;
  negotiated_value?: number;
  status?: string;
  start_date?: string;
  observations?: string;
  loss_reason?: string;
}

export const useNegotiations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active negotiations (excludes venda_concluida and perdida)
  const { data: negotiations = [], isLoading: loadingActive, error: errorActive, refetch: refetchActive } = useQuery({
    queryKey: ['negotiations', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negotiations')
        .select('*')
        .not('status', 'in', '("venda_concluida","perdida")')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Negotiation[];
    },
    enabled: !!user,
  });

  // Fetch lost negotiations
  const { data: lostNegotiations = [], isLoading: loadingLost, error: errorLost, refetch: refetchLost } = useQuery({
    queryKey: ['negotiations', 'lost'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negotiations')
        .select('*')
        .eq('status', 'perdida')
        .order('updated_at', { ascending: false });

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
    mutationFn: async ({ id, ...updates }: UpdateNegotiationInput) => {
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
      
      if (variables.status === 'perdida') {
        toast({
          title: 'Negociação marcada como perdida',
          description: 'A negociação foi movida para a aba de perdidas.',
        });
      } else if (variables.status === 'venda_concluida') {
        toast({
          title: 'Venda concluída!',
          description: 'A negociação foi convertida em venda com sucesso.',
        });
      } else {
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

  const refreshNegotiations = () => {
    refetchActive();
    refetchLost();
  };

  return {
    negotiations,
    lostNegotiations,
    loading: loadingActive || loadingLost,
    error: errorActive || errorLost,
    createNegotiation: createNegotiationMutation.mutateAsync,
    updateNegotiation: updateNegotiationMutation.mutateAsync,
    deleteNegotiation: deleteNegotiationMutation.mutateAsync,
    refreshNegotiations,
  };
};
