import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  created_at: string;
  updated_at: string;
  tasks?: GoalTask[];
}

export interface GoalTask {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoals = async () => {
    try {
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
      const insertData = {
        title: goalData.title || '',
        description: goalData.description,
        target_value: goalData.target_value || 0,
        current_value: goalData.current_value || 0,
        target_type: goalData.target_type || 'sales_count',
        period_type: goalData.period_type || 'monthly',
        start_date: goalData.start_date || new Date().toISOString().split('T')[0],
        end_date: goalData.end_date || new Date().toISOString().split('T')[0],
        status: goalData.status || 'active',
        assigned_to: goalData.assigned_to,
        team_id: goalData.team_id,
        broker_id: goalData.broker_id,
        created_by: user?.id,
      };

      const { data, error } = await supabase
        .from('goals')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Meta criada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
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

  useEffect(() => {
    fetchGoals();
  }, []);

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    refreshGoals: fetchGoals,
  };
};