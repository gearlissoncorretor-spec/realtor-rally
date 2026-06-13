import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RoutineItem {
  id: string;
  user_id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completed_at: string | null;
  order_index: number;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoutineItem {
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string | null;
  priority?: 'low' | 'medium' | 'high';
  recurring?: boolean;
}

export function useRoutineItems(date: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['routine-items', date];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_items')
        .select('*')
        .eq('scheduled_date', date)
        .order('completed', { ascending: true })
        .order('order_index', { ascending: true })
        .order('scheduled_time', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as RoutineItem[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: CreateRoutineItem) => {
      const { data, error } = await supabase
        .from('routine_items')
        .insert({
          ...input,
          user_id: user!.id,
          priority: input.priority || 'medium',
        })
        .select()
        .single();
      if (error) throw error;
      return data as RoutineItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routine-items'] });
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar item'),
  });

  const toggle = useMutation({
    mutationFn: async (item: RoutineItem) => {
      const { error } = await supabase
        .from('routine_items')
        .update({
          completed: !item.completed,
          completed_at: !item.completed ? new Date().toISOString() : null,
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<RoutineItem[]>(key);
      qc.setQueryData<RoutineItem[]>(key, (old = []) =>
        old.map((i) =>
          i.id === item.id
            ? { ...i, completed: !i.completed, completed_at: !i.completed ? new Date().toISOString() : null }
            : i,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error('Erro ao atualizar');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['routine-items'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<RoutineItem> & { id: string }) => {
      const { error } = await supabase.from('routine_items').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine-items'] }),
    onError: () => toast.error('Erro ao salvar'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routine_items').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<RoutineItem[]>(key);
      qc.setQueryData<RoutineItem[]>(key, (old = []) => old.filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error('Erro ao excluir');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['routine-items'] }),
  });

  const items = query.data || [];
  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  return {
    items,
    isLoading: query.isLoading,
    completedCount,
    progress,
    create,
    toggle,
    update,
    remove,
  };
}
