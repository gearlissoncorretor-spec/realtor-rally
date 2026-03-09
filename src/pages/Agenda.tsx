import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Plus, Clock, MapPin, RefreshCw, Link2, Unlink, Loader2, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  htmlLink?: string;
}

const REDIRECT_URI = `${window.location.origin}/agenda`;

const Agenda = () => {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check connection status
  const { data: connectionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'status' },
      });
      if (error) throw error;
      return data as { connected: boolean; email: string | null };
    },
    staleTime: 60 * 1000,
  });

  // Handle OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && !isConnecting) {
      setIsConnecting(true);
      // Clean URL
      window.history.replaceState({}, '', '/agenda');

      supabase.functions.invoke('google-calendar', {
        body: { action: 'exchange-code', code, redirectUri: REDIRECT_URI },
      }).then(({ data, error }) => {
        if (error || !data?.success) {
          toast.error('Erro ao conectar Google Calendar');
          console.error('Exchange error:', error || data);
        } else {
          toast.success(`Google Calendar conectado: ${data.email}`);
          queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
          queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
        }
        setIsConnecting(false);
      });
    }
  }, []);

  // Fetch events
  const { data: events, isLoading: eventsLoading, error: eventsError, refetch } = useQuery({
    queryKey: ['google-calendar-events'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'list',
          timeMin: new Date().toISOString(),
          timeMax: addDays(new Date(), 30).toISOString(),
          maxResults: 50,
        },
      });
      if (error) throw error;
      if (data?.error === 'not_connected' || data?.error === 'token_revoked') {
        return [] as CalendarEvent[];
      }
      return (data?.events || []) as CalendarEvent[];
    },
    enabled: connectionStatus?.connected === true,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Connect to Google
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'auth-url', redirectUri: REDIRECT_URI },
      });
      if (error) throw error;
      return data.url as string;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: () => {
      toast.error('Erro ao iniciar conexão com Google');
    },
  });

  // Disconnect
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'disconnect' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Google Calendar desconectado');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
  });

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const getTimeStr = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'HH:mm');
    } catch {
      return '';
    }
  };

  const groupedEvents = (events || []).reduce((groups: Record<string, CalendarEvent[]>, event) => {
    const dateKey = event.start.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();
  const isConnected = connectionStatus?.connected === true;
  const isLoading = statusLoading || isConnecting;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Agenda
              </h1>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {connectionStatus?.email}</span>
                  : 'Conecte seu Google Calendar para ver seus compromissos'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isConnected ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                  </Button>
                  <Button size="sm" asChild>
                    <a href="https://calendar.google.com/calendar/r/eventedit" target="_blank" rel="noopener noreferrer">
                      <Plus className="w-4 h-4 mr-1" /> Novo evento
                    </a>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>
                    <Unlink className="w-4 h-4 mr-1" /> Desconectar
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending || isLoading}
                  size="sm"
                >
                  {connectMutation.isPending || isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-1" />
                  )}
                  Conectar Google Calendar
                </Button>
              )}
            </div>
          </div>

          {/* Loading */}
          {(isLoading || eventsLoading) && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Not connected */}
          {!isLoading && !isConnected && (
            <Card className="border-primary/20">
              <CardContent className="p-8 text-center space-y-4">
                <Calendar className="w-16 h-16 text-primary mx-auto opacity-50" />
                <h3 className="font-semibold text-lg text-foreground">Conecte sua conta Google</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Cada usuário conecta sua própria conta Google para visualizar seus compromissos pessoais. 
                  Seus dados são isolados e ninguém mais terá acesso à sua agenda.
                </p>
                <Button onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}>
                  {connectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  Conectar Google Calendar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Connected but no events */}
          {!isLoading && !eventsLoading && isConnected && sortedDates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground">Nenhum evento</h3>
                <p className="text-sm text-muted-foreground">Você não tem compromissos nos próximos 30 dias</p>
              </CardContent>
            </Card>
          )}

          {/* Events list */}
          {sortedDates.map(dateKey => (
            <div key={dateKey} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {getDateLabel(dateKey + 'T00:00:00')}
              </h3>
              <div className="space-y-2">
                {groupedEvents[dateKey].map(event => (
                  <Card key={event.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{event.summary}</h4>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeStr(event.start)} - {getTimeStr(event.end)}
                            </Badge>
                            {event.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {event.htmlLink && (
                          <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Agenda;
