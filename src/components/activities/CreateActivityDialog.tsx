import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

interface CreateActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    task_name: string;
    category: string;
    meta_semanal: number;
    period_type: 'daily' | 'weekly' | 'monthly';
  }) => Promise<void>;
}

const CATEGORIES = [
  { value: 'captacao', label: 'Captação de Imóveis' },
  { value: 'atendimento', label: 'Atendimento ao Cliente' },
  { value: 'ligacao', label: 'Ligações' },
  { value: 'visita', label: 'Visitas' },
  { value: 'outro', label: 'Outro' },
];

const PERIOD_TYPES = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];

export const CreateActivityDialog: React.FC<CreateActivityDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    task_name: '',
    category: 'outro',
    meta_semanal: 10,
    period_type: 'weekly' as 'daily' | 'weekly' | 'monthly',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task_name.trim()) return;

    setLoading(true);
    try {
      await onCreate(formData);
      setFormData({
        task_name: '',
        category: 'outro',
        meta_semanal: 10,
        period_type: 'weekly',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Meta Diária';
      case 'weekly': return 'Meta Semanal';
      case 'monthly': return 'Meta Mensal';
      default: return 'Meta';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Nova Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task_name">Nome da Tarefa *</Label>
            <Input
              id="task_name"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              placeholder="Ex: Prospecção de clientes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period_type">Período</Label>
            <Select
              value={formData.period_type}
              onValueChange={(value) => setFormData({ ...formData, period_type: value as 'daily' | 'weekly' | 'monthly' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_TYPES.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_semanal">{getPeriodLabel(formData.period_type)} *</Label>
            <Input
              id="meta_semanal"
              type="number"
              min="1"
              value={formData.meta_semanal}
              onChange={(e) => setFormData({ ...formData, meta_semanal: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={loading || !formData.task_name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Tarefa
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
