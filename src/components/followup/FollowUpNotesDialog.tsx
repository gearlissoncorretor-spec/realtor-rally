import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFollowUpNotes } from "@/hooks/useFollowUpNotes";
import { Send, Trash2, StickyNote, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserAvatar } from "@/components/UserAvatar";

interface FollowUpNotesDialogProps {
  followUpId: string | null;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowUpNotesDialog({
  followUpId,
  clientName,
  open,
  onOpenChange,
}: FollowUpNotesDialogProps) {
  const { notes, loading, addNote, deleteNote } = useFollowUpNotes(followUpId);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim() || !followUpId) return;
    setSubmitting(true);
    try {
      await addNote({ followUpId, note: newNote.trim() });
      setNewNote("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            Notas — {clientName}
          </DialogTitle>
        </DialogHeader>

        {/* Add note */}
        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma nota... (Ctrl+Enter para enviar)"
            rows={2}
            className="resize-none flex-1"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newNote.trim() || submitting}
            className="self-end"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {/* Notes list */}
        <ScrollArea className="flex-1 max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma nota registrada
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="group relative rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserAvatar
                        name={note.profiles?.full_name || "Usuário"}
                        avatarUrl={note.profiles?.avatar_url}
                        size="sm"
                      />
                      <span className="font-medium text-foreground/80">
                        {note.profiles?.full_name || "Usuário"}
                      </span>
                      <span>•</span>
                      <span>
                        {format(parseISO(note.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
