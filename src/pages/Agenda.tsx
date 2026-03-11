import React, { useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, LayoutGrid } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalendarEvents, CalendarEvent as CalEvent, CreateEventData } from '@/hooks/useCalendarEvents';
import CreateEventDialog from '@/components/calendar/CreateEventDialog';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarDayView from '@/components/calendar/CalendarDayView';

type ViewMode = 'month' | 'week' | 'day';

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);

  // Calculate date range for query
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
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(start, end);

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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === 'month') {
      setCurrentDate(date);
      setViewMode('day');
    } else {
      setShowCreateDialog(true);
    }
  };

  const handleEventClick = (event: CalEvent) => {
    setEditingEvent(event);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Agenda
              </h1>
              <p className="text-sm text-muted-foreground">Organize compromissos, metas e atividades</p>
            </div>
            <Button size="sm" onClick={() => { setSelectedDate(new Date()); setEditingEvent(null); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo evento
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground capitalize ml-2">
                {getTitle()}
              </h2>
            </div>

            <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="day" className="gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Dia
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-1">
                  <CalendarRange className="w-3.5 h-3.5" /> Semana
                </TabsTrigger>
                <TabsTrigger value="month" className="gap-1">
                  <LayoutGrid className="w-3.5 h-3.5" /> Mês
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar Views */}
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
            <CalendarDayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {/* Create/Edit Event Dialog */}
        <CreateEventDialog
          open={showCreateDialog}
          onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setEditingEvent(null); }}
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
