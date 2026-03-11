import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, RotateCcw, GripVertical, Settings } from 'lucide-react';
import { useFollowUpStatuses } from '@/hooks/useFollowUpStatuses';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLOR_OPTIONS = [
  { value: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Azul', preview: 'bg-blue-500' },
  { value: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Amarelo', preview: 'bg-yellow-500' },
  { value: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Verde', preview: 'bg-green-500' },
  { value: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Vermelho', preview: 'bg-red-500' },
  { value: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: 'Roxo', preview: 'bg-purple-500' },
  { value: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'Laranja', preview: 'bg-orange-500' },
  { value: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', label: 'Ciano', preview: 'bg-cyan-500' },
  { value: 'bg-pink-500/10 text-pink-500 border-pink-500/20', label: 'Rosa', preview: 'bg-pink-500' },
  { value: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: 'Cinza', preview: 'bg-gray-500' },
];

const ICON_OPTIONS = ['📞', '🟡', '🔴', '🟢', '📨', '🔍', '✅', '❌', '💰', '⏳', '📋', '🎯', '⚡', '🏠', '💼'];

export function FollowUpStatusManagerDialog({ open, onOpenChange }: Props) {
  const { statuses, addStatus, updateStatus, deactivateStatus, reactivateStatus, deleteStatus } = useFollowUpStatuses();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState({
    value: '',
    label: '',
    color: COLOR_OPTIONS[0].value,
    icon: '📋',
    order_index: 50,
    is_active: true,
    is_system: false,
  });

  const handleAddStatus = () => {
    if (!newStatus.label.trim()) return;
    const value = newStatus.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    addStatus({ ...newStatus, value: value || `custom_${Date.now()}` });
    setNewStatus({ value: '', label: '', color: COLOR_OPTIONS[0].value, icon: '📋', order_index: 50, is_active: true, is_system: false });
    setIsAddingNew(false);
  };

  const activeStatuses = statuses.filter(s => s.is_active);
  const inactiveStatuses = statuses.filter(s => !s.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Status de Follow-Up
          </DialogTitle>
          <DialogDescription>
            Personalize os status disponíveis para seus follow-ups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isAddingNew && (
            <Button onClick={() => setIsAddingNew(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Novo Status
            </Button>
          )}

          {isAddingNew && (
            <Card className="border-dashed border-2 border-primary/30">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Status *</Label>
                    <Input
                      value={newStatus.label}
                      onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                      placeholder="Ex: Aguardando Retorno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={newStatus.order_index}
                      onChange={(e) => setNewStatus({ ...newStatus, order_index: Number(e.target.value) })}
                      min={1} max={97}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <Select value={newStatus.color} onValueChange={(v) => setNewStatus({ ...newStatus, color: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", c.preview)} />
                              {c.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <Select value={newStatus.icon} onValueChange={(v) => setNewStatus({ ...newStatus, icon: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon} value={icon}><span className="text-lg">{icon}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>Cancelar</Button>
                  <Button onClick={handleAddStatus} disabled={!newStatus.label.trim()}>Adicionar Status</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Status Ativos</h3>
            <div className="space-y-2">
              {activeStatuses.sort((a, b) => a.order_index - b.order_index).map((status) => (
                <Card key={status.id} className={cn("transition-all", editingId === status.id && "ring-2 ring-primary")}>
                  <CardContent className="p-3">
                    {editingId === status.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nome</Label>
                            <Input value={status.label} onChange={(e) => updateStatus(status.id, { label: e.target.value })} disabled={status.is_system} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Ordem</Label>
                            <Input type="number" value={status.order_index} onChange={(e) => updateStatus(status.id, { order_index: Number(e.target.value) })} min={1} max={97} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Cor</Label>
                            <Select value={status.color} onValueChange={(v) => updateStatus(status.id, { color: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {COLOR_OPTIONS.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-3 h-3 rounded-full", c.preview)} />
                                      {c.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Ícone</Label>
                            <Select value={status.icon || '📋'} onValueChange={(v) => updateStatus(status.id, { icon: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ICON_OPTIONS.map((icon) => (
                                  <SelectItem key={icon} value={icon}><span className="text-lg">{icon}</span></SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setEditingId(null)}>Concluir Edição</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                          <span className="text-lg">{status.icon}</span>
                          <Badge variant="outline" className={status.color}>{status.label}</Badge>
                          {status.is_system && <Badge variant="secondary" className="text-[10px]">Sistema</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(status.id)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!status.is_system && (
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deactivateStatus(status.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {inactiveStatuses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Status Desativados</h3>
              <div className="space-y-2">
                {inactiveStatuses.map((status) => (
                  <Card key={status.id} className="opacity-60">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{status.icon}</span>
                          <Badge variant="outline" className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => reactivateStatus(status.id)} className="gap-1">
                            <RotateCcw className="h-3 w-3" /> Reativar
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteStatus(status.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
