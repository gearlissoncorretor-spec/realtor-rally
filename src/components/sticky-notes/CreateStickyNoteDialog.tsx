import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Globe, CalendarDays } from 'lucide-react';
import { CreateStickyNote } from '@/hooks/useStickyNotes';

const COLORS = [
  { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-200 border-yellow-400' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-200 border-blue-400' },
  { value: 'green', label: 'Verde', class: 'bg-emerald-200 border-emerald-400' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-200 border-pink-400' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-200 border-purple-400' },
];

interface CreateStickyNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStickyNote) => void;
  isLoading?: boolean;
}

export function CreateStickyNoteDialog({ open, onOpenChange, onSubmit, isLoading }: CreateStickyNoteDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const [visibility, setVisibility] = useState<'global' | 'agenda'>('agenda');

  const handleSubmit = () => {
    onSubmit({ title, content, color, visibility_mode: visibility });
    setTitle('');
    setContent('');
    setColor('yellow');
    setVisibility('agenda');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📝 Nova Nota Adesiva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lembrete importante..."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua nota aqui..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    c.class,
                    color === c.value ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Visibilidade</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVisibility('agenda')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left',
                  visibility === 'agenda'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <CalendarDays className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">Agenda</p>
                  <p className="text-[10px] text-muted-foreground">Apenas na agenda</p>
                </div>
              </button>
              <button
                onClick={() => setVisibility('global')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left',
                  visibility === 'global'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Globe className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">Global</p>
                  <p className="text-[10px] text-muted-foreground">Em todas as telas</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              Criar Nota
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
