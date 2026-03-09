import React from 'react';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent, EVENT_TYPES } from '@/hooks/useCalendarEvents';
import { cn } from '@/lib/utils';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 21:00

const CalendarWeekView = ({ currentDate, events, onDateClick, onEventClick }: CalendarWeekViewProps) => {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.event_date === dateStr);
  };

  const getEventPosition = (event: CalendarEvent) => {
    if (event.is_all_day || !event.start_time) return null;
    const [h, m] = event.start_time.split(':').map(Number);
    const top = ((h - 6) * 60 + m) * (48 / 60); // 48px per hour
    let duration = 60;
    if (event.end_time) {
      const [eh, em] = event.end_time.split(':').map(Number);
      duration = (eh * 60 + em) - (h * 60 + m);
    }
    const height = Math.max(duration * (48 / 60), 20);
    return { top, height };
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] bg-muted/50 border-b border-border">
        <div className="p-2" />
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-2 text-center border-l border-border cursor-pointer hover:bg-muted/30",
              isToday(day) && "bg-primary/10"
            )}
            onClick={() => onDateClick(day)}
          >
            <div className="text-xs text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</div>
            <div className={cn(
              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mx-auto",
              isToday(day) && "bg-primary text-primary-foreground"
            )}>
              {format(day, 'd')}
            </div>
            {/* All-day events */}
            {getEventsForDate(day).filter(e => e.is_all_day).map(event => {
              const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
              return (
                <div
                  key={event.id}
                  className="text-[10px] px-1 py-0.5 rounded mt-0.5 truncate cursor-pointer"
                  style={{
                    backgroundColor: (event.color || typeInfo?.color || '#3b82f6') + '30',
                    color: event.color || typeInfo?.color || '#3b82f6',
                  }}
                  onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                >
                  {event.title}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] max-h-[600px] overflow-y-auto">
        {/* Hours column */}
        <div>
          {HOURS.map(hour => (
            <div key={hour} className="h-12 border-b border-border flex items-start justify-end pr-2">
              <span className="text-[10px] text-muted-foreground -mt-1.5">{String(hour).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="relative border-l border-border" onClick={() => onDateClick(day)}>
            {HOURS.map(hour => (
              <div key={hour} className="h-12 border-b border-border hover:bg-muted/20 cursor-pointer" />
            ))}
            {/* Timed events */}
            {getEventsForDate(day).filter(e => !e.is_all_day && e.start_time).map(event => {
              const pos = getEventPosition(event);
              if (!pos) return null;
              const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
              return (
                <div
                  key={event.id}
                  className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] leading-tight overflow-hidden cursor-pointer hover:opacity-90 z-10"
                  style={{
                    top: pos.top,
                    height: pos.height,
                    backgroundColor: (event.color || typeInfo?.color || '#3b82f6') + '25',
                    borderLeft: `2px solid ${event.color || typeInfo?.color || '#3b82f6'}`,
                    color: event.color || typeInfo?.color || '#3b82f6',
                  }}
                  onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  {pos.height > 30 && event.start_time && (
                    <div className="opacity-70">{event.start_time.slice(0, 5)}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWeekView;
