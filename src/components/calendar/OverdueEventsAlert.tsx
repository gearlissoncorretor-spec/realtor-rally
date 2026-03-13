import React, { useState } from 'react';
import { CalendarEvent, EVENT_TYPES } from '@/hooks/useCalendarEvents';
import { format, parseISO, isBefore, isToday, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface OverdueEventsAlertProps {
  events: CalendarEvent[];
  onConfirmEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

const OverdueEventsAlert = ({ events, onConfirmEvent, onDeleteEvent }: OverdueEventsAlertProps) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmingEvent, setConfirmingEvent] = useState<CalendarEvent | null>(null);
  const [confirmAction, setConfirmAction] = useState<'done' | 'delete' | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const today = startOfDay(new Date());

  // Filter overdue events: past date, not dismissed
  const overdueEvents = events.filter(e => {
    if (dismissedIds.has(e.id)) return false;
    if (e.id.startsWith('google-') || e.id.startsWith('birthday-')) return false;
    const eventDate = parseISO(e.event_date);
    return isBefore(eventDate, today) && !isToday(eventDate);
  });

  if (overdueEvents.length === 0) return null;

  const visibleEvents = expanded ? overdueEvents : overdueEvents.slice(0, 3);

  const handleAction = (event: CalendarEvent, action: 'done' | 'delete') => {
    setConfirmingEvent(event);
    setConfirmAction(action);
  };

  const executeAction = () => {
    if (!confirmingEvent || !confirmAction) return;
    if (confirmAction === 'done') {
      onConfirmEvent(confirmingEvent);
    } else {
      onDeleteEvent(confirmingEvent.id);
    }
    setDismissedIds(prev => new Set(prev).add(confirmingEvent.id));
    setConfirmingEvent(null);
    setConfirmAction(null);
  };

  const dismissEvent = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  return (
    <>
      <div className="rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Eventos Atrasados
            <span className="text-xs font-normal text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
              {overdueEvents.length}
            </span>
          </h2>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Estes eventos já passaram. Confirme se foram realizados ou remova-os da agenda.
        </p>

        <div className="space-y-2">
          {visibleEvents.map(event => {
            const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type);
            const color = event.color || typeInfo?.color || '#3b82f6';
            const eventDate = parseISO(event.event_date);
            const daysLate = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-card/50 hover:bg-card transition-all"
              >
                <div
                  className="w-1 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(eventDate, "dd/MM", { locale: ptBR })}
                      {event.start_time && ` às ${event.start_time.slice(0, 5)}`}
                    </span>
                    <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                      {daysLate} {daysLate === 1 ? 'dia' : 'dias'} atrasado
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => handleAction(event, 'done')}
                    title="Marcar como realizado"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleAction(event, 'delete')}
                    title="Remover evento"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {overdueEvents.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Mostrar menos <ChevronUp className="w-3 h-3 ml-1" /></>
            ) : (
              <>Ver mais {overdueEvents.length - 3} eventos <ChevronDown className="w-3 h-3 ml-1" /></>
            )}
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmingEvent} onOpenChange={() => { setConfirmingEvent(null); setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'done' ? 'Confirmar Realização' : 'Remover Evento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'done' ? (
                <>
                  Confirma que o evento <strong>"{confirmingEvent?.title}"</strong> foi realizado?
                  Ele será marcado como concluído.
                </>
              ) : (
                <>
                  Deseja remover o evento <strong>"{confirmingEvent?.title}"</strong> da agenda?
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={cn(
                confirmAction === 'done'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-destructive hover:bg-destructive/90'
              )}
            >
              {confirmAction === 'done' ? 'Sim, foi realizado' : 'Sim, remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OverdueEventsAlert;
