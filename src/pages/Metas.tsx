import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useAllGoalTasks } from '@/hooks/useAllGoalTasks';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  CheckCircle2
} from 'lucide-react';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';
import TasksOverviewTab from '@/components/goals/TasksOverviewTab';
import { MetasSkeleton } from '@/components/skeletons/MetasSkeleton';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { format } from 'date-fns';
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
  const { getUserRole, profile, user } = useAuth();
  const { goals, loading: goalsLoading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { teams, loading: teamsLoading } = useTeams();
  const { tasks: allTasks } = useAllGoalTasks();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  
  const rawRole = getUserRole();
  const userRole = rawRole === 'admin' ? 'diretor' : rawRole;
  const canManageGoals = ['diretor', 'gerente'].includes(userRole);

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

  // Get available teams based on user role
  const availableTeams = userRole === 'diretor' 
    ? teams 
    : teams.filter(team => team.id === profile?.team_id);

  // Auto-select team for managers
  useEffect(() => {
    if (userRole === 'gerente' && profile?.team_id && !selectedTeam) {
      setSelectedTeam(profile.team_id);
    } else if (userRole === 'diretor' && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id);
    }
  }, [userRole, profile, teams, selectedTeam]);

  // Get brokers for selected team
  const teamBrokers = selectedTeam 
    ? brokers.filter(broker => broker.team_id === selectedTeam)
    : [];

  // Identify current user's broker record (if any) and personal goals
  const myBroker = brokers.find(b => b.user_id === profile?.id);
  const myGoals = goals.filter(goal =>
    goal.assigned_to === user?.id || (myBroker?.id && goal.broker_id === myBroker.id)
  );

  // Get goals for selected team
  const teamGoals = goals.filter(goal => goal.team_id === selectedTeam);
  
  // Get broker goals for selected team
  const brokerGoals = goals.filter(goal => 
    goal.broker_id && teamBrokers.some(broker => broker.id === goal.broker_id)
  );

  // All visible goals (for table view)
  const allVisibleGoals = canManageGoals 
    ? [...teamGoals, ...brokerGoals]
    : myGoals;

  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null;

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

  if (goalsLoading || brokersLoading || teamsLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 lg:ml-72">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 lg:ml-72">
        <div className="max-w-7xl mx-auto p-6 space-y-6 pt-20 lg:pt-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg">
                  <Target className="w-6 h-6" />
                </div>
                🎯 Metas
              </h1>
              <p className="text-muted-foreground mt-2">
                Defina e acompanhe metas pessoais e de equipe.
              </p>
            </div>
            {canManageGoals && (
              <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Criar Meta
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="metas" className="w-full">
            <TabsList className="inline-flex h-11">
              <TabsTrigger value="metas" className="gap-2">
                <Target className="w-4 h-4" />
                Metas
              </TabsTrigger>
              <TabsTrigger value="tarefas" className="gap-2">
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
              {/* Team Selector (for managers/directors) */}
              {canManageGoals && (
                <Card className="border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-primary" />
                      Filtrar por Equipe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-md">
                      <Select value={selectedTeam || ''} onValueChange={setSelectedTeam}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma equipe..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goals Table */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    {canManageGoals 
                      ? `Metas ${selectedTeam ? `- ${teams.find(t => t.id === selectedTeam)?.name}` : ''}`
                      : 'Minhas Metas'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(canManageGoals ? [...teamGoals, ...brokerGoals] : myGoals).length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Nenhuma meta encontrada.</p>
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
                          <TableRow>
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
                          {(canManageGoals ? [...teamGoals, ...brokerGoals] : myGoals).map(goal => {
                            const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
                            const broker = brokers.find(b => b.id === goal.broker_id);
                            
                            return (
                              <TableRow 
                                key={goal.id} 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedGoalId(goal.id)}
                              >
                                <TableCell className="font-medium">
                                  <div>
                                    <p>{goal.title}</p>
                                    {broker && (
                                      <p className="text-xs text-muted-foreground">{broker.name}</p>
                                    )}
                                  </div>
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
                                      <span className="font-bold">{progress.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
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