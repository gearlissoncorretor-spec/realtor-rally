import React, { useMemo, useState } from 'react';
import { useAllGoalTasks } from '@/hooks/useAllGoalTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  Calendar,
  ListTodo
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import KPICard from '@/components/KPICard';
import { GoalTask } from '@/hooks/useGoals';

const TasksOverviewTab = () => {
  const { tasks, loading, updateTask } = useAllGoalTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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
    </div>
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
