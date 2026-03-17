import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';
import {
  formatGoalValue,
  getGoalPeriodLabel,
  getGoalTypeLabel,
  normalizeGoalTargetType,
} from '@/lib/goals';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  target_type: string;
  period_type: string;
  start_date: string;
  end_date: string;
  status: string;
  assigned_to?: string;
  team_id?: string;
  broker_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  show_in_ranking?: boolean;
  show_in_tv?: boolean;
  unit_label?: string;
  tasks?: GoalTask[];
}

export { formatGoalValue, getGoalPeriodLabel, getGoalTypeLabel };

export interface GoalTask {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  task_type: string;
  task_category?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  target_quantity?: number;
  completed_quantity?: number;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, getUserRole, isAdmin, isDiretor, isGerente, isCorretor } = useAuth();

  const fetchGoals = async () => {
    try {
      setLoading(true);
      
      // RLS policies handle the filtering, so we just need to fetch
      // Directors/admins see all, managers see their team's, brokers see their own
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          tasks:goal_tasks(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: Partial<Goal>) => {
    try {
      if (!profile?.company_id) {
        toast({
          title: "Erro",
          description: "Empresa não identificada. Faça login novamente.",
          variant: "destructive",
        });
        throw new Error('company_id not found');
      }

      const userRole = getUserRole();
      const normalizedTargetType = normalizeGoalTargetType(goalData.target_type) || 'sales_count';

      // For managers, automatically set team_id to their team if not specified
      let teamId = goalData.team_id;
      if (userRole === 'gerente' && !teamId && profile?.team_id) {
        teamId = profile.team_id;
      }

      // Build insert object - only include fields with actual values
      // to avoid PostgREST 400 errors from undefined/null optional fields
      const insertData: Record<string, unknown> = {
        title: goalData.title || '',
        target_value: goalData.target_value || 0,
        current_value: goalData.current_value || 0,
        target_type: normalizedTargetType,
        period_type: goalData.period_type || 'monthly',
        start_date: goalData.start_date || new Date().toISOString().split('T')[0],
        end_date: goalData.end_date || new Date().toISOString().split('T')[0],
        status: goalData.status || 'active',
        created_by: user?.id,
        company_id: profile.company_id,
        show_in_ranking: goalData.show_in_ranking ?? false,
        show_in_tv: goalData.show_in_tv ?? false,
      };

      // Only include optional FK fields if they have truthy values
      if (goalData.description) insertData.description = goalData.description;
      if (goalData.assigned_to) insertData.assigned_to = goalData.assigned_to;
      if (teamId) insertData.team_id = teamId;
      if (goalData.broker_id) insertData.broker_id = goalData.broker_id;
      if (goalData.unit_label) insertData.unit_label = goalData.unit_label;

      const { data, error } = await supabase
        .from('goals')
        .insert(insertData as any)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      setGoals(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Meta criada com sucesso!",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast({
        title: "Erro",
        description: error?.message?.includes('row-level security')
          ? "Sem permissão para criar esta meta. Verifique seu perfil."
          : "Não foi possível criar a meta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      // First, check if user can update this goal
      const goal = goals.find(g => g.id === id);
      if (!goal) {
        throw new Error('Meta não encontrada');
      }

      // Only creator, admins, or directors can update
      // Managers can update goals in their team
      const canUpdate = 
        isAdmin() || 
        isDiretor() || 
        goal.created_by === user?.id ||
        goal.assigned_to === user?.id ||
        (isGerente() && goal.team_id === profile?.team_id);

      if (!canUpdate) {
        toast({
          title: "Erro",
          description: "Você só pode editar metas que você criou ou que estão atribuídas a você.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...data } : goal
      ));

      toast({
        title: "Sucesso",
        description: "Meta atualizada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      // First, check if user can delete this goal
      const goal = goals.find(g => g.id === id);
      if (!goal) {
        throw new Error('Meta não encontrada');
      }

      // Only creator, admins, or directors can delete
      // Managers can delete goals in their team
      const canDelete = 
        isAdmin() || 
        isDiretor() || 
        goal.created_by === user?.id ||
        (isGerente() && goal.team_id === profile?.team_id);

      if (!canDelete) {
        toast({
          title: "Erro",
          description: "Você só pode excluir metas que você criou.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast({
        title: "Sucesso",
        description: "Meta removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a meta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Check if user can edit a specific goal
  const canEditGoal = (goal: Goal): boolean => {
    if (isAdmin() || isDiretor()) return true;
    if (goal.created_by === user?.id) return true;
    if (goal.assigned_to === user?.id) return true;
    if (isGerente() && goal.team_id === profile?.team_id) return true;
    return false;
  };

  // Check if user can delete a specific goal
  const canDeleteGoal = (goal: Goal): boolean => {
    if (isAdmin() || isDiretor()) return true;
    if (goal.created_by === user?.id) return true;
    if (isGerente() && goal.team_id === profile?.team_id) return true;
    return false;
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    refreshGoals: fetchGoals,
    canEditGoal,
    canDeleteGoal,
  };
};