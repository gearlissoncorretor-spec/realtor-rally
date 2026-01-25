import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useBrokers } from '@/hooks/useBrokers';

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
  const { user, isCorretor, isGerente, isDiretor, isAdmin, teamHierarchy } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { brokers } = useBrokers();

  // Get current user's broker for corretores
  const currentBroker = useMemo(() => {
    return brokers?.find(b => b.user_id === user?.id);
  }, [brokers, user?.id]);

  // Fetch active negotiations (excludes venda_concluida and perdida)
  const { data: allNegotiations = [], isLoading: loadingActive, error: errorActive, refetch: refetchActive } = useQuery({
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
  const { data: allLostNegotiations = [], isLoading: loadingLost, error: errorLost, refetch: refetchLost } = useQuery({
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

  // Filter negotiations based on user role
  const negotiations = useMemo(() => {
    if (!allNegotiations) return [];

    // Directors and admins see all negotiations
    if (isDiretor() || isAdmin()) {
      return allNegotiations;
    }

    // Managers see only their team's negotiations
    if (isGerente() && teamHierarchy?.team_id) {
      const teamBrokerIds = brokers
        ?.filter(b => b.team_id === teamHierarchy.team_id)
        .map(b => b.id) || [];
      return allNegotiations.filter(n => teamBrokerIds.includes(n.broker_id));
    }

    // Brokers see only their own negotiations
    if (isCorretor() && currentBroker) {
      return allNegotiations.filter(n => n.broker_id === currentBroker.id);
    }

    return [];
  }, [allNegotiations, brokers, currentBroker, teamHierarchy, isCorretor, isGerente, isDiretor, isAdmin]);

  // Filter lost negotiations based on user role
  const lostNegotiations = useMemo(() => {
    if (!allLostNegotiations) return [];

    // Directors and admins see all lost negotiations
    if (isDiretor() || isAdmin()) {
      return allLostNegotiations;
    }

    // Managers see only their team's lost negotiations
    if (isGerente() && teamHierarchy?.team_id) {
      const teamBrokerIds = brokers
        ?.filter(b => b.team_id === teamHierarchy.team_id)
        .map(b => b.id) || [];
      return allLostNegotiations.filter(n => teamBrokerIds.includes(n.broker_id));
    }

    // Brokers see only their own lost negotiations
    if (isCorretor() && currentBroker) {
      return allLostNegotiations.filter(n => n.broker_id === currentBroker.id);
    }

    return [];
  }, [allLostNegotiations, brokers, currentBroker, teamHierarchy, isCorretor, isGerente, isDiretor, isAdmin]);

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
