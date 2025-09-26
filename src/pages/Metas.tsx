import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { GoalCard } from '@/components/goals/GoalCard';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';
import { formatCurrency } from '@/utils/formatting';

const Metas = () => {
  const { getUserRole, user } = useAuth();
  const { goals, loading, createGoal, updateGoal } = useGoals();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const userRole = getUserRole();

  // Filter goals based on user role
  const filteredGoals = goals.filter(goal => {
    if (userRole === 'diretor') return true;
    if (userRole === 'gerente') {
      return goal.team_id === user?.team_id || goal.assigned_to === user?.id;
    }
    return goal.assigned_to === user?.id || goal.broker_id === user?.broker_id;
  });

  // Calculate stats
  const activeGoals = filteredGoals.filter(g => g.status === 'active').length;
  const completedGoals = filteredGoals.filter(g => g.status === 'completed').length;
  const totalProgress = filteredGoals.reduce((acc, goal) => acc + (goal.current_value / goal.target_value * 100), 0);
  const avgProgress = filteredGoals.length ? totalProgress / filteredGoals.length : 0;

  const canCreateGoals = ['diretor', 'gerente'].includes(userRole);

  if (loading) {
    return (
      <div className="min-h-screen p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 lg:ml-64">
      <div className="max-w-7xl mx-auto p-6 space-y-8 pt-20 lg:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              Metas Avançado
            </h1>
            <p className="text-muted-foreground mt-2">
              {userRole === 'diretor' 
                ? 'Gerencie metas de toda a organização'
                : userRole === 'gerente'
                ? 'Acompanhe as metas da sua equipe'
                : 'Visualize suas metas pessoais'
              }
            </p>
          </div>
          
          {canCreateGoals && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Metas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeGoals}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{completedGoals}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Progresso Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{avgProgress.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {filteredGoals.filter(g => g.status === 'active' && g.current_value > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            {userRole === 'diretor' ? 'Todas as Metas' : 
             userRole === 'gerente' ? 'Metas da Equipe' : 'Suas Metas'}
          </h2>
          
          {filteredGoals.length === 0 ? (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma meta encontrada
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {canCreateGoals 
                      ? 'Comece criando uma nova meta para acompanhar o progresso da equipe.'
                      : 'Suas metas aparecerão aqui quando forem definidas pelo seu gerente.'
                    }
                  </p>
                  {canCreateGoals && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Meta
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={() => setSelectedGoal(goal)}
                  canEdit={canCreateGoals}
                />
              ))}
            </div>
          )}
        </div>

        {/* Dialogs */}
        {showCreateDialog && (
          <CreateGoalDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreate={createGoal}
          />
        )}

        {selectedGoal && (
          <GoalDetailsDialog
            goal={selectedGoal}
            open={!!selectedGoal}
            onOpenChange={(open) => !open && setSelectedGoal(null)}
            onUpdate={updateGoal}
            canEdit={canCreateGoals}
          />
        )}
      </div>
    </div>
  );
};

export default Metas;