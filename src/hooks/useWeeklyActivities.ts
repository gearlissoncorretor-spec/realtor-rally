import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, format } from 'date-fns';

export interface WeeklyActivity {
  id: string;
  broker_id: string;
  task_name: string;
  category: string;
  meta_semanal: number;
  realizado: number;
  week_start: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWeeklyActivityInput {
  broker_id: string;
  task_name: string;
  category?: string;
  meta_semanal?: number;
  realizado?: number;
  week_start?: string;
}

// Default tasks for new brokers
const DEFAULT_TASKS = [
  { task_name: 'Captação de Imóveis', category: 'captacao', meta_semanal: 10 },
  { task_name: 'Atendimento ao Cliente', category: 'atendimento', meta_semanal: 20 },
  { task_name: 'Ligações Realizadas', category: 'ligacao', meta_semanal: 30 },
  { task_name: 'Visitas Agendadas', category: 'visita', meta_semanal: 15 },
];

export const useWeeklyActivities = (brokerId?: string, weekStart?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current week start (Monday) or use provided weekStart
  const currentWeekStart = useMemo(() => {
    if (weekStart) return weekStart;
    const now = new Date();
    return format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }, [weekStart]);

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['weekly_activities', brokerId, currentWeekStart],
    queryFn: async () => {
      let query = supabase
        .from('broker_weekly_activities')
        .select('*')
        .eq('week_start', currentWeekStart)
        .order('created_at', { ascending: true });
      
      if (brokerId) {
        query = query.eq('broker_id', brokerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WeeklyActivity[];
    },
    enabled: !!user,
  });

  // Create default tasks for a broker if they don't have any for this week
  const createDefaultTasksMutation = useMutation({
    mutationFn: async (brokerId: string) => {
      const tasksToCreate = DEFAULT_TASKS.map(task => ({
        broker_id: brokerId,
        task_name: task.task_name,
        category: task.category,
        meta_semanal: task.meta_semanal,
        realizado: 0,
        week_start: currentWeekStart,
        created_by: user?.id,
      }));

      const { data, error } = await supabase
        .from('broker_weekly_activities')
        .insert(tasksToCreate)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_activities'] });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (input: CreateWeeklyActivityInput) => {
      const { data, error } = await supabase
        .from('broker_weekly_activities')
        .insert({
          ...input,
          week_start: input.week_start || currentWeekStart,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_activities'] });
      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi adicionada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WeeklyActivity> & { id: string }) => {
      const { data, error } = await supabase
        .from('broker_weekly_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_activities'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a tarefa.',
        variant: 'destructive',
      });
    },
  });

  const incrementRealizadoMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      const { data, error } = await supabase
        .from('broker_weekly_activities')
        .update({ realizado: currentValue + 1 })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_activities'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível incrementar.',
        variant: 'destructive',
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('broker_weekly_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_activities'] });
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi excluída com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a tarefa.',
        variant: 'destructive',
      });
    },
  });

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('weekly_activities_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'broker_weekly_activities' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['weekly_activities'] });
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
    currentWeekStart,
    createActivity: createActivityMutation.mutateAsync,
    createDefaultTasks: createDefaultTasksMutation.mutateAsync,
    updateActivity: updateActivityMutation.mutateAsync,
    incrementRealizado: incrementRealizadoMutation.mutateAsync,
    deleteActivity: deleteActivityMutation.mutateAsync,
    refreshActivities: refetch,
  };
};
