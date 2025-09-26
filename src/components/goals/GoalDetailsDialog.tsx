import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Calendar, TrendingUp, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { useGoalTasks } from '@/hooks/useGoalTasks';
import { GoalTaskCard } from './GoalTaskCard';
import { CreateTaskDialog } from './CreateTaskDialog';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalDetailsDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Goal>) => Promise<Goal>;
  canEdit: boolean;
}

export const GoalDetailsDialog: React.FC<GoalDetailsDialogProps> = ({
  goal,
  open,
  onOpenChange,
  onUpdate,
  canEdit,
}) => {
  const { tasks, createTask, updateTask, deleteTask } = useGoalTasks(goal.id);
  const [showCreateTask, setShowCreateTask] = useState(false);
  
  const progress = (goal.current_value / goal.target_value) * 100;
  const isOverdue = new Date(goal.end_date) < new Date() && goal.status === 'active';
  
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');

  const formatValue = (value: number) => {
    switch (goal.target_type) {
      case 'revenue':
      case 'vgv':
      case 'commission':
        return formatCurrency(value);
      case 'sales_count':
        return formatNumber(value);
      default:
        return value.toString();
    }
  };

  const getTypeLabel = () => {
    switch (goal.target_type) {
      case 'sales_count':
        return 'Vendas';
      case 'revenue':
        return 'Receita';
      case 'vgv':
        return 'VGV';
      case 'commission':
        return 'Comissão';
      default:
        return goal.target_type;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-primary-foreground" />
              </div>
              {goal.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="tasks">
                Tarefas ({tasks.length})
                {urgentTasks.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {urgentTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Progress Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Progresso da Meta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {progress.toFixed(1)}%
                    </span>
                    <Badge variant={progress >= 100 ? "default" : isOverdue ? "destructive" : "secondary"}>
                      {goal.status === 'completed' ? 'Concluída' : 
                       goal.status === 'paused' ? 'Pausada' :
                       goal.status === 'cancelled' ? 'Cancelada' :
                       isOverdue ? 'Vencida' : 'Ativa'}
                    </Badge>
                  </div>
                  
                  <Progress value={Math.min(progress, 100)} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Atual:</span>
                      <span className="ml-2 font-medium">{formatValue(goal.current_value)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Meta:</span>
                      <span className="ml-2 font-medium">{formatValue(goal.target_value)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Restante:</span>
                      <span className="ml-2 font-medium">{formatValue(Math.max(0, goal.target_value - goal.current_value))}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="ml-2 font-medium">{getTypeLabel()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Informações da Meta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goal.description && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Descrição:</span>
                      <p className="mt-1 text-foreground">{goal.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(goal.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Término:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(goal.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Período:</span>
                      <span className="ml-2 font-medium">
                        {goal.period_type === 'monthly' ? 'Mensal' :
                         goal.period_type === 'quarterly' ? 'Trimestral' : 'Anual'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criada em:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(goal.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks Summary */}
              {tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo das Tarefas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
                        <div className="text-sm text-muted-foreground">Concluídas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{inProgressTasks.length}</div>
                        <div className="text-sm text-muted-foreground">Em Andamento</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">{pendingTasks.length}</div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{urgentTasks.length}</div>
                        <div className="text-sm text-muted-foreground">Urgentes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tarefas para Atingir a Meta</h3>
                {canEdit && (
                  <Button onClick={() => setShowCreateTask(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                )}
              </div>

              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Nenhuma tarefa criada
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Crie tarefas para ajudar a atingir esta meta.
                      </p>
                      {canEdit && (
                        <Button onClick={() => setShowCreateTask(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Primeira Tarefa
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Urgent Tasks */}
                  {urgentTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h4 className="font-medium text-red-500">Tarefas Urgentes</h4>
                      </div>
                      {urgentTasks.map(task => (
                        <GoalTaskCard
                          key={task.id}
                          task={task}
                          onUpdate={updateTask}
                          onDelete={deleteTask}
                          canEdit={canEdit}
                        />
                      ))}
                    </div>
                  )}

                  {/* In Progress Tasks */}
                  {inProgressTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <h4 className="font-medium text-blue-500">Em Andamento</h4>
                      </div>
                      {inProgressTasks.map(task => (
                        <GoalTaskCard
                          key={task.id}
                          task={task}
                          onUpdate={updateTask}
                          onDelete={deleteTask}
                          canEdit={canEdit}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pending Tasks */}
                  {pendingTasks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-muted-foreground">Pendentes</h4>
                      {pendingTasks.map(task => (
                        <GoalTaskCard
                          key={task.id}
                          task={task}
                          onUpdate={updateTask}
                          onDelete={deleteTask}
                          canEdit={canEdit}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {completedTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <h4 className="font-medium text-green-500">Concluídas</h4>
                      </div>
                      {completedTasks.map(task => (
                        <GoalTaskCard
                          key={task.id}
                          task={task}
                          onUpdate={updateTask}
                          onDelete={deleteTask}
                          canEdit={canEdit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      {showCreateTask && (
        <CreateTaskDialog
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          onCreate={createTask}
          goalTitle={goal.title}
        />
      )}
    </>
  );
};