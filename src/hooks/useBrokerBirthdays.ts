import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { format, parse, isValid } from 'date-fns';

export interface BrokerBirthday {
  brokerId: string;
  brokerName: string;
  birthday: string; // YYYY-MM-DD original
  avatarUrl: string | null;
}

export function useBrokerBirthdays(year?: number) {
  const { user } = useAuth();
  const currentYear = year || new Date().getFullYear();

  const query = useQuery({
    queryKey: ['broker-birthdays', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('id, name, birthday, avatar_url')
        .not('birthday', 'is', null)
        .eq('status', 'ativo');

      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        name: string;
        birthday: string;
        avatar_url: string | null;
      }>;
    },
    enabled: !!user,
  });

  // Convert broker birthdays to CalendarEvent-like objects for a given date range
  const getBirthdayEvents = (startDate?: string, endDate?: string): CalendarEvent[] => {
    if (!query.data) return [];

    return query.data
      .map((broker) => {
        const originalDate = parse(broker.birthday, 'yyyy-MM-dd', new Date());
        if (!isValid(originalDate)) return null;

        // Use the current year for the birthday event
        const thisYearBirthday = format(
          new Date(currentYear, originalDate.getMonth(), originalDate.getDate()),
          'yyyy-MM-dd'
        );

        // Filter by range if provided
        if (startDate && thisYearBirthday < startDate) return null;
        if (endDate && thisYearBirthday > endDate) return null;

        return {
          id: `birthday-${broker.id}`,
          user_id: '',
          company_id: null,
          title: `🎂 Aniversário: ${broker.name}`,
          description: `Hoje é aniversário de ${broker.name}! Não esqueça de parabenizar.`,
          event_date: thisYearBirthday,
          start_time: null,
          end_time: null,
          event_type: 'aniversario',
          responsible_id: null,
          client_name: broker.name,
          property_reference: null,
          is_private: false,
          is_all_day: true,
          color: '#ec4899',
          created_at: '',
          updated_at: '',
        } as CalendarEvent;
      })
      .filter(Boolean) as CalendarEvent[];
  };

  // Get today's birthdays for notifications
  const getTodayBirthdays = (): BrokerBirthday[] => {
    if (!query.data) return [];
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    return query.data
      .filter((broker) => {
        const d = parse(broker.birthday, 'yyyy-MM-dd', new Date());
        return isValid(d) && d.getMonth() === todayMonth && d.getDate() === todayDay;
      })
      .map((broker) => ({
        brokerId: broker.id,
        brokerName: broker.name,
        birthday: broker.birthday,
        avatarUrl: broker.avatar_url,
      }));
  };

  return {
    brokers: query.data || [],
    isLoading: query.isLoading,
    getBirthdayEvents,
    getTodayBirthdays,
  };
}
