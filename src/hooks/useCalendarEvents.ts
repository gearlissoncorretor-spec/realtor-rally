import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CalendarEvent {
  id: string;
  user_id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  event_type: string;
  responsible_id: string | null;
  client_name: string | null;
  property_reference: string | null;
  is_private: boolean;
  is_all_day: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  event_type: string;
  responsible_id?: string;
  client_name?: string;
  property_reference?: string;
  is_private?: boolean;
  is_all_day?: boolean;
  color?: string;
  share_with_team?: boolean;
  share_with_users?: string[];
}

export const EVENT_TYPES = [
  { value: 'reuniao', label: 'Reunião', color: '#3b82f6' },
  { value: 'visita', label: 'Visita', color: '#10b981' },
  { value: 'follow_up', label: 'Follow-up', color: '#f59e0b' },
  { value: 'meta', label: 'Meta', color: '#8b5cf6' },
  { value: 'captacao', label: 'Captação', color: '#ec4899' },
  { value: 'venda', label: 'Venda', color: '#06b6d4' },
  { value: 'lancamento', label: 'Lançamento', color: '#f97316' },
  { value: 'lembrete', label: 'Lembrete', color: '#6b7280' },
  { value: 'outro', label: 'Outro', color: '#64748b' },
];

export function useCalendarEvents(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: async () => {
      let query = (supabase as any)
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (startDate) query = query.gte('event_date', startDate);
      if (endDate) query = query.lte('event_date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      const { share_with_team, share_with_users, ...insertData } = eventData;
      
      const { data, error } = await (supabase as any)
        .from('calendar_events')
        .insert({ ...insertData, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Handle sharing
      if (share_with_team && data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user!.id)
          .single();
        
        if (profile?.team_id) {
          await supabase.from('calendar_event_shares').insert({
            event_id: data.id,
            shared_with_team_id: profile.team_id,
          });
        }
      }

      if (share_with_users?.length && data) {
        const shares = share_with_users.map(userId => ({
          event_id: data.id,
          shared_with_user_id: userId,
        }));
        await supabase.from('calendar_event_shares').insert(shares);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Evento criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: () => toast.error('Erro ao criar evento'),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CalendarEvent> & { id: string }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Evento atualizado');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: () => toast.error('Erro ao atualizar evento'),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Evento excluído');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: () => toast.error('Erro ao excluir evento'),
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: eventsQuery.refetch,
  };
}
