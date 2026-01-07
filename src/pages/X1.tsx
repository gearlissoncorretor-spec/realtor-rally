import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Navigation from '@/components/Navigation';
import { useBrokers } from '@/hooks/useBrokers';
import { useBrokerNotes } from '@/hooks/useBrokerNotes';
import { useBrokerTasks } from '@/hooks/useBrokerTasks';
import { useProcessStages } from '@/hooks/useProcessStages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  User,
  MessageSquare,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

type KanbanStatus = 'agendar' | 'em_andamento' | 'concluido';

interface BrokerWithStatus {
  id: string;
  name: string;
  avatar_url?: string;
  kanban_status: KanbanStatus;
}

const columns = [
  { id: 'agendar', title: 'Agendar', color: 'bg-blue-500' },
  { id: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-500' },
  { id: 'concluido', title: 'Concluído', color: 'bg-green-500' },
] as const;

// Separate component for broker notes to avoid hooks in map
const BrokerNotesSection = ({ brokerId }: { brokerId: string }) => {
  const { notes, loading, createNote, updateNote, deleteNote } = useBrokerNotes(brokerId);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await createNote(newNote);
    setNewNote('');
    setIsAddingNote(false);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;
    await updateNote(noteId, editingNoteText);
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;
    await deleteNote(deleteNoteId);
    setDeleteNoteId(null);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Anotações ({notes.length})
          </span>
          {!isAddingNote && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingNote(true)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Nova
            </Button>
          )}
        </div>

        {isAddingNote && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Digite sua anotação..."
              className="min-h-[80px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNote} className="flex-1">
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-card border rounded-lg space-y-2"
                >
                  {editingNoteId === note.id ? (
                    <>
                      <Textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          className="flex-1"
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingNoteText('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{note.note}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>
                          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteText(note.note);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteNoteId(note.id)}
                            className="h-7 w-7 p-0 text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {!loading && notes.length === 0 && !isAddingNote && (
          <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-lg">
            Nenhuma anotação ainda. Clique em "Nova" para adicionar.
          </p>
        )}
      </div>

      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Broker Kanban Tasks Section
const BrokerKanbanSection = ({ brokerId, stages }: { brokerId: string; stages: any[] }) => {
  const { tasks } = useBrokerTasks();
  
  const brokerTasks = tasks.filter(t => t.broker_id === brokerId);
  
  if (stages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma etapa configurada.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {stages.map(stage => {
        const stageTasks = brokerTasks.filter(t => t.column_id === stage.id);
        
        return (
          <div key={stage.id} className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: stage.color }} 
              />
              <span className="text-sm font-medium">{stage.title}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {stageTasks.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {stageTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Sem tarefas
                </p>
              ) : (
                stageTasks.map(task => (
                  <div key={task.id} className="bg-card p-3 rounded-lg border text-sm">
                    <p className="font-medium">{task.title}</p>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(task.due_date), 'dd/MM', { locale: ptBR })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function X1() {
  const { brokers, loading } = useBrokers();
  const { stages } = useProcessStages();
  const [brokersWithStatus, setBrokersWithStatus] = useState<BrokerWithStatus[]>([]);
  const [expandedBrokerId, setExpandedBrokerId] = useState<string | null>(null);

  useEffect(() => {
    if (brokers) {
      setBrokersWithStatus(
        brokers.map(broker => ({
          id: broker.id,
          name: broker.name,
          avatar_url: broker.avatar_url || undefined,
          kanban_status: (broker.kanban_status as KanbanStatus) || 'agendar',
        }))
      );
    }
  }, [brokers]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as KanbanStatus;
    const brokerId = draggableId;

    // Update local state immediately for smooth UX
    setBrokersWithStatus(prev =>
      prev.map(broker =>
        broker.id === brokerId ? { ...broker, kanban_status: newStatus } : broker
      )
    );

    // Update in database
    try {
      const { error } = await supabase
        .from('brokers')
        .update({ kanban_status: newStatus })
        .eq('id', brokerId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'O status do corretor foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Error updating broker status:', error);
      
      // Revert local state on error
      setBrokersWithStatus(prev =>
        prev.map(broker =>
          broker.id === brokerId
            ? { ...broker, kanban_status: source.droppableId as KanbanStatus }
            : broker
        )
      );

      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do corretor.',
        variant: 'destructive',
      });
    }
  };

  const getBrokersForColumn = (columnId: string) => {
    return brokersWithStatus.filter(broker => broker.kanban_status === columnId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleExpanded = (brokerId: string) => {
    setExpandedBrokerId(prev => prev === brokerId ? null : brokerId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8">
          <div className="text-center py-12">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pl-72">
      <Navigation />
      
      <div className="lg:pt-0 pt-16 px-4 py-6 max-w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">X1 - Gestão de Corretores</h1>
          <p className="text-muted-foreground mt-1">
            Organize e acompanhe seus corretores. Clique em um corretor para ver detalhes.
          </p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map(column => {
              const columnBrokers = getBrokersForColumn(column.id);
              
              return (
                <div key={column.id} className="flex flex-col">
                  <Card className="mb-4">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                        <span>{column.title}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {columnBrokers.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 rounded-xl p-4 transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-accent/50 ring-2 ring-primary/20'
                            : 'bg-muted/20'
                        }`}
                        style={{ minHeight: '400px' }}
                      >
                        <div className="space-y-4">
                          {columnBrokers.map((broker, index) => (
                            <Draggable
                              key={broker.id}
                              draggableId={broker.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'opacity-70' : ''}
                                >
                                  <Collapsible
                                    open={expandedBrokerId === broker.id}
                                    onOpenChange={() => toggleExpanded(broker.id)}
                                  >
                                    <Card className="hover:shadow-lg transition-shadow">
                                      <CollapsibleTrigger asChild>
                                        <CardHeader className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12">
                                              <AvatarImage src={broker.avatar_url} alt={broker.name} />
                                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                {getInitials(broker.name)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <h3 className="font-semibold text-base truncate">{broker.name}</h3>
                                              <p className="text-xs text-muted-foreground">
                                                Clique para expandir
                                              </p>
                                            </div>
                                            {expandedBrokerId === broker.id ? (
                                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                            ) : (
                                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            )}
                                          </div>
                                        </CardHeader>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent>
                                        <CardContent className="pt-0 pb-4 px-4 space-y-6">
                                          {/* Notes Section */}
                                          <BrokerNotesSection brokerId={broker.id} />
                                          
                                          {/* Kanban Tasks Section */}
                                          <div className="pt-4 border-t">
                                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                              <CheckCircle2 className="w-4 h-4" />
                                              Tarefas do Corretor
                                            </h4>
                                            <BrokerKanbanSection brokerId={broker.id} stages={stages} />
                                          </div>
                                        </CardContent>
                                      </CollapsibleContent>
                                    </Card>
                                  </Collapsible>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                        {provided.placeholder}

                        {columnBrokers.length === 0 && (
                          <div className="text-center text-muted-foreground text-sm py-8">
                            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            Arraste corretores para cá
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}