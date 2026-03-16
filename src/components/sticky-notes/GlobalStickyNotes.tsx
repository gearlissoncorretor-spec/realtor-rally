import { useStickyNotes } from '@/hooks/useStickyNotes';
import { StickyNoteCard } from './StickyNoteCard';
import { useAuth } from '@/contexts/AuthContext';

export function GlobalStickyNotes() {
  const { user } = useAuth();
  const { notes, updateNote, deleteNote } = useStickyNotes('global');

  if (!user || notes.length === 0) return null;

  // Only show non-minimized notes that are global
  const visibleNotes = notes.filter(n => !n.is_minimized);
  const minimizedNotes = notes.filter(n => n.is_minimized);

  return (
    <>
      {visibleNotes.map((note) => (
        <StickyNoteCard
          key={note.id}
          note={note}
          onUpdate={(id, updates) => updateNote.mutate({ id, ...updates })}
          onDelete={(id) => deleteNote.mutate(id)}
          isDraggable
        />
      ))}
      {minimizedNotes.map((note) => (
        <StickyNoteCard
          key={note.id}
          note={note}
          onUpdate={(id, updates) => updateNote.mutate({ id, ...updates })}
          onDelete={(id) => deleteNote.mutate(id)}
          isDraggable
        />
      ))}
    </>
  );
}
