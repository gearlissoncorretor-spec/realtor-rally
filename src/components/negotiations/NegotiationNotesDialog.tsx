import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquarePlus, Trash2, Send, StickyNote } from 'lucide-react';
import { useNegotiationNotes } from '@/hooks/useNegotiationNotes';
import { Negotiation } from '@/hooks/useNegotiations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NegotiationNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: Negotiation | null;
}

export function NegotiationNotesDialog({ open, onOpenChange, negotiation }: NegotiationNotesDialogProps) {
  const { notes, loading, addNote, deleteNote } = useNegotiationNotes(negotiation?.id || null);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim() || !negotiation) return;
    setSubmitting(true);
    try {
      await addNote({ negotiationId: negotiation.id, note: newNote.trim() });
      setNewNote('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddNote();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Notas da Negociação
          </DialogTitle>
          <DialogDescription>
            {negotiation?.client_name} — Registre observações e atualizações
          </DialogDescription>
        </DialogHeader>

        {/* Add Note */}
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma nota... (Ctrl+Enter para enviar)"
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleAddNote} 
              disabled={!newNote.trim() || submitting}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Adicionar Nota
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquarePlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma nota registrada</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione a primeira nota acima</p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {notes.map((note) => (
                <div key={note.id} className="group relative p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={note.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {note.profiles?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-foreground">
                          {note.profiles?.full_name || 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(note.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-wrap text-foreground/90">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
