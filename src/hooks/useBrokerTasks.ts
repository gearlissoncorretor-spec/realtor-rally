import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface BrokerTask {
  id: string;
  broker_id: string;
  column_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  property_reference: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  broker?: {
    id: string;
    name: string;
    avatar_url: string | null;
    team_id: string | null;
  };
  column?: {
    id: string;
    title: string;
    color: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface TaskHistory {
  id: string;
  task_id: string;
  user_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user?: {
    full_name: string;
  };
}

export interface CreateTaskData {
  broker_id: string;
  column_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  property_reference?: string;
}

export const useBrokerTasks = (brokerId?: string) => {
  const [tasks, setTasks] = useState<BrokerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      let query = supabase
        .from('broker_tasks')
        .select(`
          *,
          broker:brokers(id, name, avatar_url, team_id),
          column:process_stages(id, title, color)
        `)
        .order('created_at', { ascending: false });

      if (brokerId) {
        query = query.eq('broker_id', brokerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks((data as unknown as BrokerTask[]) || []);
    } catch (error) {
      console.error('Error fetching broker tasks:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tarefas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, brokerId, toast]);

  const createTask = async (taskData: CreateTaskData) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('broker_tasks')
        .insert({
          ...taskData,
          created_by: user.id,
        })
        .select(`
          *,
          broker:brokers(id, name, avatar_url, team_id),
          column:process_stages(id, title, color)
        `)
        .single();

      if (error) throw error;

      // Log history
      await supabase.from('task_history').insert({
        task_id: data.id,
        user_id: user.id,
        action: 'created',
        new_value: taskData.title,
      });

      setTasks(prev => [data as unknown as BrokerTask, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<BrokerTask>, logAction?: string) => {
    if (!user) return;

    try {
      const oldTask = tasks.find(t => t.id === taskId);

      const { data, error } = await supabase
        .from('broker_tasks')
        .update(updates)
        .eq('id', taskId)
        .select(`
          *,
          broker:brokers(id, name, avatar_url, team_id),
          column:process_stages(id, title, color)
        `)
        .single();

      if (error) throw error;

      // Log history for column changes
      if (updates.column_id && oldTask && oldTask.column_id !== updates.column_id) {
        await supabase.from('task_history').insert({
          task_id: taskId,
          user_id: user.id,
          action: 'moved',
          old_value: oldTask.column?.title || oldTask.column_id,
          new_value: (data as any).column?.title || updates.column_id,
        });
      } else if (logAction) {
        await supabase.from('task_history').insert({
          task_id: taskId,
          user_id: user.id,
          action: logAction,
          old_value: JSON.stringify(oldTask),
          new_value: JSON.stringify(updates),
        });
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? (data as unknown as BrokerTask) : task
      ));

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('broker_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));

      toast({
        title: "Sucesso",
        description: "Tarefa removida com sucesso",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover tarefa",
        variant: "destructive",
      });
      throw error;
    }
  };

  const moveTask = async (taskId: string, newColumnId: string) => {
    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, column_id: newColumnId } : task
    ));

    try {
      await updateTask(taskId, { column_id: newColumnId });
    } catch (error) {
      // Revert on error
      await fetchTasks();
    }
  };

  // Fetch comments for a task
  const fetchComments = async (taskId: string): Promise<TaskComment[]> => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as unknown as TaskComment[]) || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const addComment = async (taskId: string, content: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
        })
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Log history
      await supabase.from('task_history').insert({
        task_id: taskId,
        user_id: user.id,
        action: 'commented',
        new_value: content.substring(0, 100),
      });

      return data as unknown as TaskComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Fetch history for a task
  const fetchHistory = async (taskId: string): Promise<TaskHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('task_history')
        .select(`
          *,
          user:profiles(full_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as TaskHistory[]) || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription
    const channel = supabase
      .channel('broker_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broker_tasks'
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    fetchComments,
    addComment,
    fetchHistory,
    refreshTasks: fetchTasks,
  };
};
