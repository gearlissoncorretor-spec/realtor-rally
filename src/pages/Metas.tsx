import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { useAllGoalTasks } from '@/hooks/useAllGoalTasks';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Users, Plus, ListTodo } from 'lucide-react';
import { GoalCard } from '@/components/goals/GoalCard';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';
import TasksOverviewTab from '@/components/goals/TasksOverviewTab';

const Metas = () => {
  const { getUserRole, profile, user } = useAuth();
  const { goals, loading: goalsLoading, createGoal, updateGoal } = useGoals();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { teams, loading: teamsLoading } = useTeams();
  const { tasks: allTasks } = useAllGoalTasks();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  
  const rawRole = getUserRole();
  const userRole = rawRole === 'admin' ? 'diretor' : rawRole;

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

  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null;

  if (goalsLoading || brokersLoading || teamsLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 lg:ml-64">
          <div className="max-w-7xl mx-auto p-6 space-y-6 pt-20 lg:pt-6">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-muted rounded w-96"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="h-80 bg-muted rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 lg:ml-64">
        <div className="max-w-7xl mx-auto p-6 space-y-6 pt-20 lg:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg">
                <Target className="w-6 h-6" />
              </div>
              🎯 Metas Avançadas
            </h1>
            <p className="text-muted-foreground mt-2">
              Defina e acompanhe metas pessoais e de equipe em um só lugar.
            </p>
          </div>
          {(['diretor', 'gerente'].includes(userRole)) && (
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
            {/* Minhas Metas */}
            {(userRole === 'corretor' || rawRole === 'admin') && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    📋 Minhas Metas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myGoals.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Nenhuma meta pessoal definida no momento.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {myGoals.map(goal => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onClick={() => setSelectedGoalId(goal.id)}
                          canEdit={false}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Team Selector */}
            {(['diretor', 'gerente'].includes(userRole)) && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    👥 Equipe de Trabalho
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

            {selectedTeam && (
              <>
                {/* Team Goals Section */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Metas da Equipe: {teams.find(t => t.id === selectedTeam)?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamGoals.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Nenhuma meta definida para esta equipe.</p>
                      </div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {teamGoals.map(goal => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onClick={() => setSelectedGoalId(goal.id)}
                            canEdit={['diretor', 'gerente'].includes(userRole)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Broker Goals Section */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Metas Individuais dos Corretores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamBrokers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Nenhum corretor encontrado nesta equipe.</p>
                      </div>
                    ) : brokerGoals.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Nenhuma meta individual definida.</p>
                      </div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {brokerGoals.map(goal => {
                          const broker = teamBrokers.find(b => b.id === goal.broker_id);
                          return (
                            <div key={goal.id} className="space-y-3">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{broker?.name || 'Corretor'}</span>
                              </div>
                              <GoalCard
                                goal={goal}
                                onClick={() => setSelectedGoalId(goal.id)}
                                canEdit={['diretor', 'gerente'].includes(userRole)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="tarefas" className="mt-6">
            <TasksOverviewTab />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createGoal}
      />
      
      {selectedGoal && (
        <GoalDetailsDialog
          goal={selectedGoal}
          open={!!selectedGoalId}
          onOpenChange={(open) => !open && setSelectedGoalId(null)}
          onUpdate={updateGoal}
          canEdit={['diretor', 'gerente'].includes(userRole)}
        />
      )}
    </>
  );
};

export default Metas;
