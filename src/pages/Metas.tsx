import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { useGoalTasks } from '@/hooks/useGoalTasks';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Users, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Calendar,
  TrendingUp,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatting';

interface TeamGoal {
  id?: string;
  title: string;
  target_value: number;
  current_value: number;
  target_type: string;
  team_id: string;
}

interface BrokerGoal {
  id?: string;
  title: string;
  target_value: number;
  current_value: number;
  target_type: string;
  broker_id: string;
}

const Metas = () => {
  const { getUserRole, profile } = useAuth();
  const { goals, loading: goalsLoading, createGoal, updateGoal } = useGoals();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { teams, teamMembers, loading: teamsLoading } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [editingTeamGoal, setEditingTeamGoal] = useState<string | null>(null);
  const [editingBrokerGoal, setEditingBrokerGoal] = useState<string | null>(null);
  
  const userRole = getUserRole();

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

  // Get goals for selected team and brokers
  const teamGoals = goals.filter(goal => goal.team_id === selectedTeam);
  const brokerGoals = goals.filter(goal => 
    teamBrokers.some(broker => broker.id === goal.broker_id)
  );

  const handleCreateTeamGoal = async (goalData: Partial<TeamGoal>) => {
    try {
      await createGoal({
        ...goalData,
        team_id: selectedTeam,
        period_type: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        status: 'active'
      });
      setEditingTeamGoal(null);
    } catch (error) {
      console.error('Error creating team goal:', error);
    }
  };

  const handleCreateBrokerGoal = async (brokerId: string, goalData: Partial<BrokerGoal>) => {
    try {
      await createGoal({
        ...goalData,
        broker_id: brokerId,
        period_type: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        status: 'active'
      });
      setEditingBrokerGoal(null);
    } catch (error) {
      console.error('Error creating broker goal:', error);
    }
  };

  if (goalsLoading || brokersLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 lg:ml-64">
        <div className="max-w-7xl mx-auto p-6 space-y-8 pt-20 lg:pt-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-96 bg-muted rounded"></div>
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
                ? 'Defina e acompanhe metas da sua equipe'
                : 'Visualize suas metas pessoais'
              }
            </p>
          </div>
        </div>

        {/* Team Selector for Directors */}
        {userRole === 'diretor' && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Selecionar Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTeam || ''} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-full max-w-md">
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
            </CardContent>
          </Card>
        )}

        {selectedTeam && (
          <>
            {/* Team Goal Section */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Meta da Equipe: {teams.find(t => t.id === selectedTeam)?.name}
                  </div>
                  {(['diretor', 'gerente'].includes(userRole)) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingTeamGoal('new')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Meta
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamGoals.length === 0 && editingTeamGoal !== 'new' ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma meta definida para esta equipe</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {teamGoals.map(goal => (
                      <TeamGoalCard 
                        key={goal.id} 
                        goal={goal} 
                        onEdit={updateGoal}
                        canEdit={['diretor', 'gerente'].includes(userRole)}
                      />
                    ))}
                    {editingTeamGoal === 'new' && (
                      <TeamGoalForm 
                        onSave={handleCreateTeamGoal}
                        onCancel={() => setEditingTeamGoal(null)}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brokers Kanban Section */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Corretores - Metas Individuais
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamBrokers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum corretor encontrado nesta equipe</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teamBrokers.map(broker => (
                      <BrokerKanbanCard
                        key={broker.id}
                        broker={broker}
                        goals={brokerGoals.filter(g => g.broker_id === broker.id)}
                        onCreateGoal={(goalData) => handleCreateBrokerGoal(broker.id, goalData)}
                        onUpdateGoal={updateGoal}
                        canEdit={['diretor', 'gerente'].includes(userRole)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

// Team Goal Card Component
const TeamGoalCard: React.FC<{
  goal: any;
  onEdit: (id: string, data: any) => void;
  canEdit: boolean;
}> = ({ goal, onEdit, canEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: goal.title,
    target_value: goal.target_value,
    target_type: goal.target_type
  });

  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;

  const handleSave = async () => {
    try {
      await onEdit(goal.id, editData);
      setIsEditing(false);
      toast({
        title: "Sucesso",
        description: "Meta da equipe atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive",
      });
    }
  };

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="title">Título da Meta</Label>
            <Input
              id="title"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="target_value">Valor Meta</Label>
            <Input
              id="target_value"
              type="number"
              value={editData.target_value}
              onChange={(e) => setEditData({...editData, target_value: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <Label htmlFor="target_type">Tipo de Meta</Label>
            <Select value={editData.target_type} onValueChange={(value) => setEditData({...editData, target_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales_count">Número de Vendas</SelectItem>
                <SelectItem value="revenue">Faturamento</SelectItem>
                <SelectItem value="vgv">VGV</SelectItem>
                <SelectItem value="commission">Comissão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            <Check className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{goal.title}</h3>
          <Badge variant="secondary" className="mt-1">
            {goal.target_type === 'sales_count' ? 'Vendas' : 
             goal.target_type === 'revenue' ? 'Faturamento' :
             goal.target_type === 'vgv' ? 'VGV' : 'Comissão'}
          </Badge>
        </div>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progresso</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <Progress value={Math.min(progress, 100)} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {goal.target_type.includes('value') || goal.target_type.includes('revenue') || goal.target_type.includes('commission')
              ? formatCurrency(goal.current_value)
              : goal.current_value}
          </span>
          <span>
            {goal.target_type.includes('value') || goal.target_type.includes('revenue') || goal.target_type.includes('commission')
              ? formatCurrency(goal.target_value)
              : goal.target_value}
          </span>
        </div>
      </div>
    </div>
  );
};

// Team Goal Form Component
const TeamGoalForm: React.FC<{
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    target_value: 0,
    target_type: 'sales_count'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.target_value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Nova Meta da Equipe</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="new-title">Título da Meta *</Label>
          <Input
            id="new-title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Ex: Meta de Vendas Q4"
            required
          />
        </div>
        <div>
          <Label htmlFor="new-target">Valor Meta *</Label>
          <Input
            id="new-target"
            type="number"
            value={formData.target_value}
            onChange={(e) => setFormData({...formData, target_value: parseFloat(e.target.value) || 0})}
            placeholder="0"
            required
          />
        </div>
        <div>
          <Label htmlFor="new-type">Tipo de Meta</Label>
          <Select value={formData.target_type} onValueChange={(value) => setFormData({...formData, target_type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales_count">Número de Vendas</SelectItem>
              <SelectItem value="revenue">Faturamento</SelectItem>
              <SelectItem value="vgv">VGV</SelectItem>
              <SelectItem value="commission">Comissão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          <Check className="w-4 h-4 mr-2" />
          Criar Meta
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} size="sm">
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </form>
  );
};

// Broker Kanban Card Component
const BrokerKanbanCard: React.FC<{
  broker: any;
  goals: any[];
  onCreateGoal: (data: any) => void;
  onUpdateGoal: (id: string, data: any) => void;
  canEdit: boolean;
}> = ({ broker, goals, onCreateGoal, onUpdateGoal, canEdit }) => {
  const [showNewGoal, setShowNewGoal] = useState(false);
  const { tasks, createTask } = useGoalTasks(goals[0]?.id);

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{broker.name}</h3>
              <p className="text-sm text-muted-foreground">{broker.email}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Broker Goals */}
        <div className="space-y-3">
          {goals.length === 0 && !showNewGoal ? (
            <div className="text-center py-4 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sem metas definidas</p>
              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowNewGoal(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Definir Meta
                </Button>
              )}
            </div>
          ) : (
            <>
              {goals.map(goal => (
                <BrokerGoalMini key={goal.id} goal={goal} onUpdate={onUpdateGoal} canEdit={canEdit} />
              ))}
              {canEdit && !showNewGoal && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowNewGoal(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Nova Meta
                </Button>
              )}
            </>
          )}
          
          {showNewGoal && (
            <BrokerGoalForm 
              onSave={(data) => {
                onCreateGoal(data);
                setShowNewGoal(false);
              }}
              onCancel={() => setShowNewGoal(false)}
            />
          )}
        </div>

        {/* Tasks Section */}
        {goals.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Tarefas</h4>
              <Badge variant="secondary" className="text-xs">
                {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
              </Badge>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                  <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                    {task.title}
                  </span>
                </div>
              ))}
              {tasks.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{tasks.length - 3} mais tarefas...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Broker Goal Mini Component
const BrokerGoalMini: React.FC<{
  goal: any;
  onUpdate: (id: string, data: any) => void;
  canEdit: boolean;
}> = ({ goal, onUpdate, canEdit }) => {
  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{goal.title}</span>
        <Badge variant="outline" className="text-xs">
          {goal.target_type === 'sales_count' ? 'Vendas' : 
           goal.target_type === 'revenue' ? 'Receita' :
           goal.target_type === 'vgv' ? 'VGV' : 'Comissão'}
        </Badge>
      </div>
      <Progress value={Math.min(progress, 100)} className="h-1.5" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {goal.target_type.includes('value') || goal.target_type.includes('revenue') || goal.target_type.includes('commission')
            ? formatCurrency(goal.current_value)
            : goal.current_value}
        </span>
        <span>
          {goal.target_type.includes('value') || goal.target_type.includes('revenue') || goal.target_type.includes('commission')
            ? formatCurrency(goal.target_value)
            : goal.target_value}
        </span>
      </div>
    </div>
  );
};

// Broker Goal Form Component
const BrokerGoalForm: React.FC<{
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    target_value: 0,
    target_type: 'sales_count'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.target_value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded">
      <div>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Título da meta"
          className="h-8 text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          value={formData.target_value}
          onChange={(e) => setFormData({...formData, target_value: parseFloat(e.target.value) || 0})}
          placeholder="Valor"
          className="h-8 text-sm"
          required
        />
        <Select value={formData.target_type} onValueChange={(value) => setFormData({...formData, target_type: value})}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales_count">Vendas</SelectItem>
            <SelectItem value="revenue">Receita</SelectItem>
            <SelectItem value="vgv">VGV</SelectItem>
            <SelectItem value="commission">Comissão</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          <Check className="w-3 h-3 mr-1" />
          Salvar
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          <X className="w-3 h-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default Metas;