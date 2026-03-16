import { useState } from 'react';
import { useStickyNotes } from '@/hooks/useStickyNotes';
import { StickyNoteCard } from './StickyNoteCard';
import { CreateStickyNoteDialog } from './CreateStickyNoteDialog';
import { Button } from '@/components/ui/button';
import { StickyNote, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export function AgendaStickyNotes() {
  const { notes, createNote, updateNote, deleteNote } = useStickyNotes('agenda');
  const [showCreate, setShowCreate] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Also show global notes in agenda view
  const { notes: globalNotes } = useStickyNotes('global');
  const allNotes = [...notes, ...globalNotes.filter(n => !notes.find(a => a.id === n.id))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          <StickyNote className="w-4 h-4 text-yellow-500" />
          Notas Adesivas
          {allNotes.length > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {allNotes.length}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> Nova Nota
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2 animate-fade-in">
          {allNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center">
              Nenhuma nota adesiva. Crie uma!
            </p>
          ) : (
            allNotes.map((note) => (
              <StickyNoteCard
                key={note.id}
                note={note}
                onUpdate={(id, updates) => updateNote.mutate({ id, ...updates })}
                onDelete={(id) => deleteNote.mutate(id)}
              />
            ))
          )}
        </div>
      )}

      <CreateStickyNoteDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={(data) => {
          createNote.mutate(data);
          setShowCreate(false);
        }}
        isLoading={createNote.isPending}
      />
    </div>
  );
}
