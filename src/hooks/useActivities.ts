import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BrokerActivity {
  id: string;
  broker_id: string;
  activity_type: string;
  client_name: string | null;
  property_reference: string | null;
  activity_date: string;
  observations: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityInput {
  broker_id: string;
  activity_type: string;
  client_name?: string;
  property_reference?: string;
  activity_date?: string;
  observations?: string;
  status?: string;
}

export const useActivities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['broker_activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_activities')
        .select('*')
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return data as BrokerActivity[];
    },
    enabled: !!user,
  });

  const createActivityMutation = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data, error } = await supabase
        .from('broker_activities')
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
      queryClient.invalidateQueries({ queryKey: ['broker_activities'] });
      toast({
        title: 'Atividade criada',
        description: 'A atividade foi registrada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a atividade.',
        variant: 'destructive',
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BrokerActivity> & { id: string }) => {
      const { data, error } = await supabase
        .from('broker_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker_activities'] });
      toast({
        title: 'Atividade atualizada',
        description: 'A atividade foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a atividade.',
        variant: 'destructive',
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('broker_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker_activities'] });
      toast({
        title: 'Atividade excluída',
        description: 'A atividade foi excluída com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a atividade.',
        variant: 'destructive',
      });
    },
  });

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('broker_activities_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'broker_activities' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['broker_activities'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    activities,
    loading: isLoading,
    error,
    createActivity: createActivityMutation.mutateAsync,
    updateActivity: updateActivityMutation.mutateAsync,
    deleteActivity: deleteActivityMutation.mutateAsync,
    refreshActivities: refetch,
  };
};
