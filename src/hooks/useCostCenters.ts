import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';

export interface CostCenter {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  active: boolean;
  company_id: string;
  agency_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostCenterInsert {
  name: string;
  description?: string | null;
  color?: string | null;
  active?: boolean;
  agency_id?: string | null;
}

export const useCostCenters = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const { selectedAgencyId } = useAgency();

  const { data: costCenters = [], isLoading } = useQuery({
    queryKey: ['cost_centers', user?.id, selectedAgencyId],
    queryFn: async () => {
      let query = supabase.from('cost_centers').select('*');
      if (selectedAgencyId && selectedAgencyId !== 'all') {
        query = query.or(`agency_id.eq.${selectedAgencyId},agency_id.is.null`);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return (data || []) as CostCenter[];
    },
    enabled: !!user && !authLoading,
  });

  const create = useMutation({
    mutationFn: async (input: CostCenterInsert) => {
      if (!profile?.company_id) throw new Error('Empresa não identificada');
      const { error } = await supabase.from('cost_centers').insert({
        ...input,
        company_id: profile.company_id,
        agency_id: input.agency_id ?? profile.agency_id ?? null,
        created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cost_centers'] });
      toast({ title: 'Centro de custo criado' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CostCenter> & { id: string }) => {
      const { error } = await supabase.from('cost_centers').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cost_centers'] });
      toast({ title: 'Centro de custo atualizado' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cost_centers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cost_centers'] });
      toast({ title: 'Centro de custo removido' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  return {
    costCenters,
    loading: isLoading,
    createCostCenter: create.mutateAsync,
    updateCostCenter: update.mutateAsync,
    deleteCostCenter: remove.mutateAsync,
  };
};
