import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type LeadStatus = 'novo' | 'atendimento' | 'convertido' | 'perdido';
export type LeadSource = 'facebook' | 'instagram' | 'site' | 'manual' | 'whatsapp';

export interface Lead {
  id: string;
  company_id: string | null;
  agency_id: string | null;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  source: LeadSource | string;
  campaign: string | null;
  adset: string | null;
  ad: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  status: LeadStatus | string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined responsible profile
  responsible?: { id: string; full_name: string; email: string } | null;
}

export interface CreateLeadInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: LeadSource | string;
  campaign?: string | null;
  adset?: string | null;
  ad?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  user_id?: string | null;
  notes?: string | null;
}

export const useLeads = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads', profile?.company_id],
    enabled: !!user && !!profile?.company_id,
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          responsible:profiles!leads_user_id_fkey ( id, full_name, email )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any[]) as Lead[];
    },
  });

  const createLead = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const payload = {
        ...input,
        source: input.source || 'manual',
        status: 'novo',
        created_by: user?.id ?? null,
      };
      const { data, error } = await supabase
        .from('leads')
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso');
    },
    onError: (e: any) => toast.error(`Erro ao criar lead: ${e.message}`),
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (e: any) => toast.error(`Erro ao atualizar lead: ${e.message}`),
  });

  const assignLead = useMutation({
    mutationFn: async ({ leadId, brokerUserId }: { leadId: string; brokerUserId: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ user_id: brokerUserId, status: 'atendimento' } as any)
        .eq('id', leadId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead distribuído com sucesso');
    },
    onError: (e: any) => toast.error(`Erro ao distribuir: ${e.message}`),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead removido');
    },
    onError: (e: any) => toast.error(`Erro ao remover: ${e.message}`),
  });

  return {
    leads,
    loading: isLoading,
    error,
    createLead: createLead.mutateAsync,
    updateLead: updateLead.mutateAsync,
    assignLead: assignLead.mutateAsync,
    deleteLead: deleteLead.mutateAsync,
  };
};
