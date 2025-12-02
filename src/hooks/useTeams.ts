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
  broker_id?: string;
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
      // Fetch brokers from brokers table
      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('id, name, email, team_id, status, user_id')
        .order('name');

      if (brokersError) throw brokersError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, team_id');

      if (profilesError) throw profilesError;

      // Fetch roles from user_roles
      const profileIds = (profilesData || []).map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profileIds);

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      // Get managers (users with gerente role)
      const managersData = (profilesData || []).filter(p => rolesMap.get(p.id) === 'gerente');

      // Combine brokers and managers
      const brokerMembers: TeamMember[] = (brokersData || []).map(broker => ({
        id: broker.user_id || broker.id,
        broker_id: broker.id,
        full_name: broker.name,
        email: broker.email,
        role: 'corretor',
        team_id: broker.team_id || undefined
      }));

      const managerMembers: TeamMember[] = managersData.map(manager => ({
        id: manager.id,
        broker_id: undefined,
        full_name: manager.full_name,
        email: manager.email,
        role: 'gerente',
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
      
      // Update profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update({ team_id: teamId })
        .eq('id', memberId)
        .select('id, full_name, email, team_id')
        .single();

      if (error) throw error;

      // Also update brokers table if member has broker_id
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

      // Refresh team members
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
