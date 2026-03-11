import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useSpotlightBroker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: spotlightBrokerId, isLoading } = useQuery({
    queryKey: ['spotlight-broker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('spotlight_broker_id')
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.spotlight_broker_id as string | null;
    },
    staleTime: 2 * 60 * 1000,
  });

  const setSpotlightMutation = useMutation({
    mutationFn: async (brokerId: string | null) => {
      const { data: existing } = await supabase
        .from('organization_settings')
        .select('id')
        .maybeSingle();

      if (!existing?.id) throw new Error('Settings not found');

      const { error } = await supabase
        .from('organization_settings')
        .update({ spotlight_broker_id: brokerId } as any)
        .eq('id', existing.id);

      if (error) throw error;
    },
    onMutate: async (brokerId) => {
      await queryClient.cancelQueries({ queryKey: ['spotlight-broker'] });
      const previous = queryClient.getQueryData(['spotlight-broker']);
      queryClient.setQueryData(['spotlight-broker'], brokerId);
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotlight-broker'] });
      toast({ title: 'Corretor destaque atualizado' });
    },
    onError: (err: any, _v, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['spotlight-broker'], context.previous);
      }
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });

  return {
    spotlightBrokerId,
    isLoading,
    setSpotlightBroker: setSpotlightMutation.mutate,
    isUpdating: setSpotlightMutation.isPending,
  };
};
