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
  secondary_color: string | null;
  support_phone: string | null;
  spotlight_broker_id: string | null;
  company_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
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
        .maybeSingle();

      if (error) throw error;
      return data as OrganizationSettings | null;
    },
    staleTime: 5 * 60 * 1000,
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

  // Upload logo to Supabase Storage
  const uploadLogo = async (file: File, type: 'logo' | 'icon'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Get the effective logo URL (upload > URL > null)
  const getEffectiveLogo = (): string | null => {
    return settings?.logo_icon_url || settings?.logo_url || null;
  };

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    uploadLogo,
    getEffectiveLogo,
  };
};
