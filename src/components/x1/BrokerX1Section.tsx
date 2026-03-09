import { useState } from 'react';
import { useBrokerNotes, BrokerNote } from '@/hooks/useBrokerNotes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Pencil, Trash2, MessageSquare, Calendar, FileAudio, Image as ImageIcon,
} from 'lucide-react';
import { format, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X1NoteForm } from './X1NoteForm';
import { X1AudioPlayer } from './X1AudioPlayer';

const groupNotesByDate = (notes: BrokerNote[]) => {
  const groups: Record<string, BrokerNote[]> = {};
  notes.forEach(note => {
    const dateKey = format(new Date(note.created_at), 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(note);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
};

interface BrokerX1SectionProps {
  brokerId: string;
  filterMonth: number;
  filterYear: number;
}

export const BrokerX1Section = ({ brokerId, filterMonth, filterYear }: BrokerX1SectionProps) => {
  const { notes, loading, createNote, updateNote, deleteNote } = useBrokerNotes(brokerId);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filter notes by period
  const filteredNotes = notes.filter(note => {
    const noteDate = new Date(note.created_at);
    if (filterMonth > 0 && filterYear > 0) {
      const start = startOfMonth(new Date(filterYear, filterMonth - 1));
      const end = endOfMonth(new Date(filterYear, filterMonth - 1));
      return isWithinInterval(noteDate, { start, end });
    }
    if (filterYear > 0) {
      const start = startOfYear(new Date(filterYear, 0));
      const end = endOfYear(new Date(filterYear, 0));
      return isWithinInterval(noteDate, { start, end });
    }
    return true;
  });

  const groupedNotes = groupNotesByDate(filteredNotes);

  const handleCreate = async (note: string, imageUrl: string | null, audioUrl: string | null) => {
    await createNote(note, imageUrl, audioUrl);
    setIsAddingNote(false);
  };

  const handleUpdate = async (noteId: string, note: string, imageUrl: string | null, audioUrl: string | null) => {
    await updateNote(noteId, note, imageUrl, audioUrl);
    setEditingNoteId(null);
  };

  const handleDelete = async () => {
    if (!deleteNoteId) return;
    await deleteNote(deleteNoteId);
    setDeleteNoteId(null);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Registros ({filteredNotes.length})
          </span>
          {!isAddingNote && (
            <Button size="sm" variant="outline" onClick={() => setIsAddingNote(true)} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Novo Registro
            </Button>
          )}
        </div>

        {isAddingNote && (
          <X1NoteForm onSave={handleCreate} onCancel={() => setIsAddingNote(false)} />
        )}

        {groupedNotes.length > 0 ? (
          <Accordion type="multiple" className="space-y-1">
            {groupedNotes.map(([dateKey, dateNotes]) => (
              <AccordionItem key={dateKey} value={dateKey} className="border rounded-lg px-1 bg-card">
                <AccordionTrigger className="py-2.5 px-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {format(new Date(dateKey + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {dateNotes.length} {dateNotes.length === 1 ? 'registro' : 'registros'}
                    </Badge>
                    {dateNotes.some(n => n.image_url) && <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                    {dateNotes.some(n => n.audio_url) && <FileAudio className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="space-y-3">
                    {dateNotes.map(note => (
                      <div key={note.id} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                        {editingNoteId === note.id ? (
                          <X1NoteForm
                            initialNote={note.note}
                            initialImageUrl={note.image_url}
                            initialAudioUrl={note.audio_url}
                            onSave={(text, img, aud) => handleUpdate(note.id, text, img, aud)}
                            onCancel={() => setEditingNoteId(null)}
                          />
                        ) : (
                          <>
                            {note.note && <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.note}</p>}
                            <div className="flex flex-wrap gap-2">
                              {note.image_url && (
                                <img src={note.image_url} alt="Anexo" className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(note.image_url)} />
                              )}
                              {note.audio_url && <X1AudioPlayer src={note.audio_url} />}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/30">
                              <span>{format(new Date(note.created_at), "HH:mm", { locale: ptBR })}</span>
                              <div className="flex gap-0.5">
                                <Button size="icon" variant="ghost" onClick={() => setEditingNoteId(note.id)} className="h-6 w-6">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setDeleteNoteId(note.id)} className="h-6 w-6 text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          !loading && !isAddingNote && (
            <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
              <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum registro encontrado</p>
              <p className="text-xs mt-1">Clique em "Novo Registro" para começar</p>
            </div>
          )
        )}
      </div>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Imagem</DialogTitle></DialogHeader>
          {previewImage && <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
