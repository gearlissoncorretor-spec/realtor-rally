import React from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent, EVENT_TYPES } from '@/hooks/useCalendarEvents';
import { cn } from '@/lib/utils';
import { Clock, MapPin, User, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

const CalendarDayView = ({ currentDate, events, onEventClick }: CalendarDayViewProps) => {
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayEvents = events.filter(e => e.event_date === dateStr);
  const allDayEvents = dayEvents.filter(e => e.is_all_day);
  const timedEvents = dayEvents.filter(e => !e.is_all_day);

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.start_time) return null;
    const [h, m] = event.start_time.split(':').map(Number);
    const top = ((h - 6) * 60 + m) * (60 / 60); // 60px per hour
    let duration = 60;
    if (event.end_time) {
      const [eh, em] = event.end_time.split(':').map(Number);
      duration = (eh * 60 + em) - (h * 60 + m);
    }
    const height = Math.max(duration * (60 / 60), 30);
    return { top, height };
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className={cn(
        "p-4 border-b border-border text-center",
        isToday(currentDate) && "bg-primary/5"
      )}>
        <div className="text-sm text-muted-foreground">{format(currentDate, 'EEEE', { locale: ptBR })}</div>
        <div className={cn(
          "text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full mx-auto",
          isToday(currentDate) && "bg-primary text-primary-foreground"
        )}>
          {format(currentDate, 'd')}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="p-2 border-b border-border bg-muted/20 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dia inteiro</span>
          {allDayEvents.map(event => {
            const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
            return (
              <div
                key={event.id}
                className="p-2 rounded cursor-pointer hover:opacity-80 flex items-center gap-2"
                style={{
                  backgroundColor: (event.color || typeInfo?.color || '#3b82f6') + '20',
                  borderLeft: `3px solid ${event.color || typeInfo?.color || '#3b82f6'}`,
                }}
                onClick={() => onEventClick(event)}
              >
                <span className="text-sm font-medium" style={{ color: event.color || typeInfo?.color }}>{event.title}</span>
                {event.is_private && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="relative max-h-[600px] overflow-y-auto">
        <div className="grid grid-cols-[60px_1fr]">
          <div>
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] border-b border-border flex items-start justify-end pr-2">
                <span className="text-xs text-muted-foreground -mt-1.5">{String(hour).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          <div className="relative border-l border-border">
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] border-b border-border" />
            ))}
            {timedEvents.map(event => {
              const pos = getEventPosition(event);
              if (!pos) return null;
              const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
              const color = event.color || typeInfo?.color || '#3b82f6';
              return (
                <div
                  key={event.id}
                  className="absolute left-1 right-1 rounded-md px-3 py-1.5 cursor-pointer hover:opacity-90 z-10"
                  style={{
                    top: pos.top,
                    height: pos.height,
                    backgroundColor: color + '20',
                    borderLeft: `3px solid ${color}`,
                  }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="font-medium text-sm truncate" style={{ color }}>{event.title}</div>
                  {pos.height > 40 && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs opacity-70" style={{ color }}>
                        {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
                      </span>
                      {event.client_name && (
                        <span className="text-xs opacity-60 flex items-center gap-0.5" style={{ color }}>
                          <User className="w-3 h-3" />{event.client_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDayView;
