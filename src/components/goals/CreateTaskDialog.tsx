import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GoalTask } from '@/hooks/useGoals';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (task: Partial<GoalTask>) => Promise<GoalTask>;
  goals: any[];
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  goals
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    goal_id: '',
    title: '',
    description: '',
    task_type: 'action' as GoalTask['task_type'],
    task_category: 'geral',
    priority: 'medium' as GoalTask['priority'],
    due_date: null as Date | null,
    target_quantity: 0,
    completed_quantity: 0,
  });

  const activeGoals = goals.filter(g => g.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.goal_id) return;

    setLoading(true);
    try {
      await onCreate({
        goal_id: formData.goal_id,
        title: formData.title,
        description: formData.description || undefined,
        task_type: formData.task_type,
        task_category: formData.task_category,
        priority: formData.priority,
        due_date: formData.due_date?.toISOString().split('T')[0],
        target_quantity: formData.target_quantity,
        completed_quantity: formData.completed_quantity,
      });

      // Reset form
      setFormData({
        goal_id: '',
        title: '',
        description: '',
        task_type: 'action',
        task_category: 'geral',
        priority: 'medium',
        due_date: null,
        target_quantity: 0,
        completed_quantity: 0,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adicione uma nova tarefa a uma meta ativa
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="goal_id">Meta *</Label>
            <Select
              value={formData.goal_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, goal_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma meta ativa" />
              </SelectTrigger>
              <SelectContent>
                {activeGoals.map(goal => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Título da Tarefa *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Fazer 10 ligações de prospecção"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task_category">Categoria da Tarefa</Label>
              <Select 
                value={formData.task_category} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, task_category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="ligacoes">Ligações</SelectItem>
                  <SelectItem value="atendimentos">Atendimentos</SelectItem>
                  <SelectItem value="visitas">Visitas</SelectItem>
                  <SelectItem value="propostas">Propostas</SelectItem>
                  <SelectItem value="fechamentos">Fechamentos</SelectItem>
                  <SelectItem value="prospeccao">Prospecção</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_quantity">Meta de Quantidade</Label>
              <Input
                id="target_quantity"
                type="number"
                min="0"
                value={formData.target_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, target_quantity: parseInt(e.target.value) || 0 }))}
                placeholder="Ex: 10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task_type">Tipo de Tarefa</Label>
              <Select 
                value={formData.task_type} 
                onValueChange={(value: GoalTask['task_type']) => 
                  setFormData(prev => ({ ...prev, task_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="action">Ação</SelectItem>
                  <SelectItem value="milestone">Marco</SelectItem>
                  <SelectItem value="training">Treinamento</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: GoalTask['priority']) => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data (opcional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date || null }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
