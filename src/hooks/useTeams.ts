import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schemas
const teamSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  description: z.string().trim().max(500, 'Descrição muito longa').optional()
});

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  broker_id?: string; // ID from brokers table (if it's a broker)
  full_name: string;
  email: string;
  role: string;
  team_id?: string;
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Erro ao carregar equipes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Buscar corretores da tabela brokers
      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('id, name, email, team_id, status, user_id')
        .order('name');

      if (brokersError) throw brokersError;

      // Buscar gerentes da tabela profiles
      const { data: managersData, error: managersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, team_id')
        .eq('role', 'gerente');

      if (managersError) throw managersError;

      // Combinar corretores e gerentes
      const brokerMembers = (brokersData || []).map(broker => ({
        id: broker.user_id || broker.id, // Use user_id for profile updates
        broker_id: broker.id, // Keep broker_id for broker table updates
        full_name: broker.name,
        email: broker.email,
        role: 'corretor',
        team_id: broker.team_id || undefined
      }));

      const managerMembers = (managersData || []).map(manager => ({
        id: manager.id,
        broker_id: undefined, // Managers don't have broker records
        full_name: manager.full_name,
        email: manager.email,
        role: manager.role,
        team_id: manager.team_id || undefined
      }));

      setTeamMembers([...brokerMembers, ...managerMembers]);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Erro ao carregar membros",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createTeam = async (teamData: { name: string; description?: string }) => {
    try {
      // Validate input
      const validatedData = teamSchema.parse(teamData);

      const { data, error } = await supabase
        .from('teams')
        .insert([{
          name: validatedData.name,
          description: validatedData.description || null
        }])
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => [...prev, data]);
      toast({
        title: "Equipe criada",
        description: `Equipe "${data.name}" criada com sucesso.`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating team:', error);
      const errorMessage = error instanceof z.ZodError 
        ? error.errors[0].message 
        : error.message;
      
      toast({
        title: "Erro ao criar equipe",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateTeam = async (id: string, teamData: { name: string; description?: string }) => {
    try {
      // Validate input
      const validatedData = teamSchema.parse(teamData);

      const { data, error } = await supabase
        .from('teams')
        .update({
          name: validatedData.name,
          description: validatedData.description || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => prev.map(team => team.id === id ? data : team));
      toast({
        title: "Equipe atualizada",
        description: `Equipe "${data.name}" atualizada com sucesso.`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating team:', error);
      const errorMessage = error instanceof z.ZodError 
        ? error.errors[0].message 
        : error.message;
      
      toast({
        title: "Erro ao atualizar equipe",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTeams(prev => prev.filter(team => team.id !== id));
      toast({
        title: "Equipe excluída",
        description: "Equipe excluída com sucesso.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast({
        title: "Erro ao excluir equipe",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const assignMemberToTeam = async (memberId: string, teamId: string | null) => {
    try {
      console.log('Assigning member to team:', { memberId, teamId });
      
      const member = teamMembers.find(m => m.id === memberId);
      
      // Update profiles table (for all users)
      const { data, error } = await supabase
        .from('profiles')
        .update({ team_id: teamId })
        .eq('id', memberId)
        .select('id, full_name, email, role, team_id')
        .single();

      if (error) throw error;

      // CRITICAL: Also update brokers table using broker_id (this is what matters for sales tracking)
      if (member?.broker_id) {
        const { error: brokerError } = await supabase
          .from('brokers')
          .update({ team_id: teamId })
          .eq('id', member.broker_id);
        
        if (brokerError) {
          console.error('Error updating broker:', brokerError);
          throw brokerError;
        }
        console.log('Broker table updated successfully for broker_id:', member.broker_id);
      }

      // Refresh team members to get updated data
      await fetchTeamMembers();

      toast({
        title: "Membro atualizado",
        description: `Membro ${teamId ? 'adicionado à equipe' : 'removido da equipe'} com sucesso.`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error assigning member to team:', error);
      toast({
        title: "Erro ao atualizar membro",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTeams(), fetchTeamMembers()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    teams,
    teamMembers,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    assignMemberToTeam,
    refreshTeams: fetchTeams,
    refreshTeamMembers: fetchTeamMembers,
  };
};