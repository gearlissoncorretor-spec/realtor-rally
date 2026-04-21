import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Settings, Check, X } from 'lucide-react';
import { useProcessStages, ProcessStage } from '@/hooks/useProcessStages';
import { cn } from '@/lib/utils';

interface StatusManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#eab308', label: 'Amarelo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
];

export function StatusManagerDialog({ open, onOpenChange }: StatusManagerDialogProps) {
  const { 
    stages, 
    createStage, 
    updateStage, 
    deleteStage 
  } = useProcessStages();
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [newStage, setNewStage] = useState({
    title: '',
    color: COLOR_OPTIONS[0].value,
  });

  const handleAddStage = async () => {
    if (!newStage.title.trim()) return;
    await createStage(newStage.title.trim(), newStage.color);
    setNewStage({ title: '', color: COLOR_OPTIONS[0].value });
    setIsAddingNew(false);
  };

  const handleUpdateStage = async (id: string, title: string) => {
    if (!title.trim()) return;
    await updateStage(id, { title: title.trim() });
    setEditingId(null);
  };

  const handleDeleteStage = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta etapa?')) {
      await deleteStage(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Estágios do Processo
          </DialogTitle>
          <DialogDescription>
            Personalize as etapas do funil de vendas e negociações. Estas etapas são compartilhadas entre o Pipeline de Vendas e o Funil de Negociações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isAddingNew && (
            <Button onClick={() => setIsAddingNew(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Nova Etapa
            </Button>
          )}

          {isAddingNew && (
            <Card className="border-dashed border-2 border-primary/30">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Etapa *</Label>
                  <Input
                    value={newStage.title}
                    onChange={(e) => setNewStage({ ...newStage, title: e.target.value })}
                    placeholder="Ex: Aguardando Documentos"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-transform",
                          newStage.color === color.value ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewStage({ ...newStage, color: color.value })}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddStage} disabled={!newStage.title.trim()}>
                    Adicionar Etapa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Etapas Atuais</h3>
            <div className="space-y-2">
              {stages.map((stage) => (
                <Card key={stage.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                        {editingId === stage.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input 
                              value={editingTitle} 
                              onChange={(e) => setEditingTitle(e.target.value)} 
                              className="h-8"
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateStage(stage.id, editingTitle)}
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateStage(stage.id, editingTitle)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">{stage.title}</span>
                        )}
                      </div>
                      
                      {!editingId && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setEditingId(stage.id); setEditingTitle(stage.title); }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!stage.is_default && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteStage(stage.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}