import React, { useMemo, useState } from 'react';
import { useAllGoalTasks } from '@/hooks/useAllGoalTasks';
import { useGoals } from '@/hooks/useGoals';
import { useBrokers } from '@/hooks/useBrokers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  Calendar,
  ListTodo,
  CalendarIcon,
  Plus
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import KPICard from '@/components/KPICard';
import { GoalTask } from '@/hooks/useGoals';
import BrokerDailyTasks from './BrokerDailyTasks';
import { CreateTaskDialog } from './CreateTaskDialog';

const TasksOverviewTab = () => {
  const { tasks, loading, updateTask } = useAllGoalTasks();
  const { goals, createGoal } = useGoals();
  const { brokers } = useBrokers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'broker'>('broker');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedGoalForTask, setSelectedGoalForTask] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const todayTasks = useMemo(() => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });
  }, [filteredTasks, today]);

  const overdueTasks = useMemo(() => {
    return filteredTasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      const dueDate = new Date(task.due_date);
      return dueDate < today;
    });
  }, [filteredTasks, today]);

  const urgentTasks = useMemo(() => {
    return filteredTasks.filter(task => 
      task.priority === 'urgent' && task.status !== 'completed'
    );
  }, [filteredTasks]);

  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const totalTasks = filteredTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleToggleComplete = async (task: GoalTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updates: Partial<GoalTask> = {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    };
    
    await updateTask(task.id, updates);
  };

  const handleCreateTask = async (taskData: Partial<GoalTask>) => {
    if (!selectedGoalForTask) return;
    
    const selectedGoal = goals.find(g => g.id === selectedGoalForTask);
    if (!selectedGoal) return;

    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('goal_tasks')
      .insert([{
        goal_id: selectedGoalForTask,
        title: taskData.title,
        description: taskData.description,
        task_type: taskData.task_type,
        task_category: taskData.task_category,
        priority: taskData.priority,
        due_date: taskData.due_date,
        target_quantity: taskData.target_quantity || 0,
        completed_quantity: taskData.completed_quantity || 0,
        status: 'pending',
        assigned_to: selectedGoal.assigned_to || selectedGoal.broker_id,
      }])
      .select()
      .single();

    if (error) throw error;
    
    window.location.reload();
    
    return data;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle and Create Button */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'broker' ? 'default' : 'outline'}
                onClick={() => setViewMode('broker')}
              >
                Por Corretor
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
              >
                Todas as Tarefas
              </Button>
            </div>

            <div className="flex gap-2 items-center">
              {viewMode === 'broker' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              
              <SelectGoalAndCreateTask
                goals={goals}
                onSelectGoal={(goalId) => {
                  setSelectedGoalForTask(goalId);
                  setCreateTaskOpen(true);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'broker' ? (
        <BrokerDailyTasks
          tasks={tasks}
          brokers={brokers}
          selectedDate={selectedDate}
          onUpdateTask={updateTask}
        />
      ) : (
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Tarefas"
          value={totalTasks.toString()}
          icon={<ListTodo className="w-6 h-6 text-primary" />}
          trend="neutral"
        />
        <KPICard
          title="Taxa de Conclusão"
          value={`${completionRate.toFixed(0)}%`}
          icon={<CheckCircle2 className="w-6 h-6 text-success" />}
          trend={completionRate >= 70 ? "up" : completionRate >= 40 ? "neutral" : "down"}
        />
        <KPICard
          title="Tarefas Atrasadas"
          value={overdueTasks.length.toString()}
          icon={<AlertCircle className="w-6 h-6 text-destructive" />}
          trend={overdueTasks.length > 0 ? "down" : "up"}
        />
        <KPICard
          title="Tarefas Urgentes"
          value={urgentTasks.length.toString()}
          icon={<Clock className="w-6 h-6 text-warning" />}
          trend="neutral"
        />
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-md border bg-background text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluída</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 rounded-md border bg-background text-sm"
              >
                <option value="all">Todas Prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card className="bg-gradient-card border-primary/50 shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Tarefas de Hoje
              <Badge variant="default">{todayTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={handleToggleComplete}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  getPriorityLabel={getPriorityLabel}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="bg-gradient-card border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Tarefas Atrasadas
              <Badge variant="destructive">{overdueTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={handleToggleComplete}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  getPriorityLabel={getPriorityLabel}
                  getStatusLabel={getStatusLabel}
                  isOverdue
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tasks */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            Todas as Tarefas
            <Badge variant="secondary">{filteredTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tarefa encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={handleToggleComplete}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  getPriorityLabel={getPriorityLabel}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {/* Create Task Dialog */}
      {selectedGoalForTask && (
        <CreateTaskDialog
          open={createTaskOpen}
          onOpenChange={setCreateTaskOpen}
          onCreate={handleCreateTask}
          goalTitle={goals.find(g => g.id === selectedGoalForTask)?.title || ''}
          brokerId={goals.find(g => g.id === selectedGoalForTask)?.broker_id}
        />
      )}
    </div>
  );
};

// Component to select goal before creating task
const SelectGoalAndCreateTask = ({ 
  goals, 
  onSelectGoal 
}: { 
  goals: any[], 
  onSelectGoal: (goalId: string) => void 
}) => {
  const [open, setOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const activeGoals = goals.filter(g => g.status === 'active');

  const handleCreate = () => {
    if (selectedGoalId) {
      onSelectGoal(selectedGoalId);
      setOpen(false);
      setSelectedGoalId('');
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Nova Tarefa
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Selecione a Meta</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Escolha a meta para adicionar a tarefa
              </p>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
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
            <Button 
              onClick={handleCreate} 
              disabled={!selectedGoalId}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

interface TaskCardProps {
  task: GoalTask;
  onToggleComplete: (task: GoalTask) => void;
  getPriorityColor: (priority: string) => any;
  getStatusColor: (status: string) => any;
  getPriorityLabel: (priority: string) => string;
  getStatusLabel: (status: string) => string;
  isOverdue?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onToggleComplete, 
  getPriorityColor, 
  getStatusColor,
  getPriorityLabel,
  getStatusLabel,
  isOverdue 
}) => {
  return (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-all ${
      isOverdue ? 'border-destructive/50 bg-destructive/5' : ''
    }`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.status === 'completed'}
          onCheckedChange={() => onToggleComplete(task)}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold ${
              task.status === 'completed' ? 'line-through text-muted-foreground' : ''
            }`}>
              {task.title}
            </h3>
            <div className="flex gap-2 flex-shrink-0">
              <Badge variant={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
              <Badge variant={getStatusColor(task.status)}>
                {getStatusLabel(task.status)}
              </Badge>
            </div>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(task.due_date), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                Criada {formatDistanceToNow(new Date(task.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksOverviewTab;
