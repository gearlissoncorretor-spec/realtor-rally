import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange,
  LayoutGrid, Phone, UserPlus, RotateCcw, Zap, ListTodo,
} from 'lucide-react';
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, subDays as subDaysFn,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalendarEvents, CalendarEvent as CalEvent, CreateEventData } from '@/hooks/useCalendarEvents';
import { useBrokerBirthdays } from '@/hooks/useBrokerBirthdays';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import CreateEventDialog from '@/components/calendar/CreateEventDialog';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import AgendaDayView from '@/components/calendar/AgendaDayView';
import AgendaSummaryCards from '@/components/calendar/AgendaSummaryCards';
import AgendaActivitiesPanel from '@/components/calendar/AgendaActivitiesPanel';
import GoogleCalendarConnect from '@/components/calendar/GoogleCalendarConnect';
import OverdueEventsAlert from '@/components/calendar/OverdueEventsAlert';
import { useIsMobile } from '@/hooks/use-mobile';
import { AgendaStickyNotes } from '@/components/sticky-notes/AgendaStickyNotes';

type ViewMode = 'month' | 'week' | 'day';
type FilterMode = 'todos' | 'minha' | 'equipe';

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [quickEventType, setQuickEventType] = useState<string | undefined>();
  const isMobile = useIsMobile();

  const getDateRange = () => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
      const end = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
      return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    }
    return { start: format(currentDate, 'yyyy-MM-dd'), end: format(currentDate, 'yyyy-MM-dd') };
  };

  const { start, end } = getDateRange();
  const { events: calendarEvents, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(start, end);
  
  // Fetch overdue events from the last 30 days
  const overdueStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const overdueEnd = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const { events: pastEvents, deleteEvent: deleteOverdueEvent } = useCalendarEvents(overdueStart, overdueEnd);
  
  const { getBirthdayEvents } = useBrokerBirthdays();
  const { googleEvents, isConnected, exchangeCode } = useGoogleCalendar(start, end);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      exchangeCode(code);
    }
  }, [exchangeCode]);

  // Convert Google events to CalEvent format and merge
  const events = React.useMemo(() => {
    const birthdays = getBirthdayEvents(start, end);

    const mappedGoogle: CalEvent[] = googleEvents.map((ge) => {
      const startDate = ge.start.includes('T') ? ge.start.substring(0, 10) : ge.start;
      const startTime = ge.start.includes('T') ? ge.start.substring(11, 16) : null;
      const endTime = ge.end.includes('T') ? ge.end.substring(11, 16) : null;

      return {
        id: `google-${ge.id}`,
        user_id: '',
        company_id: null,
        title: `📅 ${ge.summary}`,
        description: ge.description || null,
        event_date: startDate,
        start_time: startTime,
        end_time: endTime,
        event_type: 'outro',
        responsible_id: null,
        client_name: ge.location || null,
        property_reference: null,
        is_private: false,
        is_all_day: !ge.start.includes('T'),
        color: '#4285F4',
        created_at: '',
        updated_at: '',
      };
    });

    return [...calendarEvents, ...birthdays, ...mappedGoogle];
  }, [calendarEvents, getBirthdayEvents, googleEvents, start, end]);

  const navigate = (direction: 'prev' | 'next') => {
    const fn = direction === 'next'
      ? viewMode === 'month' ? addMonths : viewMode === 'week' ? addWeeks : addDays
      : viewMode === 'month' ? subMonths : viewMode === 'week' ? subWeeks : subDays;
    setCurrentDate(fn(currentDate, 1));
  };

  const getTitle = () => {
    if (viewMode === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate, { locale: ptBR });
      const we = endOfWeek(currentDate, { locale: ptBR });
      return `${format(ws, 'd MMM', { locale: ptBR })} - ${format(we, "d MMM 'de' yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const openQuickCreate = (eventType?: string) => {
    setSelectedDate(new Date());
    setEditingEvent(null);
    setQuickEventType(eventType);
    setShowCreateDialog(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === 'month') {
      setCurrentDate(date);
      setViewMode('day');
    } else {
      setQuickEventType(undefined);
      setShowCreateDialog(true);
    }
  };

  const handleEventClick = (event: CalEvent) => {
    setEditingEvent(event);
    setQuickEventType(undefined);
    setShowCreateDialog(true);
  };

  const handleCreateSubmit = (data: CreateEventData) => {
    createEvent.mutate(data);
  };

  const handleUpdateSubmit = (data: Partial<CalEvent> & { id: string }) => {
    updateEvent.mutate(data);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    deleteEvent.mutate(id);
    setEditingEvent(null);
  };

  const handleConfirmOverdueEvent = (event: CalEvent) => {
    // Mark as done by deleting it (completed)
    deleteEvent.mutate(event.id);
  };

  const handleDeleteOverdueEvent = (eventId: string) => {
    deleteOverdueEvent.mutate(eventId);
  };

  const quickActions = [
    { label: 'Nova Ligação', icon: Phone, type: 'lembrete', className: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20' },
    { label: 'Novo Cliente', icon: UserPlus, type: 'visita', className: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20' },
    { label: 'Follow-up', icon: RotateCcw, type: 'follow_up', className: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20' },
    { label: 'Planejar meu dia', icon: Zap, type: undefined, className: 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary hover:from-primary/30 hover:to-primary/20 border-primary/20' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-7 h-7 text-primary" />
                Agenda Comercial
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie visitas, ligações e compromissos da equipe
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GoogleCalendarConnect startDate={start} endDate={end} />
              {!isMobile && quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className={`gap-1.5 border ${action.className} transition-all`}
                  onClick={() => openQuickCreate(action.type)}
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </Button>
              ))}
              {isMobile && (
                <>
                  <Button size="sm" onClick={() => openQuickCreate()} className="gap-1.5">
                    <Plus className="w-4 h-4" /> Novo Evento
                  </Button>
                  <AgendaActivitiesPanel events={events} currentDate={currentDate} onEventClick={handleEventClick} />
                </>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <AgendaSummaryCards events={events} currentDate={currentDate} />

          {/* Overdue Events Alert */}
          <OverdueEventsAlert
            events={pastEvents}
            onConfirmEvent={handleConfirmOverdueEvent}
            onDeleteEvent={handleDeleteOverdueEvent}
          />

          {/* Filter + View Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Agenda Filter */}
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/50">
                {([['todos', 'Todos'], ['minha', 'Minha agenda'], ['equipe', 'Equipe']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterMode(val)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      filterMode === val
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setCurrentDate(new Date())}>
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <h2 className="text-sm lg:text-base font-semibold text-foreground capitalize">
                {getTitle()}
              </h2>
            </div>

            {/* View Mode */}
            <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="day" className="gap-1 text-xs h-7 px-3">
                  <CalendarDays className="w-3.5 h-3.5" /> Dia
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-1 text-xs h-7 px-3">
                  <CalendarRange className="w-3.5 h-3.5" /> Semana
                </TabsTrigger>
                <TabsTrigger value="month" className="gap-1 text-xs h-7 px-3">
                  <LayoutGrid className="w-3.5 h-3.5" /> Mês
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content: Calendar + Activities Sidebar */}
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              {viewMode === 'month' && (
                <CalendarMonthView
                  currentDate={currentDate}
                  events={events}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                />
              )}
              {viewMode === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={events}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                />
              )}
              {viewMode === 'day' && (
                <AgendaDayView
                  currentDate={currentDate}
                  events={events}
                  onEventClick={handleEventClick}
                />
              )}
            </div>

            {/* Desktop Activities Panel + Sticky Notes */}
            {!isMobile && (
              <div className="flex flex-col gap-4 w-[280px] shrink-0">
                <AgendaActivitiesPanel events={events} currentDate={currentDate} onEventClick={handleEventClick} />
                <AgendaStickyNotes />
              </div>
            )}
            {isMobile && (
              <AgendaStickyNotes />
            )}
          </div>
        </div>

        <CreateEventDialog
          open={showCreateDialog}
          onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingEvent(null); setQuickEventType(undefined); } }}
          onSubmit={handleCreateSubmit}
          isLoading={createEvent.isPending}
          defaultDate={selectedDate}
          editEvent={editingEvent}
          onUpdate={handleUpdateSubmit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
};

export default Agenda;
