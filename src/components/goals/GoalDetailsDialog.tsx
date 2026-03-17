import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Calendar, TrendingUp, Plus, CheckCircle2, Clock, AlertTriangle, Zap } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { useGoalTasks } from '@/hooks/useGoalTasks';
import { GoalTaskCard } from './GoalTaskCard';
import { CreateTaskDialog } from './CreateTaskDialog';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatGoalValueCompact, getGoalPeriodLabel, getGoalTypeLabel } from '@/lib/goals';

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
  canEdit,
}) => {
  const { tasks, createTask, updateTask, deleteTask } = useGoalTasks(goal.id);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
  const isOverdue = new Date(goal.end_date) < new Date() && goal.status === 'active';
  const daysLeft = differenceInDays(new Date(goal.end_date), new Date());
  const remaining = Math.max(0, goal.target_value - goal.current_value);
  const dailyNeeded = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : null;

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');

  const progressColor = progress >= 90 ? 'text-emerald-500' : progress >= 50 ? 'text-amber-500' : 'text-red-500';
  const strokeColor = progress >= 90 ? 'stroke-emerald-500' : progress >= 50 ? 'stroke-amber-500' : 'stroke-red-500';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center border border-primary/20">
                <Target className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <span className="block">{goal.title}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {getGoalTypeLabel(goal.target_type)} · {getGoalPeriodLabel(goal.period_type)}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription>
              Acompanhe o progresso da meta e organize as tarefas relacionadas.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="overview" className="rounded-lg text-sm">Visão Geral</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg text-sm">
                Tarefas ({tasks.length})
                {urgentTasks.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs h-5 px-1.5">
                    {urgentTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/10 border border-border/50">
                <div className="relative w-36 h-36 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className="stroke-muted/20" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className={cn('transition-all duration-1000 ease-out', strokeColor)}
                      strokeDasharray={`${Math.min(progress, 100) * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn('text-3xl font-bold', progressColor)}>{Math.min(progress, 100).toFixed(0)}%</span>
                    <Badge variant={progress >= 100 ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-[10px] mt-1">
                      {goal.status === 'completed' ? 'Concluída' :
                        goal.status === 'paused' ? 'Pausada' :
                        isOverdue ? 'Vencida' : 'Ativa'}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                  <div className="bg-background/80 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Atual</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{formatGoalValueCompact(goal.current_value, goal.target_type)}</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Meta</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{formatGoalValueCompact(goal.target_value, goal.target_type)}</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Restante</p>
                    <p className={cn('text-lg font-bold mt-0.5', remaining <= 0 ? 'text-emerald-500' : 'text-foreground')}>
                      {remaining <= 0 ? '✅ Atingida' : formatGoalValueCompact(remaining, goal.target_type)}
                    </p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Prazo</p>
                    <p className={cn('text-lg font-bold mt-0.5', isOverdue ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-foreground')}>
                      {isOverdue ? 'Vencida' : `${daysLeft}d`}
                    </p>
                  </div>
                </div>
              </div>

              {dailyNeeded && goal.status === 'active' && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Para atingir a meta, é necessário <span className="font-bold">{formatGoalValueCompact(dailyNeeded, goal.target_type)}</span> por dia nos próximos <span className="font-bold">{daysLeft} dias</span>.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {goal.description && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Descrição</p>
                    <p className="text-sm text-foreground">{goal.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Início', value: format(new Date(goal.start_date), 'dd/MM/yyyy', { locale: ptBR }), icon: Calendar },
                    { label: 'Término', value: format(new Date(goal.end_date), 'dd/MM/yyyy', { locale: ptBR }), icon: Calendar },
                    { label: 'Tipo', value: getGoalTypeLabel(goal.target_type), icon: Target },
                    { label: 'Criada em', value: format(new Date(goal.created_at), 'dd/MM/yyyy', { locale: ptBR }), icon: Clock },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                        <item.icon className="w-3 h-3" />
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {tasks.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Concluídas', count: completedTasks.length, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
                    { label: 'Em Andamento', count: inProgressTasks.length, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Zap },
                    { label: 'Pendentes', count: pendingTasks.length, color: 'text-muted-foreground', bg: 'bg-muted/30', icon: Clock },
                    { label: 'Urgentes', count: urgentTasks.length, color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle },
                  ].map((item, i) => (
                    <div key={i} className={cn('p-3 rounded-xl border border-border/30 text-center', item.bg)}>
                      <item.icon className={cn('w-5 h-5 mx-auto mb-1', item.color)} />
                      <p className={cn('text-2xl font-bold', item.color)}>{item.count}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tarefas para Atingir a Meta</h3>
                {canEdit && (
                  <Button onClick={() => setShowCreateTask(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                )}
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4 border border-border/50">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma tarefa criada</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">Crie tarefas para ajudar a atingir esta meta.</p>
                  {canEdit && (
                    <Button onClick={() => setShowCreateTask(true)} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Tarefa
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {urgentTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h4 className="text-sm font-semibold text-red-500">Urgentes</h4>
                      </div>
                      {urgentTasks.map(task => (
                        <GoalTaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} canEdit={canEdit} />
                      ))}
                    </div>
                  )}
                  {inProgressTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <h4 className="text-sm font-semibold text-blue-500">Em Andamento</h4>
                      </div>
                      {inProgressTasks.map(task => (
                        <GoalTaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} canEdit={canEdit} />
                      ))}
                    </div>
                  )}
                  {pendingTasks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">Pendentes</h4>
                      {pendingTasks.map(task => (
                        <GoalTaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} canEdit={canEdit} />
                      ))}
                    </div>
                  )}
                  {completedTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-sm font-semibold text-emerald-500">Concluídas</h4>
                      </div>
                      {completedTasks.map(task => (
                        <GoalTaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} canEdit={canEdit} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showCreateTask && (
        <CreateTaskDialog
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          onCreate={createTask}
          goals={[goal]}
        />
      )}
    </>
  );
};
