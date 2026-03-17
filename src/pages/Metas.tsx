import React, { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { Pause, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
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
  AlertTriangle,
  Flame,
  Trophy,
  Zap
} from 'lucide-react';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';
import TasksOverviewTab from '@/components/goals/TasksOverviewTab';
import { MetasSkeleton } from '@/components/skeletons/MetasSkeleton';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  formatGoalValue as formatValue,
  getGoalPeriodLabel,
  getGoalTypeLabel,
  isCurrencyGoalType,
} from '@/lib/goals';
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

const Metas = () => {
  const { getUserRole, profile, user, isCorretor, isGerente, isDiretor, isAdmin } = useAuth();
  const { goals, loading: goalsLoading, createGoal, updateGoal, deleteGoal, canEditGoal, canDeleteGoal } = useGoals();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { teams, loading: teamsLoading } = useTeams();
  const { tasks: allTasks } = useAllGoalTasks();
  
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  
  const rawRole = getUserRole();
  const userRole = rawRole === 'admin' ? 'diretor' : rawRole;
  const canManageGoals = ['diretor', 'gerente'].includes(userRole);
  const isDirectorView = isDiretor() || isAdmin();

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

  // Teams that have brokers assigned
  const teamsWithBrokers = useMemo(() => {
    if (!isDirectorView) return [];
    const teamIds = new Set(accessibleBrokers.map(b => b.team_id).filter(Boolean));
    return teams.filter(t => teamIds.has(t.id));
  }, [teams, accessibleBrokers, isDirectorView]);

  // Brokers filtered by selected team (for directors)
  const visibleBrokers = useMemo(() => {
    if (!isDirectorView || selectedTeamId === 'all') return accessibleBrokers;
    return accessibleBrokers.filter(b => b.team_id === selectedTeamId);
  }, [accessibleBrokers, selectedTeamId, isDirectorView]);

  useEffect(() => {
    if (visibleBrokers.length > 0 && (!selectedBrokerId || !visibleBrokers.find(b => b.id === selectedBrokerId))) {
      setSelectedBrokerId(visibleBrokers[0].id);
    }
  }, [visibleBrokers, selectedBrokerId]);

  const goToPreviousMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= addMonths(new Date(), 12)) setSelectedMonth(nextMonth);
  };

  const filteredGoals = useMemo(() => {
    if (!selectedBrokerId) return [];
    const selectedBrokerData = visibleBrokers.find(b => b.id === selectedBrokerId);
    return goals.filter(goal => {
      const matchesBroker = goal.broker_id === selectedBrokerId || 
        (!goal.broker_id && goal.team_id === selectedBrokerData?.team_id) ||
        (!goal.broker_id && !goal.team_id);
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const goalStart = new Date(goal.start_date);
      const goalEnd = new Date(goal.end_date);
      return matchesBroker && goalStart <= monthEnd && goalEnd >= monthStart;
    });
  }, [goals, selectedBrokerId, selectedMonth, visibleBrokers]);

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
  const selectedBroker = visibleBrokers.find(b => b.id === selectedBrokerId);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedGoalId(goal.id);
  };

  const handleDelete = async () => {
    if (!deleteGoalId) return;
    try { await deleteGoal(deleteGoalId); setDeleteGoalId(null); } catch {}
  };

  const formatValueCompact = (value: number, type: string) => {
    return formatValue(value, type);
  };

  const getProgress = (goal: Goal) => {
    if (goal.target_value === 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const getStatusInfo = (goal: Goal) => {
    const progress = getProgress(goal);
    const isOverdue = new Date(goal.end_date) < new Date() && goal.status === 'active';
    const daysLeft = differenceInDays(new Date(goal.end_date), new Date());
    
    if (goal.status === 'paused') return { label: 'Pausada', variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' };
    if (goal.status === 'completed') return { label: 'Concluída', variant: 'default' as const, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' };
    if (isOverdue) return { label: 'Vencida', variant: 'destructive' as const, className: '' };
    if (progress >= 90) return { label: 'Quase lá!', variant: 'default' as const, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' };
    if (progress >= 50) return { label: 'Em progresso', variant: 'secondary' as const, className: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400' };
    return { label: `${daysLeft}d restantes`, variant: 'outline' as const, className: '' };
  };

  const getDailyNeeded = (goal: Goal) => {
    if (goal.status !== 'active') return null;
    const remaining = goal.target_value - goal.current_value;
    if (remaining <= 0) return null;
    const daysLeft = differenceInDays(new Date(goal.end_date), new Date());
    if (daysLeft <= 0) return null;
    return remaining / daysLeft;
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

  const kpiCards = [
    { label: 'Total', value: stats.total, icon: Target, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/20' },
    { label: 'Ativas', value: stats.active, icon: Zap, gradient: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-500', borderColor: 'border-blue-500/20' },
    { label: 'Concluídas', value: stats.completed, icon: Trophy, gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-500', borderColor: 'border-emerald-500/20' },
    { label: 'Vencidas', value: stats.overdue, icon: Flame, gradient: 'from-red-500/20 to-red-500/5', iconColor: 'text-red-500', borderColor: 'border-red-500/20' },
    { label: 'Progresso', value: `${stats.avgProgress.toFixed(0)}%`, icon: TrendingUp, gradient: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-500', borderColor: 'border-violet-500/20' },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background lg:ml-72">
        <div className="p-4 lg:p-6 space-y-6 pt-20 lg:pt-6 pb-20 lg:pb-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 w-full justify-center sm:justify-start">
              <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                  Gestão de Metas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o progresso e performance
                </p>
              </div>
            </div>
            
            {/* Month Selector */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1.5 shadow-sm">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-9 w-9 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[160px] justify-center px-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground capitalize">
                  {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-9 w-9 rounded-lg">
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
              {/* Team Tabs for Directors */}
              {isDirectorView && teamsWithBrokers.length > 0 && (
                <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                  <div className="inline-flex h-11 bg-card border border-border shadow-sm rounded-xl p-1 gap-0.5 min-w-max">
                    <button
                      onClick={() => setSelectedTeamId('all')}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                        selectedTeamId === 'all'
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Users className="w-4 h-4 inline-block mr-1.5" />
                      Todas as Equipes
                    </button>
                    {teamsWithBrokers.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                          selectedTeamId === team.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Broker Tabs */}
              {visibleBrokers.length > 0 ? (
                <Tabs value={selectedBrokerId} onValueChange={setSelectedBrokerId} className="w-full">
                  <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                    <TabsList className="inline-flex h-11 bg-card border border-border shadow-sm rounded-xl p-1 gap-0.5 min-w-max">
                      {visibleBrokers.map((broker) => (
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

                  {visibleBrokers.map((broker) => (
                    <TabsContent key={broker.id} value={broker.id} className="mt-4 space-y-6">
                      
                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {kpiCards.map((kpi, i) => (
                          <Card key={i} className={cn("border overflow-hidden transition-all hover:shadow-md", kpi.borderColor)}>
                            <CardContent className="p-0">
                              <div className={cn("bg-gradient-to-br p-3 sm:p-4", kpi.gradient)}>
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-background/80 backdrop-blur-sm rounded-lg shrink-0 shadow-sm">
                                    <kpi.icon className={cn("w-4 h-4", kpi.iconColor)} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{kpi.value}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{kpi.label}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Circular Progress + Action */}
                      {stats.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="7" className="stroke-muted/20" />
                              <circle 
                                cx="50" cy="50" r="42" fill="none" strokeWidth="7"
                                strokeLinecap="round"
                                className={cn(
                                  "transition-all duration-1000 ease-out",
                                  stats.avgProgress >= 90 ? "stroke-emerald-500" :
                                  stats.avgProgress >= 50 ? "stroke-amber-500" : "stroke-red-500"
                                )}
                                strokeDasharray={`${Math.min(stats.avgProgress, 100) * 2.64} 264`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-foreground">{stats.avgProgress.toFixed(0)}%</span>
                              <span className="text-xs text-muted-foreground font-medium">média geral</span>
                            </div>
                          </div>
                          <div className="text-center sm:text-left space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">{stats.completed}</span> de <span className="font-semibold text-foreground">{stats.total}</span> metas concluídas
                            </p>
                            {stats.overdue > 0 && (
                              <p className="text-sm text-red-500 flex items-center gap-1.5 justify-center sm:justify-start">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {stats.overdue} meta{stats.overdue > 1 ? 's' : ''} vencida{stats.overdue > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Goals Cards (Mobile) + Table (Desktop) */}
                      <Card className="border-border/50 bg-card shadow-sm overflow-hidden">
                        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-muted/30 to-transparent">
                          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Metas de {broker.name}
                          </CardTitle>
                          {canManageGoals && (
                            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto shadow-sm">
                              <Plus className="w-4 h-4 mr-1.5" />
                              Nova Meta
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="p-0">
                          {filteredGoals.length === 0 ? (
                            <div className="text-center py-16 px-4">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center mx-auto mb-4 border border-border/50">
                                <Target className="w-10 h-10 text-muted-foreground/30" />
                              </div>
                              <p className="text-muted-foreground font-medium text-lg">Nenhuma meta neste período</p>
                              <p className="text-sm text-muted-foreground/70 mt-1.5 max-w-xs mx-auto">
                                Crie uma meta para começar a acompanhar o desempenho de {broker.name.split(' ')[0]}
                              </p>
                              {canManageGoals && (
                                <Button onClick={() => setCreateDialogOpen(true)} variant="outline" size="sm" className="mt-5">
                                  <Plus className="w-4 h-4 mr-1.5" />
                                  Criar meta
                                </Button>
                              )}
                            </div>
                          ) : (
                            <>
                              {/* Motivational Banner per Goal */}
                              {filteredGoals.filter(g => g.status === 'active' && g.target_value - g.current_value > 0).length > 0 && (
                                <div className="divide-y divide-border/30">
                                  {filteredGoals
                                    .filter(g => g.status === 'active' && g.target_value - g.current_value > 0)
                                    .map(goal => (
                                      <div key={`motivation-${goal.id}`} className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20">
                                        <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-sm font-medium text-foreground">
                                          <span className="font-bold">{broker.name.split(' ')[0]}</span>
                                          {' — '}
                                          <span className="text-amber-600 dark:text-amber-400">
                                            Falta {formatValue(goal.target_value - goal.current_value, goal.target_type)} para {goal.title}! 🔥
                                          </span>
                                        </p>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}

                              {/* Mobile: Goal Cards */}
                              <div className="sm:hidden divide-y divide-border">
                                {filteredGoals.map(goal => {
                                  const progress = getProgress(goal);
                                  const statusInfo = getStatusInfo(goal);
                                  const dailyNeeded = getDailyNeeded(goal);
                                  
                                  return (
                                    <div 
                                      key={goal.id} 
                                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors active:bg-muted/50"
                                      onClick={() => setSelectedGoalId(goal.id)}
                                    >
                                      <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold text-foreground truncate">{goal.title}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                {getGoalTypeLabel(goal.target_type)}
                                              </Badge>
                                            <Badge variant={statusInfo.variant} className={cn("text-[10px] px-1.5 py-0", statusInfo.className)}>
                                              {statusInfo.label}
                                            </Badge>
                                          </div>
                                        </div>
                                        <span className={cn(
                                          "text-xl font-bold tabular-nums shrink-0",
                                          progress >= 90 ? "text-emerald-500" : progress >= 50 ? "text-amber-500" : "text-red-500"
                                        )}>
                                          {progress}%
                                        </span>
                                      </div>
                                      
                                      <Progress value={progress} className="h-2 mb-2" />
                                      
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{formatValueCompact(goal.current_value, goal.target_type)} / {formatValueCompact(goal.target_value, goal.target_type)}</span>
                                        <span>{format(new Date(goal.end_date), 'dd/MM', { locale: ptBR })}</span>
                                      </div>

                                      {dailyNeeded && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3" />
                                          Necessário: {formatValueCompact(dailyNeeded, goal.target_type)}/dia
                                        </p>
                                      )}

                                      {(canEditGoal(goal) || canDeleteGoal(goal)) && (
                                        <div className="flex justify-end gap-1 mt-2" onClick={e => e.stopPropagation()}>
                                          {canEditGoal(goal) && (
                                            <Button 
                                              size="icon" variant="ghost" 
                                              onClick={() => updateGoal(goal.id, { status: goal.status === 'active' ? 'paused' : 'active' })}
                                              className="h-7 w-7"
                                            >
                                              {goal.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                            </Button>
                                          )}
                                          {canEditGoal(goal) && (
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(goal)} className="h-7 w-7">
                                              <Pencil className="w-3 h-3" />
                                            </Button>
                                          )}
                                          {canDeleteGoal(goal) && (
                                            <Button size="icon" variant="ghost" onClick={() => setDeleteGoalId(goal.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Desktop: Table */}
                              <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 min-w-[180px]">Meta</th>
                                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Tipo</th>
                                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 min-w-[200px]">Progresso</th>
                                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Atual / Alvo</th>
                                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Faltam</th>
                                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Prazo</th>
                                      {canManageGoals && <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 w-[120px]">Ações</th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/50">
                                    {filteredGoals.map(goal => {
                                      const progress = getProgress(goal);
                                      const statusInfo = getStatusInfo(goal);
                                      const dailyNeeded = getDailyNeeded(goal);
                                      
                                      return (
                                        <tr 
                                          key={goal.id} 
                                          className="cursor-pointer hover:bg-muted/40 transition-colors group"
                                          onClick={() => setSelectedGoalId(goal.id)}
                                        >
                                          <td className="py-3.5 px-4">
                                            <div>
                                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">{goal.title}</p>
                                              {goal.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{goal.description}</p>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-3.5 px-4">
                                              <Badge variant="secondary" className="text-xs font-medium">
                                                {getGoalTypeLabel(goal.target_type)}
                                              </Badge>
                                          </td>
                                          <td className="py-3.5 px-4">
                                            <div className="space-y-1.5">
                                              <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{getGoalPeriodLabel(goal.period_type)}</span>
                                                <span className={cn(
                                                  "font-bold tabular-nums",
                                                  progress >= 90 ? "text-emerald-500" : progress >= 50 ? "text-amber-500" : "text-red-500"
                                                )}>
                                                  {progress}%
                                                </span>
                                              </div>
                                              <Progress value={progress} className="h-2" />
                                              {dailyNeeded && (
                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                                  <TrendingUp className="w-2.5 h-2.5" />
                                                  {formatValueCompact(dailyNeeded, goal.target_type)}/dia necessário
                                                </p>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-3.5 px-4 text-right">
                                            <div className="text-sm">
                                              <span className="font-semibold text-foreground">{formatValue(goal.current_value, goal.target_type)}</span>
                                              <span className="text-muted-foreground"> / {formatValue(goal.target_value, goal.target_type)}</span>
                                            </div>
                                          </td>
                                          <td className="py-3.5 px-4 text-right">
                                            <span className={cn(
                                              "text-sm font-medium",
                                              goal.target_value - goal.current_value <= 0 ? "text-emerald-500" : "text-muted-foreground"
                                            )}>
                                              {goal.target_value - goal.current_value > 0
                                                ? formatValue(goal.target_value - goal.current_value, goal.target_type)
                                                : '✅ Atingida'}
                                            </span>
                                          </td>
                                          <td className="py-3.5 px-4">
                                            <Badge variant={statusInfo.variant} className={cn("text-xs", statusInfo.className)}>
                                              {statusInfo.label}
                                            </Badge>
                                          </td>
                                          <td className="py-3.5 px-4">
                                            <span className="text-sm text-muted-foreground">
                                              {format(new Date(goal.end_date), 'dd/MM/yy', { locale: ptBR })}
                                            </span>
                                          </td>
                                          {canManageGoals && (
                                            <td className="py-3.5 px-4 text-right">
                                              <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                {canEditGoal(goal) && (
                                                  <Button 
                                                    size="icon" variant="ghost" 
                                                    onClick={() => updateGoal(goal.id, { status: goal.status === 'active' ? 'paused' : 'active' })}
                                                    className="h-8 w-8"
                                                    title={goal.status === 'active' ? 'Pausar meta' : 'Reativar meta'}
                                                  >
                                                    {goal.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                  </Button>
                                                )}
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
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </>
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
