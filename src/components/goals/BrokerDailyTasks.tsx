import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Plus,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoalTask } from '@/hooks/useGoals';

interface BrokerDailyTasksProps {
  tasks: GoalTask[];
  brokers: any[];
  selectedDate: Date;
  onUpdateTask: (id: string, updates: Partial<GoalTask>) => Promise<any>;
  onCreateTask?: () => void;
}

const BrokerDailyTasks: React.FC<BrokerDailyTasksProps> = ({
  tasks,
  brokers,
  selectedDate,
  onUpdateTask,
  onCreateTask
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [completedQuantity, setCompletedQuantity] = useState<number>(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);

  // Group tasks by broker
  const tasksByBroker = useMemo(() => {
    const grouped = new Map<string, GoalTask[]>();
    
    tasks.forEach(task => {
      if (!task.assigned_to) return;
      
      // Filter by selected date
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() !== selected.getTime()) return;
      }

      const existing = grouped.get(task.assigned_to) || [];
      grouped.set(task.assigned_to, [...existing, task]);
    });

    return grouped;
  }, [tasks, selected]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'ligacoes': 'Ligações',
      'atendimentos': 'Atendimentos',
      'visitas': 'Visitas',
      'propostas': 'Propostas',
      'fechamentos': 'Fechamentos',
      'prospeccao': 'Prospecção',
      'follow_up': 'Follow-up',
      'geral': 'Geral'
    };
    return labels[category] || category;
  };

  const handleSaveProgress = async (taskId: string) => {
    await onUpdateTask(taskId, {
      completed_quantity: completedQuantity,
      status: completedQuantity > 0 ? 'in_progress' : 'pending',
    });
    setEditingTaskId(null);
    setCompletedQuantity(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tarefas por Corretor</h2>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        {onCreateTask && (
          <Button onClick={onCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {tasksByBroker.size === 0 ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma tarefa para esta data
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione outra data ou crie novas tarefas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from(tasksByBroker.entries()).map(([brokerId, brokerTasks]) => {
            const broker = brokers.find(b => b.user_id === brokerId);
            if (!broker) return null;

            const totalTasks = brokerTasks.length;
            const completedTasks = brokerTasks.filter(t => t.status === 'completed').length;
            const totalTarget = brokerTasks.reduce((sum, t) => sum + (t.target_quantity || 0), 0);
            const totalCompleted = brokerTasks.reduce((sum, t) => sum + (t.completed_quantity || 0), 0);
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <Card key={brokerId} className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{broker.name}</h3>
                      <p className="text-sm text-muted-foreground font-normal">{broker.email}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Tarefas</p>
                      <p className="text-lg font-bold">{completedTasks}/{totalTasks}</p>
                      <Progress value={completionRate} className="h-1.5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className="text-lg font-bold">{totalCompleted}/{totalTarget}</p>
                      <Progress 
                        value={totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0} 
                        className="h-1.5" 
                      />
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    {brokerTasks.map(task => {
                      const isCompleted = task.status === 'completed';
                      const progress = task.target_quantity > 0 
                        ? (task.completed_quantity / task.target_quantity) * 100 
                        : 0;
                      const isEditing = editingTaskId === task.id;

                      return (
                        <div 
                          key={task.id} 
                          className={`p-3 border rounded-lg ${
                            isCompleted ? 'bg-success/5 border-success/20' : 'bg-background'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryLabel(task.task_category || 'geral')}
                                </Badge>
                                {isCompleted && (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                )}
                              </div>
                              <h4 className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                              )}
                            </div>
                          </div>

                          {task.target_quantity > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Meta: {task.target_quantity}</span>
                                <span className="font-medium">{progress.toFixed(0)}%</span>
                              </div>
                              <Progress value={Math.min(progress, 100)} className="h-1.5" />
                              
                              {!isCompleted && (
                                isEditing ? (
                                  <div className="flex gap-2 mt-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={task.target_quantity}
                                      placeholder="Quantidade realizada"
                                      value={completedQuantity}
                                      onChange={(e) => setCompletedQuantity(parseInt(e.target.value) || 0)}
                                      className="h-8 text-sm"
                                    />
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSaveProgress(task.id)}
                                      className="h-8"
                                    >
                                      Salvar
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => {
                                        setEditingTaskId(null);
                                        setCompletedQuantity(0);
                                      }}
                                      className="h-8"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full h-8 mt-2"
                                    onClick={() => {
                                      setEditingTaskId(task.id);
                                      setCompletedQuantity(task.completed_quantity);
                                    }}
                                  >
                                    <TrendingUp className="w-3 h-3 mr-2" />
                                    Registrar Progresso
                                  </Button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrokerDailyTasks;
