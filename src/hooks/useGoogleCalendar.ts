import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  htmlLink: string;
}

const PUBLISHED_URL = 'https://gestaoequipembsc.lovable.app';

async function invokeGoogleCalendar(action: string, extra: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const res = await fetch(
    `https://kwsnnwiwflsvsqiuzfja.supabase.co/functions/v1/google-calendar`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c25ud2l3ZmxzdnNxaXV6ZmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjUxNzYsImV4cCI6MjA3Mjg0MTE3Nn0._wkwx1DF3dU3prxTZ-w1jANj4uJS1u1tXzN4D4bq5wY',
      },
      body: JSON.stringify({ action, ...extra }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export function useGoogleCalendar(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Connection status
  const statusQuery = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => invokeGoogleCalendar('status'),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isConnected = statusQuery.data?.connected ?? false;
  const connectedEmail = statusQuery.data?.email ?? null;

  // Google events
  const eventsQuery = useQuery({
    queryKey: ['google-calendar-events', startDate, endDate],
    queryFn: () =>
      invokeGoogleCalendar('list', {
        timeMin: startDate ? new Date(startDate).toISOString() : undefined,
        timeMax: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
      }),
    enabled: !!user && isConnected,
    staleTime: 2 * 60 * 1000,
  });

  const googleEvents: GoogleCalendarEvent[] = eventsQuery.data?.events || [];

  // Connect
  const connect = useCallback(async () => {
    try {
      const redirectUri = `${PUBLISHED_URL}/agenda`;
      const data = await invokeGoogleCalendar('auth-url', { redirectUri });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar com Google');
    }
  }, []);

  // Exchange code (called after OAuth redirect)
  const exchangeCode = useCallback(async (code: string) => {
    try {
      const redirectUri = `${PUBLISHED_URL}/agenda`;
      await invokeGoogleCalendar('exchange-code', { code, redirectUri });
      toast.success('Google Calendar conectado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      // Clean URL
      window.history.replaceState({}, '', '/agenda');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao trocar código OAuth');
    }
  }, [queryClient]);

  // Disconnect
  const disconnect = useMutation({
    mutationFn: () => invokeGoogleCalendar('disconnect'),
    onSuccess: () => {
      toast.success('Google Calendar desconectado');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
    onError: () => toast.error('Erro ao desconectar'),
  });

  return {
    isConnected,
    connectedEmail,
    isLoadingStatus: statusQuery.isLoading,
    googleEvents,
    isLoadingEvents: eventsQuery.isLoading,
    connect,
    exchangeCode,
    disconnect,
  };
}
