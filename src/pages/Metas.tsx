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
  Clock,
  AlertTriangle
} from 'lucide-react';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';
import TasksOverviewTab from '@/components/goals/TasksOverviewTab';
import { MetasSkeleton } from '@/components/skeletons/MetasSkeleton';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, differenceInDays } from 'date-fns';
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
  const { goals, loading: goalsLoading, createGoal, updateGoal, deleteGoal, canEditGoal, canDeleteGoal } = useGoals();
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

  const currentBroker = brokers.find(b => b.user_id === user?.id);
  const userTeamId = profile?.team_id || currentBroker?.team_id;

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

  const accessibleBrokers = useMemo(() => {
    if (isDiretor() || isAdmin()) return brokers;
    if (isGerente() && userTeamId) return brokers.filter(b => b.team_id === userTeamId);
    if (isCorretor() && currentBroker) return [currentBroker];
    return [];
  }, [brokers, currentBroker, userTeamId, isCorretor, isGerente, isDiretor, isAdmin]);

  useEffect(() => {
    if (accessibleBrokers.length > 0 && !selectedBrokerId) {
      setSelectedBrokerId(accessibleBrokers[0].id);
    }
  }, [accessibleBrokers, selectedBrokerId]);

  const goToPreviousMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= addMonths(new Date(), 12)) setSelectedMonth(nextMonth);
  };

  const filteredGoals = useMemo(() => {
    if (!selectedBrokerId) return [];
    const selectedBrokerData = accessibleBrokers.find(b => b.id === selectedBrokerId);
    return goals.filter(goal => {
      const matchesBroker = goal.broker_id === selectedBrokerId || 
        (!goal.broker_id && goal.team_id === selectedBrokerData?.team_id);
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const goalStart = new Date(goal.start_date);
      const goalEnd = new Date(goal.end_date);
      return matchesBroker && goalStart <= monthEnd && goalEnd >= monthStart;
    });
  }, [goals, selectedBrokerId, selectedMonth, accessibleBrokers]);

  const stats = useMemo(() => {
    const active = filteredGoals.filter(g => g.status === 'active').length;
    const completed = filteredGoals.filter(g => g.status === 'completed').length;
    const overdue = filteredGoals.filter(g => 
      new Date(g.end_date) < new Date() && g.status === 'active'
    ).length;
    const avgProgress = filteredGoals.length > 0 
      ? filteredGoals.reduce((acc, g) => acc + Math.min((g.current_value / g.target_value) * 100, 100), 0) / filteredGoals.length
      : 0;
    return { active, completed, overdue, avgProgress, total: filteredGoals.length };
  }, [filteredGoals]);

  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null;
  const selectedBroker = accessibleBrokers.find(b => b.id === selectedBrokerId);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedGoalId(goal.id);
  };

  const handleDelete = async () => {
    if (!deleteGoalId) return;
    try { await deleteGoal(deleteGoalId); setDeleteGoalId(null); } catch {}
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'revenue': case 'vgv': case 'commission': return formatCurrency(value);
      case 'sales_count': return formatNumber(value);
      default: return value.toString();
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

  const getProgress = (goal: Goal) => {
    if (goal.target_value === 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const getStatusInfo = (goal: Goal) => {
    const progress = getProgress(goal);
    const isOverdue = new Date(goal.end_date) < new Date() && goal.status === 'active';
    const daysLeft = differenceInDays(new Date(goal.end_date), new Date());
    
    if (goal.status === 'completed') return { label: 'Concluída', variant: 'default' as const, className: 'bg-success text-success-foreground' };
    if (isOverdue) return { label: 'Vencida', variant: 'destructive' as const, className: '' };
    if (progress >= 90) return { label: 'Quase lá!', variant: 'default' as const, className: 'bg-success text-success-foreground' };
    if (progress >= 50) return { label: 'Em progresso', variant: 'secondary' as const, className: 'bg-warning/15 text-warning border-warning/30' };
    return { label: `${daysLeft}d restantes`, variant: 'outline' as const, className: '' };
  };

  if (goalsLoading || brokersLoading || teamsLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background lg:ml-72">
          <div className="p-4 lg:p-6 space-y-6 pt-20 lg:pt-6">
            <MetasSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background lg:ml-72">
        <div className="p-4 lg:p-6 space-y-6 pt-20 lg:pt-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Gestão de Metas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o progresso e performance
                </p>
              </div>
            </div>
            
            {/* Month Selector */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1.5 shadow-sm">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-9 w-9">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[160px] justify-center px-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground capitalize">
                  {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-9 w-9">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="metas" className="w-full">
            <TabsList className="h-11 bg-card border border-border shadow-sm rounded-xl p-1">
              <TabsTrigger value="metas" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                <Target className="w-4 h-4" />
                Metas
              </TabsTrigger>
              <TabsTrigger value="tarefas" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
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
                    <TabsList className="inline-flex h-11 bg-card border border-border shadow-sm rounded-xl p-1 gap-0.5 min-w-max">
                      {accessibleBrokers.map((broker) => (
                        <TabsTrigger
                          key={broker.id}
                          value={broker.id}
                          className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
                        >
                          {broker.name.split(' ')[0]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {accessibleBrokers.map((broker) => (
                    <TabsContent key={broker.id} value={broker.id} className="mt-4 space-y-6">
                      
                      {/* KPI Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { label: 'Total', value: stats.total, icon: Target, color: 'text-primary' },
                          { label: 'Ativas', value: stats.active, icon: Clock, color: 'text-info' },
                          { label: 'Concluídas', value: stats.completed, icon: CheckCircle2, color: 'text-success' },
                          { label: 'Vencidas', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
                          { label: 'Progresso', value: `${stats.avgProgress.toFixed(0)}%`, icon: TrendingUp, color: 'text-primary' },
                        ].map((kpi, i) => (
                          <Card key={i} className="border-border/50 bg-card">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-muted rounded-lg shrink-0">
                                  <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">{kpi.value}</p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{kpi.label}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Circular Progress Gauge */}
                      {stats.total > 0 && (
                        <div className="flex justify-center">
                          <div className="relative w-28 h-28">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted/30" />
                              <circle 
                                cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                                strokeLinecap="round"
                                className="stroke-primary transition-all duration-700"
                                strokeDasharray={`${Math.min(stats.avgProgress, 100) * 2.64} 264`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-foreground">{stats.avgProgress.toFixed(0)}%</span>
                              <span className="text-[10px] text-muted-foreground">média</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Goals Table */}
                      <Card className="border-border/50 bg-card shadow-sm">
                        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Metas de {broker.name}
                          </CardTitle>
                          {canManageGoals && (
                            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                              <Plus className="w-4 h-4 mr-1.5" />
                              Nova Meta
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6 sm:pt-0">
                          {filteredGoals.length === 0 ? (
                            <div className="text-center py-16">
                              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                <Target className="w-8 h-8 text-muted-foreground/40" />
                              </div>
                              <p className="text-muted-foreground font-medium">Nenhuma meta neste período</p>
                              <p className="text-sm text-muted-foreground/70 mt-1">Crie uma meta para começar a acompanhar</p>
                              {canManageGoals && (
                                <Button onClick={() => setCreateDialogOpen(true)} variant="outline" size="sm" className="mt-4">
                                  <Plus className="w-4 h-4 mr-1.5" />
                                  Criar meta
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="min-w-[180px]">Meta</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="min-w-[200px]">Progresso</TableHead>
                                    <TableHead className="text-right">Atual / Alvo</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Prazo</TableHead>
                                    {canManageGoals && <TableHead className="text-right w-[100px]">Ações</TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredGoals.map(goal => {
                                    const progress = getProgress(goal);
                                    const statusInfo = getStatusInfo(goal);
                                    
                                    return (
                                      <TableRow 
                                        key={goal.id} 
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setSelectedGoalId(goal.id)}
                                      >
                                        <TableCell>
                                          <div>
                                            <p className="font-medium text-foreground">{goal.title}</p>
                                            {goal.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{goal.description}</p>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="secondary" className="text-xs font-medium">
                                            {getTypeLabel(goal.target_type)}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                              <span className="text-muted-foreground">{getPeriodLabel(goal.period_type)}</span>
                                              <span className={cn(
                                                "font-bold",
                                                progress >= 90 ? "text-success" : progress >= 50 ? "text-warning" : "text-destructive"
                                              )}>
                                                {progress}%
                                              </span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="text-sm">
                                            <span className="font-semibold text-foreground">{formatValue(goal.current_value, goal.target_type)}</span>
                                            <span className="text-muted-foreground"> / {formatValue(goal.target_value, goal.target_type)}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={statusInfo.variant} className={cn("text-xs", statusInfo.className)}>
                                            {statusInfo.label}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <span className="text-sm text-muted-foreground">
                                            {format(new Date(goal.end_date), 'dd/MM/yy', { locale: ptBR })}
                                          </span>
                                        </TableCell>
                                        {(canEditGoal(goal) || canDeleteGoal(goal)) && (
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-0.5" onClick={e => e.stopPropagation()}>
                                              {canEditGoal(goal) && (
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(goal)} className="h-8 w-8">
                                                  <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                              )}
                                              {canDeleteGoal(goal) && (
                                                <Button size="icon" variant="ghost" onClick={() => setDeleteGoalId(goal.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                              )}
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
                <Card className="border-border/50">
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

      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createGoal}
        preSelectedBrokerId={selectedBrokerId}
      />
      
      {selectedGoal && (
        <GoalDetailsDialog
          goal={selectedGoal}
          open={!!selectedGoalId}
          onOpenChange={(open) => {
            if (!open) { setSelectedGoalId(null); setEditingGoal(null); }
          }}
          onUpdate={updateGoal}
          canEdit={canManageGoals}
        />
      )}

      <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
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
