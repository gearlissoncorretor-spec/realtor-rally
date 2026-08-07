import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
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
  assigned_at?: string | null;
  first_contact_at?: string | null;
  follow_up_id?: string | null;
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
  const { selectedAgencyId } = useAgency();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads', profile?.company_id, selectedAgencyId],
    enabled: !!user && !!profile?.company_id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Lead[]> => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          responsible:profiles!leads_user_id_fkey ( id, full_name, email )
        `);

      if (selectedAgencyId !== 'all') {
        query = query.eq('agency_id', selectedAgencyId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1000);

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
        .update({ user_id: brokerUserId, status: 'novo', assigned_at: new Date().toISOString() } as any)
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

  // Corretor inicia o atendimento: grava o horário e transfere o lead para Clientes
  const startService = useMutation({
    mutationFn: async (lead: Lead) => {
      const now = new Date().toISOString();

      let followUpId = lead.follow_up_id ?? null;

      if (!followUpId) {
        const { data: broker } = await supabase
          .from('brokers')
          .select('id')
          .eq('user_id', lead.user_id ?? user?.id ?? '')
          .maybeSingle();

        if (!broker?.id) {
          throw new Error('Corretor responsável não encontrado no cadastro de corretores.');
        }

        const { data: followUp, error: followUpError } = await supabase
          .from('follow_ups')
          .insert({
            broker_id: broker.id,
            client_name: lead.name,
            client_phone: lead.phone,
            origem: lead.source || 'lead',
            status: 'Primeiro contato',
            observations: [lead.campaign ? `Campanha: ${lead.campaign}` : null, lead.notes]
              .filter(Boolean)
              .join('\n') || null,
            created_by: user?.id ?? null,
            company_id: lead.company_id,
            agency_id: lead.agency_id,
          } as any)
          .select('id')
          .single();

        if (followUpError) throw followUpError;
        followUpId = followUp.id;
      }

      const { error } = await supabase
        .from('leads')
        .update({
          status: 'atendimento',
          first_contact_at: lead.first_contact_at ?? now,
          follow_up_id: followUpId,
        } as any)
        .eq('id', lead.id);
      if (error) throw error;

      return followUpId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      toast.success('Atendimento iniciado — cliente criado na tela de Clientes');
    },
    onError: (e: any) => toast.error(`Erro ao iniciar atendimento: ${e.message}`),
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
    startService: startService.mutateAsync,
    startingService: startService.isPending,
    deleteLead: deleteLead.mutateAsync,
  };
};
