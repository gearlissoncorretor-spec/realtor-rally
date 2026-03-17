import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GoalType {
  id: string;
  name: string;
  value_format: 'currency' | 'integer' | 'percentage';
  description: string | null;
  is_active: boolean;
  is_system: boolean;
  order_index: number;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoalTypes() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: goalTypes = [], isLoading } = useQuery({
    queryKey: ['goal_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_types')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return (data || []) as unknown as GoalType[];
    },
  });

  const createGoalType = useMutation({
    mutationFn: async (goalType: Partial<GoalType>) => {
      const insertData: Record<string, unknown> = {
        ...goalType,
        company_id: profile?.company_id,
      };
      const { data, error } = await supabase
        .from('goal_types')
        .insert(insertData as any)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as unknown as GoalType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_types'] });
      toast.success('Tipo de meta criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar tipo de meta'),
  });

  return { goalTypes, isLoading, createGoalType };
}
