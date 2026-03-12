import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type WatchedTable = {
  table: string;
  label: string;
  queryKey: readonly string[];
  showToast?: boolean;
};

const WATCHED_TABLES: WatchedTable[] = [
  { table: 'sales', label: 'Vendas', queryKey: ['sales'] },
  { table: 'brokers', label: 'Corretores', queryKey: ['brokers'] },
  { table: 'negotiations', label: 'Negociações', queryKey: ['negotiations'] },
  { table: 'goals', label: 'Metas', queryKey: ['goals'] },
  { table: 'follow_ups', label: 'Follow-ups', queryKey: ['follow-ups'] },
  { table: 'targets', label: 'Metas mensais', queryKey: ['targets'] },
  { table: 'broker_tasks', label: 'Tarefas', queryKey: ['broker-tasks'] },
  { table: 'commissions', label: 'Comissões', queryKey: ['commissions'] },
  { table: 'calendar_events', label: 'Agenda', queryKey: ['calendar-events'] },
  { table: 'calendar_event_shares', label: 'Compartilhamentos da agenda', queryKey: ['calendar-events'], showToast: false },
];

export const useRealtimeSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toastThrottle = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('global-data-sync');

    WATCHED_TABLES.forEach(({ table, label, queryKey, showToast = true }) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        handleChange(queryKey, label, payload, showToast);
      });
    });

    channel.subscribe();

    function handleChange(queryKey: readonly string[], label: string, payload: any, showToast: boolean) {
      queryClient.invalidateQueries({ queryKey: [...queryKey] });

      if (!showToast) return;

      const throttleKey = queryKey.join(':');
      const now = Date.now();
      const lastToast = toastThrottle.current[throttleKey] || 0;
      if (now - lastToast < 10000) return;
      toastThrottle.current[throttleKey] = now;

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
