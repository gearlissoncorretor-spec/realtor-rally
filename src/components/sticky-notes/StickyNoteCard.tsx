import { useState, useRef } from 'react';
import { StickyNote } from '@/hooks/useStickyNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Minimize2, Maximize2, Pin, PinOff, Trash2, Pencil, Check, X, GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_MAP: Record<string, { bg: string; border: string; shadow: string }> = {
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700', shadow: 'shadow-yellow-200/50 dark:shadow-yellow-900/30' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', shadow: 'shadow-blue-200/50 dark:shadow-blue-900/30' },
  green: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', shadow: 'shadow-emerald-200/50 dark:shadow-emerald-900/30' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700', shadow: 'shadow-pink-200/50 dark:shadow-pink-900/30' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700', shadow: 'shadow-purple-200/50 dark:shadow-purple-900/30' },
};

interface StickyNoteCardProps {
  note: StickyNote;
  onUpdate: (id: string, updates: Partial<StickyNote>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
}

export function StickyNoteCard({ note, onUpdate, onDelete, isDraggable }: StickyNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [editColor, setEditColor] = useState(note.color);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const colors = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const editColors = COLOR_MAP[editColor] || COLOR_MAP.yellow;

  const handleSave = () => {
    onUpdate(note.id, { title: editTitle, content: editContent, color: editColor });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
    setIsEditing(false);
  };

  // Drag handlers for global floating notes
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable || isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    const el = dragRef.current;
    if (!el) return;

    const startX = e.clientX - (note.position_x || 0);
    const startY = e.clientY - (note.position_y || 0);

    const onMouseMove = (ev: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 250, ev.clientX - startX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, ev.clientY - startY));
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    };

    const onMouseUp = (ev: MouseEvent) => {
      setIsDragging(false);
      const newX = Math.max(0, Math.min(window.innerWidth - 250, ev.clientX - startX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, ev.clientY - startY));
      onUpdate(note.id, { position_x: newX, position_y: newY });
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  if (note.is_minimized) {
    return (
      <div
        ref={dragRef}
        className={cn(
          'rounded-lg border-2 px-3 py-2 cursor-pointer transition-all animate-scale-in',
          colors.bg, colors.border,
          isDraggable && 'shadow-lg'
        )}
        style={isDraggable ? { position: 'fixed', left: note.position_x, top: note.position_y, zIndex: 9999, width: 200 } : undefined}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate text-foreground">{note.title || 'Sem título'}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
            onClick={(e) => { e.stopPropagation(); onUpdate(note.id, { is_minimized: false }); }}>
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        'rounded-xl border-2 transition-all animate-scale-in',
        isEditing ? editColors.bg : colors.bg,
        isEditing ? editColors.border : colors.border,
        isDraggable ? `shadow-xl ${colors.shadow}` : 'shadow-md',
        isDragging && 'opacity-80 scale-[1.02]',
      )}
      style={isDraggable ? { position: 'fixed', left: note.position_x, top: note.position_y, zIndex: 9999, width: 260 } : { width: '100%' }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1 gap-1">
        {isDraggable && !isEditing && (
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 cursor-grab shrink-0" />
        )}

        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Título..."
            className="h-7 text-xs font-semibold bg-transparent border-none shadow-none px-1 focus-visible:ring-0"
          />
        ) : (
          <span className="text-xs font-semibold text-foreground truncate flex-1">
            {note.title || 'Sem título'}
          </span>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
                <X className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => onUpdate(note.id, { is_pinned: !note.is_pinned })}>
                {note.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => onUpdate(note.id, { is_minimized: true })}>
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive"
                onClick={() => onDelete(note.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Color selector in edit mode */}
      {isEditing && (
        <div className="flex items-center gap-1.5 px-3 py-1">
          {Object.keys(COLOR_MAP).map((c) => (
            <button
              key={c}
              onClick={() => setEditColor(c)}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-all',
                COLOR_MAP[c].bg, COLOR_MAP[c].border,
                editColor === c ? 'ring-2 ring-primary scale-110' : 'opacity-70 hover:opacity-100'
              )}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-3 pb-3">
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Escreva sua nota..."
            className="text-xs bg-transparent border-none shadow-none resize-none p-1 min-h-[60px] focus-visible:ring-0"
            rows={4}
          />
        ) : (
          <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed min-h-[30px]">
            {note.content || 'Clique no lápis para editar...'}
          </p>
        )}
      </div>

      {/* Footer badge */}
      <div className="px-3 pb-2">
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-full',
          note.visibility_mode === 'global'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        )}>
          {note.visibility_mode === 'global' ? '🌐 Global' : '📅 Agenda'}
        </span>
      </div>
    </div>
  );
}
