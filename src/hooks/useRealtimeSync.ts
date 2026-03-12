import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const WATCHED_TABLES = [
  { table: 'sales', label: 'Vendas', queryKey: 'sales' },
  { table: 'brokers', label: 'Corretores', queryKey: 'brokers' },
  { table: 'negotiations', label: 'Negociações', queryKey: 'negotiations' },
  { table: 'goals', label: 'Metas', queryKey: 'goals' },
  { table: 'follow_ups', label: 'Follow-ups', queryKey: 'follow-ups' },
  { table: 'targets', label: 'Metas mensais', queryKey: 'targets' },
  { table: 'broker_tasks', label: 'Tarefas', queryKey: 'broker-tasks' },
  { table: 'commissions', label: 'Comissões', queryKey: 'commissions' },
] as const;

export const useRealtimeSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toastThrottle = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => handleChange('sales', 'Vendas', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brokers' }, (payload) => handleChange('brokers', 'Corretores', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'negotiations' }, (payload) => handleChange('negotiations', 'Negociações', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, (payload) => handleChange('goals', 'Metas', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, (payload) => handleChange('follow-ups', 'Follow-ups', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'targets' }, (payload) => handleChange('targets', 'Metas mensais', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broker_tasks' }, (payload) => handleChange('broker-tasks', 'Tarefas', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions' }, (payload) => handleChange('commissions', 'Comissões', payload))
      .subscribe();

    function handleChange(queryKey: string, label: string, payload: any) {
      // Invalidate cache to force refetch
      queryClient.invalidateQueries({ queryKey: [queryKey] });

      // Throttle toasts per table (max 1 every 10s)
      const now = Date.now();
      const lastToast = toastThrottle.current[queryKey] || 0;
      if (now - lastToast < 10000) return;
      toastThrottle.current[queryKey] = now;

      const eventLabels: Record<string, string> = {
        INSERT: 'adicionado(a)',
        UPDATE: 'atualizado(a)',
        DELETE: 'removido(a)',
      };

      const action = eventLabels[payload.eventType] || 'alterado(a)';

      toast.info(`${label} ${action}`, {
        description: 'Os dados foram atualizados automaticamente.',
        duration: 3000,
        position: 'bottom-right',
      });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
