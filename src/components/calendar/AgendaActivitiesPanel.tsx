import React, { useState } from 'react';
import { CalendarEvent, EVENT_TYPES } from '@/hooks/useCalendarEvents';
import { format } from 'date-fns';
import { CheckSquare, Square, Clock, ChevronRight, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgendaActivitiesPanelProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

const ActivityList = ({ events, currentDate, onEventClick }: AgendaActivitiesPanelProps) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const todayStr = format(currentDate, 'yyyy-MM-dd');
  const todayEvents = events.filter(e => e.event_date === todayStr);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Atividades de Hoje
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {todayEvents.length}
        </span>
      </div>

      {todayEvents.length === 0 ? (
        <div className="text-center py-8">
          <ListTodo className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma atividade hoje</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2 pr-2">
            {todayEvents.map(event => {
              const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
              const color = event.color || typeInfo?.color || '#3b82f6';
              const isDone = checked.has(event.id);

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group",
                    isDone
                      ? "bg-muted/30 border-border/50 opacity-60"
                      : "bg-card/50 border-border hover:border-primary/30 hover:bg-card"
                  )}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(event.id); }}
                    className="mt-0.5 shrink-0"
                  >
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground group-hover:text-primary/60" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => onEventClick(event)}>
                    <p className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {event.start_time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.start_time.slice(0, 5)}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {typeInfo?.label || event.event_type}
                      </span>
                    </div>
                    {event.client_name && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{event.client_name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

const AgendaActivitiesPanel = (props: AgendaActivitiesPanelProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ListTodo className="w-4 h-4" />
            Atividades
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] sm:w-[380px]">
          <SheetHeader>
            <SheetTitle>Atividades</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ActivityList {...props} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-80 shrink-0 rounded-xl border border-border bg-card/50 p-4">
      <ActivityList {...props} />
    </div>
  );
};

export default AgendaActivitiesPanel;
