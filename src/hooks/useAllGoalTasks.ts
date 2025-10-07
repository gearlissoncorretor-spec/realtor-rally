import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { GoalTask } from './useGoals';

export const useAllGoalTasks = () => {
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, getUserRole, profile } = useAuth();

  const fetchAllTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const rawRole = getUserRole();
      const userRole = rawRole === 'admin' ? 'diretor' : rawRole;

      let query = supabase
        .from('goal_tasks')
        .select(`
          *,
          goals (
            id,
            title,
            broker_id,
            team_id,
            assigned_to
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (userRole === 'corretor') {
        // Brokers see only their own tasks
        query = query.eq('assigned_to', user.id);
      }
      // Directors and managers can see all tasks (RLS will handle the filtering)

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data as GoalTask[] || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<GoalTask>) => {
    try {
      const { data, error } = await supabase
        .from('goal_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...data } : task
      ));

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [user]);

  return {
    tasks,
    loading,
    updateTask,
    refreshTasks: fetchAllTasks,
  };
};
