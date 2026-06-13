import React, { useState, useMemo, useEffect } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ListChecks, Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, StickyNote as StickyNoteIcon, CalendarDays, Sparkles, Flame, CheckCircle2,
} from 'lucide-react';
import { useRoutineItems, RoutineItem } from '@/hooks/useRoutineItems';
import { useStickyNotes } from '@/hooks/useStickyNotes';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import GoogleCalendarConnect from '@/components/calendar/GoogleCalendarConnect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  high:   { label: 'Alta',   className: 'bg-red-500/10 text-red-500 border-red-500/30' },
  medium: { label: 'Média',  className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  low:    { label: 'Baixa',  className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
};

const NOTE_COLORS = ['#fef3c7', '#fce7f3', '#dbeafe', '#dcfce7', '#f3e8ff', '#fed7aa'];

const Rotina = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const { items, isLoading, progress, completedCount, create, toggle, remove } = useRoutineItems(dateStr);
  const { notes, createNote, updateNote, deleteNote } = useStickyNotes('global');
  const { events: calendarEvents } = useCalendarEvents(dateStr, dateStr);
  const { googleEvents, isConnected, exchangeCode } = useGoogleCalendar(dateStr, dateStr);

  // Handle Google OAuth callback if user lands here
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) exchangeCode(code);
  }, [exchangeCode]);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // New note dialog
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);

  const handleAddTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    create.mutate(
      {
        title,
        scheduled_date: dateStr,
        scheduled_time: newTime || null,
        priority: newPriority,
      },
      {
        onSuccess: () => {
          setNewTitle('');
          setNewTime('');
          setNewPriority('medium');
        },
      },
    );
  };

  const handleSaveNote = () => {
    const content = noteContent.trim();
    if (!content) {
      toast.error('Escreva algo na anotação');
      return;
    }
    createNote.mutate(
      {
        title: noteTitle.trim() || 'Anotação',
        content,
        color: noteColor,
        visibility_mode: 'global',
      },
      {
        onSuccess: () => {
          setNoteTitle('');
          setNoteContent('');
          setNoteColor(NOTE_COLORS[0]);
          setNoteOpen(false);
        },
      },
    );
  };

  // Merge calendar events (system + google) for the day
  const dayEvents = useMemo(() => {
    const sys = calendarEvents.map((e) => ({
      id: e.id,
      title: e.title,
      time: e.start_time?.slice(0, 5) || null,
      source: 'system' as const,
      color: e.color || 'hsl(var(--primary))',
    }));
    const goog = googleEvents.map((g) => {
      const time = g.start.includes('T') ? g.start.substring(11, 16) : null;
      return {
        id: `g-${g.id}`,
        title: g.summary,
        time,
        source: 'google' as const,
        color: '#4285F4',
      };
    });
    return [...sys, ...goog].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  }, [calendarEvents, googleEvents]);

  const navigate = (dir: 'prev' | 'next') =>
    setCurrentDate(dir === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));

  return (
    <div className="min-h-dvh bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-5 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-primary" />
                Minha Rotina
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Organize seu dia: anotações, checklist e agenda integrada
              </p>
            </div>
            <div className="flex items-center gap-2">
              <GoogleCalendarConnect startDate={dateStr} endDate={dateStr} />
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/50">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Date strip + progress */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-primary uppercase font-semibold leading-none">
                    {format(currentDate, 'MMM', { locale: ptBR })}
                  </span>
                  <span className="text-lg font-bold text-foreground leading-none">
                    {format(currentDate, 'dd')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} de {items.length} concluídos • {dayEvents.length} compromissos
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-md w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Progresso do dia
                  </span>
                  <span className="text-xs font-bold text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ROUTINE CHECKLIST */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" />
                  Checklist de Rotina
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Quick add */}
                <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <Input
                    placeholder="Nova tarefa da rotina..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full sm:w-28"
                  />
                  <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                    <SelectTrigger className="w-full sm:w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddTask}
                    disabled={!newTitle.trim() || create.isPending}
                    className="gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </Button>
                </div>

                {/* List */}
                {isLoading ? (
                  <div className="text-center text-sm text-muted-foreground py-8">Carregando...</div>
                ) : items.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Sem itens para hoje.</p>
                    <p className="text-xs text-muted-foreground/70">Adicione uma tarefa acima para começar.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <RoutineRow
                        key={item.id}
                        item={item}
                        onToggle={() => toggle.mutate(item)}
                        onDelete={() => remove.mutate(item.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RIGHT COLUMN: Agenda + Notes */}
            <div className="space-y-5">
              {/* Day Agenda */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Agenda do Dia
                  </CardTitle>
                  {isConnected && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/30 text-blue-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Google sync
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayEvents.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Nenhum compromisso hoje
                    </div>
                  ) : (
                    dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ backgroundColor: ev.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {ev.time || 'Dia inteiro'}
                            <span className="mx-1">•</span>
                            <span className="capitalize">{ev.source === 'google' ? 'Google' : 'Sistema'}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Sticky Notes */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <StickyNoteIcon className="w-5 h-5 text-primary" />
                    Bloco de Anotações
                  </CardTitle>
                  <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                        <Plus className="w-3.5 h-3.5" /> Nova
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova anotação</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input
                          placeholder="Título (opcional)"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                        />
                        <Textarea
                          placeholder="Escreva sua anotação..."
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          rows={5}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Cor:</span>
                          {NOTE_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNoteColor(c)}
                              className={cn(
                                'w-6 h-6 rounded-full border-2 transition-all',
                                noteColor === c ? 'border-foreground scale-110' : 'border-transparent',
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveNote} disabled={createNote.isPending}>Salvar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
                  {notes.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Nenhuma anotação ainda
                    </div>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-lg border border-border/40 group relative"
                        style={{ backgroundColor: n.color }}
                      >
                        {n.title && (
                          <p className="text-xs font-bold text-gray-900 mb-1">{n.title}</p>
                        )}
                        <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {n.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:bg-black/10 text-gray-700"
                          onClick={() => deleteNote.mutate(n.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const RoutineRow = ({
  item,
  onToggle,
  onDelete,
}: {
  item: RoutineItem;
  onToggle: () => void;
  onDelete: () => void;
}) => {
  const prio = PRIORITY_META[item.priority];
  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border border-border/40 transition-all',
        item.completed ? 'bg-muted/20 opacity-60' : 'bg-card hover:border-primary/40 hover:shadow-sm',
      )}
    >
      <Checkbox checked={item.completed} onCheckedChange={onToggle} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium text-foreground truncate',
            item.completed && 'line-through text-muted-foreground',
          )}
        >
          {item.title}
        </p>
        {(item.scheduled_time || item.description) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            {item.scheduled_time && (
              <>
                <Clock className="w-3 h-3" /> {item.scheduled_time.slice(0, 5)}
              </>
            )}
            {item.description && <span className="truncate">• {item.description}</span>}
          </p>
        )}
      </div>
      <Badge variant="outline" className={cn('text-[10px] shrink-0', prio.className)}>
        {prio.label}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default Rotina;
