import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FollowUp {
  id: string;
  broker_id: string;
  client_name: string;
  client_phone: string | null;
  property_interest: string | null;
  estimated_vgv: number;
  next_contact_date: string | null;
  observations: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  brokers?: {
    id: string;
    name: string;
    team_id: string | null;
  };
}

export interface FollowUpContact {
  id: string;
  follow_up_id: string;
  contact_type: string;
  contact_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FollowUpStatus {
  id: string;
  value: string;
  label: string;
  color: string;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  is_system: boolean;
}

export interface CreateFollowUpInput {
  broker_id: string;
  client_name: string;
  client_phone?: string;
  property_interest?: string;
  estimated_vgv: number;
  next_contact_date?: string;
  observations?: string;
  status?: string;
}

export const useFollowUps = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch statuses
  const { data: statuses = [], isLoading: loadingStatuses } = useQuery({
    queryKey: ['follow-up-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_statuses')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      return data as FollowUpStatus[];
    },
  });

  // Fetch follow-ups
  const { data: followUps = [], isLoading: loadingFollowUps, refetch } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          brokers (id, name, team_id)
        `)
        .order('next_contact_date', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as FollowUp[];
    },
  });

  // Create follow-up
  const createMutation = useMutation({
    mutationFn: async (input: CreateFollowUpInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('follow_ups')
        .insert({
          ...input,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      toast({ title: 'Follow up criado', description: 'Cliente adicionado com sucesso.' });
    },
    onError: (error) => {
      console.error('Error creating follow up:', error);
      toast({ title: 'Erro', description: 'Não foi possível criar o follow up.', variant: 'destructive' });
    },
  });

  // Update follow-up
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FollowUp> & { id: string }) => {
      const { data, error } = await supabase
        .from('follow_ups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      toast({ title: 'Follow up atualizado', description: 'As alterações foram salvas.' });
    },
    onError: (error) => {
      console.error('Error updating follow up:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o follow up.', variant: 'destructive' });
    },
  });

  // Delete follow-up
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      toast({ title: 'Follow up excluído', description: 'O cliente foi removido.' });
    },
    onError: (error) => {
      console.error('Error deleting follow up:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir o follow up.', variant: 'destructive' });
    },
  });

  // Convert to negotiation
  const convertToNegotiation = useMutation({
    mutationFn: async (followUp: FollowUp) => {
      // Create negotiation
      const { error: negError } = await supabase
        .from('negotiations')
        .insert({
          broker_id: followUp.broker_id,
          client_name: followUp.client_name,
          client_phone: followUp.client_phone,
          property_address: followUp.property_interest || 'A definir',
          property_type: 'apartamento',
          negotiated_value: followUp.estimated_vgv,
          status: 'em_contato',
          observations: `Convertido de Follow Up. ${followUp.observations || ''}`.trim(),
        });
      
      if (negError) throw negError;

      // Delete follow-up
      const { error: delError } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', followUp.id);
      
      if (delError) throw delError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      toast({ 
        title: 'Convertido para negociação!', 
        description: 'O cliente foi movido para a tela de Negociações.' 
      });
    },
    onError: (error) => {
      console.error('Error converting to negotiation:', error);
      toast({ title: 'Erro', description: 'Não foi possível converter para negociação.', variant: 'destructive' });
    },
  });

  // Add contact history
  const addContactMutation = useMutation({
    mutationFn: async ({ followUpId, contactType, notes }: { followUpId: string; contactType: string; notes?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('follow_up_contacts')
        .insert({
          follow_up_id: followUpId,
          contact_type: contactType,
          notes,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-contacts'] });
      toast({ title: 'Contato registrado', description: 'O histórico foi atualizado.' });
    },
    onError: (error) => {
      console.error('Error adding contact:', error);
      toast({ title: 'Erro', description: 'Não foi possível registrar o contato.', variant: 'destructive' });
    },
  });

  // Get status helpers
  const getStatusByValue = (value: string) => statuses.find(s => s.value === value);

  // Calculate stats
  const stats = {
    total: followUps.length,
    dueToday: followUps.filter(f => {
      if (!f.next_contact_date) return false;
      const today = new Date().toISOString().split('T')[0];
      return f.next_contact_date === today;
    }).length,
    overdue: followUps.filter(f => {
      if (!f.next_contact_date) return false;
      const today = new Date().toISOString().split('T')[0];
      return f.next_contact_date < today;
    }).length,
    vgvPotential: followUps.reduce((sum, f) => sum + Number(f.estimated_vgv), 0),
  };

  return {
    followUps,
    statuses,
    stats,
    loading: loadingFollowUps || loadingStatuses,
    refetch,
    createFollowUp: createMutation.mutateAsync,
    updateFollowUp: updateMutation.mutateAsync,
    deleteFollowUp: deleteMutation.mutateAsync,
    convertToNegotiation: convertToNegotiation.mutateAsync,
    addContact: addContactMutation.mutateAsync,
    getStatusByValue,
  };
};
