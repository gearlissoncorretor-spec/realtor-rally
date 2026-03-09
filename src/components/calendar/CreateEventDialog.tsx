import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarEvent, CreateEventData, EVENT_TYPES } from '@/hooks/useCalendarEvents';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEventData) => void;
  isLoading?: boolean;
  defaultDate?: Date;
  editEvent?: CalendarEvent | null;
  onUpdate?: (data: Partial<CalendarEvent> & { id: string }) => void;
  onDelete?: (id: string) => void;
}

const CreateEventDialog = ({
  open, onOpenChange, onSubmit, isLoading, defaultDate, editEvent, onUpdate, onDelete,
}: CreateEventDialogProps) => {
  const isEditing = !!editEvent;

  const [title, setTitle] = useState(editEvent?.title || '');
  const [description, setDescription] = useState(editEvent?.description || '');
  const [eventDate, setEventDate] = useState(
    editEvent?.event_date || (defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
  );
  const [startTime, setStartTime] = useState(editEvent?.start_time?.slice(0, 5) || '09:00');
  const [endTime, setEndTime] = useState(editEvent?.end_time?.slice(0, 5) || '10:00');
  const [eventType, setEventType] = useState(editEvent?.event_type || 'reuniao');
  const [clientName, setClientName] = useState(editEvent?.client_name || '');
  const [propertyRef, setPropertyRef] = useState(editEvent?.property_reference || '');
  const [isPrivate, setIsPrivate] = useState(editEvent?.is_private || false);
  const [isAllDay, setIsAllDay] = useState(editEvent?.is_all_day || false);
  const [shareWithTeam, setShareWithTeam] = useState(false);

  // Reset form when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      setTitle(editEvent?.title || '');
      setDescription(editEvent?.description || '');
      setEventDate(editEvent?.event_date || (defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')));
      setStartTime(editEvent?.start_time?.slice(0, 5) || '09:00');
      setEndTime(editEvent?.end_time?.slice(0, 5) || '10:00');
      setEventType(editEvent?.event_type || 'reuniao');
      setClientName(editEvent?.client_name || '');
      setPropertyRef(editEvent?.property_reference || '');
      setIsPrivate(editEvent?.is_private || false);
      setIsAllDay(editEvent?.is_all_day || false);
      setShareWithTeam(false);
    }
  }, [open, editEvent, defaultDate]);

  const selectedType = EVENT_TYPES.find(t => t.value === eventType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && onUpdate) {
      onUpdate({
        id: editEvent!.id,
        title: title.trim(),
        description: description || null,
        event_date: eventDate,
        start_time: isAllDay ? null : startTime + ':00',
        end_time: isAllDay ? null : endTime + ':00',
        event_type: eventType,
        client_name: clientName || null,
        property_reference: propertyRef || null,
        is_private: isPrivate,
        is_all_day: isAllDay,
        color: selectedType?.color || '#3b82f6',
      });
    } else {
      onSubmit({
        title: title.trim(),
        description: description || undefined,
        event_date: eventDate,
        start_time: isAllDay ? undefined : startTime + ':00',
        end_time: isAllDay ? undefined : endTime + ':00',
        event_type: eventType,
        client_name: clientName || undefined,
        property_reference: propertyRef || undefined,
        is_private: isPrivate,
        is_all_day: isAllDay,
        color: selectedType?.color || '#3b82f6',
        share_with_team: shareWithTeam,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do evento" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event_date">Data *</Label>
              <Input id="event_date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="event_type">Tipo</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="all_day" checked={isAllDay} onCheckedChange={setIsAllDay} />
            <Label htmlFor="all_day">Dia inteiro</Label>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start_time">Início</Label>
                <Input id="start_time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end_time">Término</Label>
                <Input id="end_time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Observações..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Input id="client" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div>
              <Label htmlFor="property">Imóvel</Label>
              <Input id="property" value={propertyRef} onChange={e => setPropertyRef(e.target.value)} placeholder="Referência" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
              <Label htmlFor="private">Evento privado</Label>
            </div>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Switch id="share_team" checked={shareWithTeam} onCheckedChange={setShareWithTeam} />
                <Label htmlFor="share_team">Compartilhar com equipe</Label>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {isEditing && onDelete && (
              <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(editEvent!.id); onOpenChange(false); }}>
                Excluir
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
