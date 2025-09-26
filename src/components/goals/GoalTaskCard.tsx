import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, AlertTriangle, Calendar, Trash2, Play, Pause } from 'lucide-react';
import { GoalTask } from '@/hooks/useGoals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalTaskCardProps {
  task: GoalTask;
  onUpdate: (id: string, updates: Partial<GoalTask>) => Promise<GoalTask>;
  onDelete: (id: string) => Promise<void>;
  canEdit: boolean;
}

export const GoalTaskCard: React.FC<GoalTaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  canEdit,
}) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <Pause className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getPriorityLabel = () => {
    switch (task.priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      default:
        return 'Baixa';
    }
  };

  const getTypeLabel = () => {
    switch (task.task_type) {
      case 'action':
        return 'Ação';
      case 'milestone':
        return 'Marco';
      case 'training':
        return 'Treinamento';
      case 'meeting':
        return 'Reunião';
      default:
        return task.task_type;
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const handleStatusChange = (newStatus: GoalTask['status']) => {
    const updates: Partial<GoalTask> = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    onUpdate(task.id, updates);
  };

  return (
    <Card className={`transition-all duration-200 ${
      task.status === 'completed' ? 'opacity-75' : ''
    } ${isOverdue ? 'border-red-500 border-l-4' : 'border-border/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <h4 className={`font-medium ${
                task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {getTypeLabel()}
                </Badge>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`} title={getPriorityLabel()} />
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground ml-7">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground ml-7">
              {task.due_date && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    {isOverdue && ' (Vencida)'}
                  </span>
                </div>
              )}
              
              {task.completed_at && (
                <div className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    Concluída em {format(new Date(task.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};