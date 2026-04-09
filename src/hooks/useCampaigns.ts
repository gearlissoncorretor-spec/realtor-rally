import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  title: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  meta_calls: number;
  created_by: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignParticipant {
  id: string;
  campaign_id: string;
  broker_id: string;
  calls: number;
  negotiations: number;
  captures: number;
  appointments: number;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignReport {
  id: string;
  campaign_id: string;
  total_calls: number;
  total_negotiations: number;
  total_captures: number;
  total_appointments: number;
  duration_minutes: number;
  conversion_rate: number;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useCampaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  // Fetch participants for active campaign
  const activeCampaign = campaigns.find(c => c.status === 'active');

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['campaign_participants', activeCampaign?.id],
    queryFn: async () => {
      if (!activeCampaign) return [];
      const { data, error } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('campaign_id', activeCampaign.id)
        .order('calls', { ascending: false });
      if (error) throw error;
      return data as CampaignParticipant[];
    },
    enabled: !!user && !!activeCampaign,
  });

  // Fetch reports
  const { data: reports = [] } = useQuery({
    queryKey: ['campaign_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CampaignReport[];
    },
    enabled: !!user,
  });

  // Create campaign
  const createCampaign = useMutation({
    mutationFn: async (input: { title: string; meta_calls: number; broker_ids: string[] }) => {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          title: input.title,
          meta_calls: input.meta_calls,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Add participants
      if (input.broker_ids.length > 0) {
        const participantsData = input.broker_ids.map(broker_id => ({
          campaign_id: campaign.id,
          broker_id,
        }));
        const { error: pError } = await supabase
          .from('campaign_participants')
          .insert(participantsData);
        if (pError) throw pError;
      }

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign_participants'] });
      toast({ title: 'Campanha criada', description: 'Campanha criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  // Start campaign
  const startCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: '🚀 Campanha iniciada!', description: 'Modo Ofertão ativado!' });
    },
  });

  // Pause campaign
  const pauseCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campanha pausada' });
    },
  });

  // Resume campaign
  const resumeCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: '▶️ Campanha retomada!' });
    },
  });

  // Finish campaign
  const finishCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      // Get participants for report
      const { data: parts } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('campaign_id', campaignId);

      const totalCalls = parts?.reduce((s, p) => s + p.calls, 0) || 0;
      const totalNegotiations = parts?.reduce((s, p) => s + p.negotiations, 0) || 0;
      const totalCaptures = parts?.reduce((s, p) => s + p.captures, 0) || 0;
      const totalAppointments = parts?.reduce((s, p) => s + p.appointments, 0) || 0;

      // Get campaign for duration
      const { data: camp } = await supabase
        .from('campaigns')
        .select('started_at')
        .eq('id', campaignId)
        .single();

      const durationMinutes = camp?.started_at
        ? Math.round((Date.now() - new Date(camp.started_at).getTime()) / 60000)
        : 0;

      const conversionRate = totalCalls > 0
        ? Number(((totalNegotiations / totalCalls) * 100).toFixed(2))
        : 0;

      // Create report
      const { error: rError } = await supabase
        .from('campaign_reports')
        .insert({
          campaign_id: campaignId,
          total_calls: totalCalls,
          total_negotiations: totalNegotiations,
          total_captures: totalCaptures,
          total_appointments: totalAppointments,
          duration_minutes: durationMinutes,
          conversion_rate: conversionRate,
        });
      if (rError) throw rError;

      // Update campaign status
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign_participants'] });
      queryClient.invalidateQueries({ queryKey: ['campaign_reports'] });
      toast({ title: '🏁 Campanha finalizada!', description: 'Relatório gerado automaticamente.' });
    },
  });

  // Increment participant counter
  const incrementCounter = useMutation({
    mutationFn: async ({ participantId, field, currentValue }: { participantId: string; field: 'calls' | 'negotiations' | 'captures' | 'appointments'; currentValue: number }) => {
      const { error } = await supabase
        .from('campaign_participants')
        .update({ [field]: currentValue + 1 })
        .eq('id', participantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign_participants'] });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const campaignsChannel = supabase
      .channel('campaigns_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      })
      .subscribe();

    const participantsChannel = supabase
      .channel('campaign_participants_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_participants' }, () => {
        queryClient.invalidateQueries({ queryKey: ['campaign_participants'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(campaignsChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [user, queryClient]);

  return {
    campaigns,
    activeCampaign,
    participants,
    reports,
    campaignsLoading,
    participantsLoading,
    createCampaign: createCampaign.mutateAsync,
    startCampaign: startCampaign.mutateAsync,
    pauseCampaign: pauseCampaign.mutateAsync,
    resumeCampaign: resumeCampaign.mutateAsync,
    finishCampaign: finishCampaign.mutateAsync,
    incrementCounter: incrementCounter.mutateAsync,
    isCreating: createCampaign.isPending,
  };
};
