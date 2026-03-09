import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent, EVENT_TYPES } from '@/hooks/useCalendarEvents';
import { cn } from '@/lib/utils';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const CalendarMonthView = ({ currentDate, events, onDateClick, onEventClick }: CalendarMonthViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { locale: ptBR });
  const calEnd = endOfWeek(monthEnd, { locale: ptBR });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.event_date === dateStr);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map(d => (
          <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] p-1 border-b border-r border-border cursor-pointer hover:bg-muted/30 transition-colors",
                !isCurrentMonth && "bg-muted/10 opacity-50"
              )}
              onClick={() => onDateClick(day)}
            >
              <div className={cn(
                "text-xs font-medium p-1 w-6 h-6 flex items-center justify-center rounded-full",
                isToday(day) && "bg-primary text-primary-foreground",
                !isToday(day) && "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5 mt-0.5">
                {dayEvents.slice(0, 3).map(event => {
                  const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
                  return (
                    <div
                      key={event.id}
                      className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: (event.color || typeInfo?.color || '#3b82f6') + '20',
                        color: event.color || typeInfo?.color || '#3b82f6',
                        borderLeft: `2px solid ${event.color || typeInfo?.color || '#3b82f6'}`,
                      }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    >
                      {!event.is_all_day && event.start_time && (
                        <span className="font-medium">{event.start_time.slice(0, 5)} </span>
                      )}
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1.5">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthView;
