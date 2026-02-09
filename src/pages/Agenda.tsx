import React, { useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Plus, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  htmlLink?: string;
}

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: events, isLoading, error, refetch } = useQuery({
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
      return (data?.events || []) as CalendarEvent[];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
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

  // Group events by date
  const groupedEvents = (events || []).reduce((groups: Record<string, CalendarEvent[]>, event) => {
    const dateKey = event.start.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-20 lg:pt-8 px-4 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Agenda
              </h1>
              <p className="text-sm text-muted-foreground">Seus compromissos do Google Calendar</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
              </Button>
              <Button size="sm" asChild>
                <a href="https://calendar.google.com/calendar/r/eventedit" target="_blank" rel="noopener noreferrer">
                  <Plus className="w-4 h-4 mr-1" /> Novo evento
                </a>
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading && (
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

          {error && (
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-center space-y-3">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground">Conecte seu Google Calendar</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Para ver seus compromissos aqui, é necessário configurar a integração com o Google Calendar. 
                  Entre em contato com o administrador para configurar as credenciais.
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && sortedDates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground">Nenhum evento</h3>
                <p className="text-sm text-muted-foreground">Você não tem compromissos nos próximos 30 dias</p>
              </CardContent>
            </Card>
          )}

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
