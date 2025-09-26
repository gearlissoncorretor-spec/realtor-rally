import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { GoalTask } from './useGoals';

export const useGoalTasks = (goalId?: string) => {
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTasks = async (id?: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goal_tasks')
        .select('*')
        .eq('goal_id', id)
        .order('created_at', { ascending: false });

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

  const createTask = async (taskData: Partial<GoalTask>) => {
    try {
      const { data, error } = await supabase
        .from('goal_tasks')
        .insert([{
          ...taskData,
          goal_id: goalId,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data as GoalTask, ...prev]);
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa.",
        variant: "destructive",
      });
      throw error;
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

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goal_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      toast({
        title: "Sucesso",
        description: "Tarefa removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a tarefa.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (goalId) {
      fetchTasks(goalId);
    }
  }, [goalId]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: () => fetchTasks(goalId),
  };
};