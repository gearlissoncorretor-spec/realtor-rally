import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useBrokerNotes } from '@/hooks/useBrokerNotes';
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

interface BrokerKanbanCardProps {
  broker: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export const BrokerKanbanCard = ({ broker }: BrokerKanbanCardProps) => {
  const { notes, loading, createNote, updateNote, deleteNote } = useBrokerNotes(broker.id);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={broker.avatar_url} alt={broker.name} />
              <AvatarFallback>{getInitials(broker.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{broker.name}</h3>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Anotações ({notes.length})</span>
              {!isAddingNote && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingNote(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nova
                </Button>
              )}
            </div>

            {isAddingNote && (
              <div className="space-y-2">
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
              <ScrollArea className="h-[200px] pr-3">
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-muted rounded-md text-sm space-y-2"
                    >
                      {editingNoteId === note.id ? (
                        <>
                          <Textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            className="min-h-[60px] text-sm"
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
                          <p className="whitespace-pre-wrap">{note.note}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                                className="h-6 w-6 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteNoteId(note.id)}
                                className="h-6 w-6 p-0 text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
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
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma anotação ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
