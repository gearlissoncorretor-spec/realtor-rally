import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface OrganizationSettings {
  id: string;
  organization_name: string;
  organization_tagline: string | null;
  logo_url: string | null;
  logo_icon_url: string | null;
  primary_color: string;
}

export const useOrganizationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['organization-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as OrganizationSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<OrganizationSettings>) => {
      if (!settings?.id) throw new Error('Settings not found');

      const { data, error } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast({
        title: 'Configurações atualizadas',
        description: 'As configurações de branding foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
