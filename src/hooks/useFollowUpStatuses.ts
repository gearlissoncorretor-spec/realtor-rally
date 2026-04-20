import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FollowUpStatus } from './useFollowUps';

export const useFollowUpStatuses = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['follow-up-statuses-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_statuses')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as FollowUpStatus[];
    },
    enabled: !!user && !authLoading,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['follow-up-statuses-all'] });
    queryClient.invalidateQueries({ queryKey: ['follow-up-statuses'] });
  };

  const addStatus = useMutation({
    mutationFn: async (status: Omit<FollowUpStatus, 'id'>) => {
      const { error } = await supabase
        .from('follow_up_statuses')
        .insert(status as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Status adicionado' }); },
    onError: (e: any) => { toast({ title: 'Erro', description: e.message, variant: 'destructive' }); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FollowUpStatus> & { id: string }) => {
      const { error } = await supabase
        .from('follow_up_statuses')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); },
    onError: (e: any) => { toast({ title: 'Erro', description: e.message, variant: 'destructive' }); },
  });

  const deleteStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('follow_up_statuses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Status removido' }); },
    onError: (e: any) => { toast({ title: 'Erro', description: e.message, variant: 'destructive' }); },
  });

  return {
    statuses,
    isLoading,
    addStatus: (s: Omit<FollowUpStatus, 'id'>) => addStatus.mutate(s),
    updateStatus: (id: string, updates: Partial<FollowUpStatus>) => updateStatus.mutate({ id, ...updates }),
    deactivateStatus: (id: string) => updateStatus.mutate({ id, is_active: false }),
    reactivateStatus: (id: string) => updateStatus.mutate({ id, is_active: true }),
    deleteStatus: (id: string) => deleteStatus.mutate(id),
  };
};
