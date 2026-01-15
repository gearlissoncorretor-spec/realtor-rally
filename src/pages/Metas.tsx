import React, { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useAllGoalTasks } from '@/hooks/useAllGoalTasks';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users, 
  Plus, 
  ListTodo, 
  Pencil, 
  Trash2, 
  Calendar,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';
import TasksOverviewTab from '@/components/goals/TasksOverviewTab';
import { MetasSkeleton } from '@/components/skeletons/MetasSkeleton';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Metas = () => {
  const { getUserRole, profile, user, isCorretor, isGerente, isDiretor, isAdmin } = useAuth();
  const { goals, loading: goalsLoading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { teams, loading: teamsLoading } = useTeams();
  const { tasks: allTasks } = useAllGoalTasks();
  
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  
  const rawRole = getUserRole();
  const userRole = rawRole === 'admin' ? 'diretor' : rawRole;
  const canManageGoals = ['diretor', 'gerente'].includes(userRole);

  // Get current user's broker record (if they are a broker)
  const currentBroker = brokers.find(b => b.user_id === user?.id);
  
  // Get the user's team_id - either from profile (for managers) or from broker record
  const userTeamId = profile?.team_id || currentBroker?.team_id;

  // Calculate urgent/today tasks count for badge
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const urgentTasksCount = allTasks.filter(task => {
    if (task.status === 'completed') return false;
    if (task.priority === 'urgent') return true;
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  }).length;

  // Filter brokers based on role
  const accessibleBrokers = useMemo(() => {
    if (isDiretor() || isAdmin()) {
      return brokers;
    }
    if (isGerente() && userTeamId) {
      return brokers.filter(b => b.team_id === userTeamId);
    }
    if (isCorretor() && currentBroker) {
      return [currentBroker];
    }
    return [];
  }, [brokers, currentBroker, userTeamId, isCorretor, isGerente, isDiretor, isAdmin]);

  // Initialize selected broker
  useEffect(() => {
    if (accessibleBrokers.length > 0 && !selectedBrokerId) {
      setSelectedBrokerId(accessibleBrokers[0].id);
    }
  }, [accessibleBrokers, selectedBrokerId]);

  // Navigate to previous/next month
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    const currentMonth = new Date();
    currentMonth.setDate(1);
    if (nextMonth <= addMonths(currentMonth, 12)) {
      setSelectedMonth(nextMonth);
    }
  };

  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  // Filter goals for selected broker and period
  const filteredGoals = useMemo(() => {
    if (!selectedBrokerId) return [];
    
    return goals.filter(goal => {
      // Filter by broker
      const matchesBroker = goal.broker_id === selectedBrokerId;
      
      // Filter by period (goals that overlap with selected month)
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const goalStart = new Date(goal.start_date);
      const goalEnd = new Date(goal.end_date);
      
      const overlapsMonth = goalStart <= monthEnd && goalEnd >= monthStart;
      
      return matchesBroker && overlapsMonth;
    });
  }, [goals, selectedBrokerId, selectedMonth]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const active = filteredGoals.filter(g => g.status === 'active').length;
    const completed = filteredGoals.filter(g => g.status === 'completed').length;
    const overdue = filteredGoals.filter(g => 
      new Date(g.end_date) < new Date() && g.status === 'active'
    ).length;
    const avgProgress = filteredGoals.length > 0 
      ? filteredGoals.reduce((acc, g) => acc + Math.min((g.current_value / g.target_value) * 100, 100), 0) / filteredGoals.length
      : 0;
    
    return { active, completed, overdue, avgProgress };
  }, [filteredGoals]);

  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null;
  const selectedBroker = accessibleBrokers.find(b => b.id === selectedBrokerId);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedGoalId(goal.id);
  };

  const handleDelete = async () => {
    if (!deleteGoalId) return;
    try {
      await deleteGoal(deleteGoalId);
      setDeleteGoalId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sales_count': return 'Vendas';
      case 'revenue': return 'Receita';
      case 'vgv': return 'VGV';
      case 'commission': return 'Comissão';
      default: return type;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'yearly': return 'Anual';
      default: return period;
    }
  };

  const getStatusBadge = (goal: Goal) => {
    const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
    const isOverdue = new Date(goal.end_date) < new Date() && goal.status === 'active';
    
    if (goal.status === 'completed') {
      return <Badge className="bg-green-500">Concluída</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Vencida</Badge>;
    }
    if (progress >= 90) {
      return <Badge className="bg-green-500">Quase lá!</Badge>;
    }
    if (progress >= 50) {
      return <Badge className="bg-yellow-500 text-black">Em progresso</Badge>;
    }
    return <Badge variant="secondary">Iniciando</Badge>;
  };

  const getProgress = (goal: Goal) => {
    if (goal.target_value === 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-emerald-500";
    if (progress >= 75) return "bg-emerald-400";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-400";
  };

  if (goalsLoading || brokersLoading || teamsLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 lg:ml-72">
          <div className="max-w-7xl mx-auto p-6 space-y-6 pt-20 lg:pt-6">
            <MetasSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 lg:ml-72">
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 pt-20 lg:pt-6">
          {/* Header with Month Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                🎯 Gestão de Metas
              </h1>
            </div>
            
            {/* Month Selector */}
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 rounded-xl p-2 shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-[150px] justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-600">
                  {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="metas" className="w-full">
            <TabsList className="inline-flex h-11 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 shadow-lg rounded-xl p-1.5">
              <TabsTrigger value="metas" className="gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Target className="w-4 h-4" />
                Metas
              </TabsTrigger>
              <TabsTrigger value="tarefas" className="gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <ListTodo className="w-4 h-4" />
                Tarefas
                {urgentTasksCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {urgentTasksCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metas" className="space-y-6 mt-6">
              {/* Broker Tabs */}
              {accessibleBrokers.length > 0 ? (
                <Tabs value={selectedBrokerId} onValueChange={setSelectedBrokerId} className="w-full">
                  <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                    <TabsList className="inline-flex h-12 sm:h-14 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 shadow-lg rounded-xl p-1.5 gap-1 min-w-max">
                      {accessibleBrokers.map((broker) => (
                        <TabsTrigger
                          key={broker.id}
                          value={broker.id}
                          className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-emerald-100 dark:data-[state=inactive]:hover:bg-emerald-900/30 whitespace-nowrap"
                        >
                          {broker.name.split(' ')[0]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {accessibleBrokers.map((broker) => (
                    <TabsContent key={broker.id} value={broker.id} className="mt-4 space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <Target className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Ativas</p>
                                <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Concluídas</p>
                                <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <Calendar className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Vencidas</p>
                                <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Progresso Médio</p>
                                <p className="text-xl font-bold text-blue-600">{stats.avgProgress.toFixed(0)}%</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Goals Cards */}
                      {filteredGoals.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredGoals.map((goal) => {
                            const progress = getProgress(goal);
                            const progressColor = progress >= 100 ? 'text-emerald-600' : progress >= 50 ? 'text-yellow-600' : 'text-red-500';
                            
                            return (
                              <Card 
                                key={goal.id} 
                                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                                onClick={() => setSelectedGoalId(goal.id)}
                              >
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-foreground line-clamp-1">{goal.title}</h3>
                                      <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
                                    </div>
                                    {getStatusBadge(goal)}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{getTypeLabel(goal.target_type)}</Badge>
                                    <Badge variant="outline">{getPeriodLabel(goal.period_type)}</Badge>
                                  </div>
                                  
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm text-muted-foreground">Progresso</span>
                                      <span className={`text-sm font-bold ${progressColor}`}>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">
                                      {formatValue(goal.current_value, goal.target_type)} / {formatValue(goal.target_value, goal.target_type)}
                                    </span>
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(goal.end_date), 'dd/MM', { locale: ptBR })}
                                    </span>
                                  </div>
                                  
                                  {canManageGoals && (
                                    <div className="flex justify-end gap-1 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(goal)}
                                        className="h-8 text-muted-foreground hover:text-emerald-600"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-red-500 hover:text-red-600"
                                        onClick={() => setDeleteGoalId(goal.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* Goals Table */}
                      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-600" />
                            Metas de {broker.name}
                          </CardTitle>
                          {canManageGoals && (
                            <Button 
                              onClick={() => setCreateDialogOpen(true)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md w-full sm:w-auto"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Nova Meta
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6 sm:pt-0">
                          {filteredGoals.length === 0 ? (
                            <div className="text-center py-12">
                              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                              <p className="text-muted-foreground">Nenhuma meta encontrada para este período.</p>
                              {canManageGoals && (
                                <Button 
                                  onClick={() => setCreateDialogOpen(true)} 
                                  variant="outline" 
                                  className="mt-4"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Criar primeira meta
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-emerald-200/50 dark:border-emerald-800/50">
                                    <TableHead>Título</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead>Progresso</TableHead>
                                    <TableHead>Meta</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Prazo</TableHead>
                                    {canManageGoals && <TableHead className="text-right">Ações</TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredGoals.map(goal => {
                                    const progress = getProgress(goal);
                                    
                                    return (
                                      <TableRow 
                                        key={goal.id} 
                                        className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                                        onClick={() => setSelectedGoalId(goal.id)}
                                      >
                                        <TableCell className="font-medium">
                                          {goal.title}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="secondary">{getTypeLabel(goal.target_type)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline">{getPeriodLabel(goal.period_type)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="w-32">
                                            <div className="flex justify-between text-xs mb-1">
                                              <span>{formatValue(goal.current_value, goal.target_type)}</span>
                                              <span className="font-bold">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                              <div
                                                className={`h-full rounded-full ${getProgressColor(progress)}`}
                                                style={{ width: `${progress}%` }}
                                              />
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                          {formatValue(goal.target_value, goal.target_type)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(goal)}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(goal.end_date), 'dd/MM/yy', { locale: ptBR })}
                                          </div>
                                        </TableCell>
                                        {canManageGoals && (
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEdit(goal)}
                                                title="Editar"
                                              >
                                                <Pencil className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeleteGoalId(goal.id)}
                                                title="Excluir"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Nenhum corretor encontrado.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tarefas" className="mt-6">
              <TasksOverviewTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create/Edit Goal Dialog */}
      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createGoal}
      />
      
      {/* Goal Details Dialog */}
      {selectedGoal && (
        <GoalDetailsDialog
          goal={selectedGoal}
          open={!!selectedGoalId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedGoalId(null);
              setEditingGoal(null);
            }
          }}
          onUpdate={updateGoal}
          canEdit={canManageGoals}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
              Todas as tarefas associadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Metas;
