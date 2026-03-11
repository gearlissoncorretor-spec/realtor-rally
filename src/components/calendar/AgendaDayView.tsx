import React, { useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent, EVENT_TYPES } from '@/hooks/useCalendarEvents';
import { User, Lock } from 'lucide-react';

interface AgendaDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 - 23:00

const AgendaDayView = ({ currentDate, events, onEventClick }: AgendaDayViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (containerRef.current && isToday(currentDate)) {
      const hour = new Date().getHours();
      const scrollTo = Math.max(0, (hour - 7) * 64);
      containerRef.current.scrollTop = scrollTo;
    }
  }, [currentDate]);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayEvents = events.filter(e => e.event_date === dateStr);
  const timedEvents = dayEvents.filter(e => !e.is_all_day);
  const allDayEvents = dayEvents.filter(e => e.is_all_day);

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.start_time) return null;
    const [h, m] = event.start_time.split(':').map(Number);
    const top = ((h - 6) * 64 + (m / 60) * 64);
    let duration = 60;
    if (event.end_time) {
      const [eh, em] = event.end_time.split(':').map(Number);
      duration = (eh * 60 + em) - (h * 60 + m);
    }
    const height = Math.max((duration / 60) * 64, 32);
    return { top, height };
  };

  // Current time indicator
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();
  const nowTop = ((nowHour - 6) * 64 + (nowMin / 60) * 64);
  const showNowLine = isToday(currentDate) && nowHour >= 6 && nowHour <= 23;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card/30">
      {/* Header */}
      <div className={`p-4 border-b border-border text-center ${isToday(currentDate) ? 'bg-primary/5' : ''}`}>
        <div className="text-sm text-muted-foreground capitalize">{format(currentDate, 'EEEE', { locale: ptBR })}</div>
        <div className={`text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full mx-auto ${isToday(currentDate) ? 'bg-primary text-primary-foreground' : ''}`}>
          {format(currentDate, 'd')}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="p-2 border-b border-border bg-muted/10 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dia inteiro</span>
          {allDayEvents.map(event => {
            const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
            const color = event.color || typeInfo?.color || '#3b82f6';
            return (
              <div
                key={event.id}
                className="p-2 rounded-lg cursor-pointer hover:opacity-80 flex items-center gap-2 transition-all"
                style={{ backgroundColor: color + '15', borderLeft: `3px solid ${color}` }}
                onClick={() => onEventClick(event)}
              >
                <span className="text-sm font-medium" style={{ color }}>{event.title}</span>
                {event.is_private && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div ref={containerRef} className="relative max-h-[600px] overflow-y-auto">
        <div className="grid grid-cols-[64px_1fr]">
          <div>
            {HOURS.map(hour => (
              <div key={hour} className="h-16 border-b border-border/50 flex items-start justify-end pr-2">
                <span className="text-xs text-muted-foreground -mt-1.5 font-mono">{String(hour).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          <div className="relative border-l border-border/50">
            {HOURS.map(hour => (
              <div key={hour} className="h-16 border-b border-border/30" />
            ))}

            {/* Current time line */}
            {showNowLine && (
              <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: nowTop }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                <div className="flex-1 h-[2px] bg-red-500" />
              </div>
            )}

            {/* Events */}
            {timedEvents.map(event => {
              const pos = getEventPosition(event);
              if (!pos) return null;
              const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
              const color = event.color || typeInfo?.color || '#3b82f6';
              return (
                <div
                  key={event.id}
                  className="absolute left-1 right-2 rounded-lg px-3 py-1.5 cursor-pointer hover:brightness-110 transition-all z-10"
                  style={{
                    top: pos.top,
                    height: pos.height,
                    backgroundColor: color + '20',
                    borderLeft: `3px solid ${color}`,
                    backdropFilter: 'blur(4px)',
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

export default AgendaDayView;
