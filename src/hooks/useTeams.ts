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
      console.log('Fetching teams...');
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      console.log('Teams fetch result:', { data, error });
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, team_id')
        .in('role', ['gerente', 'corretor'])
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
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
      const { data, error } = await supabase
        .from('profiles')
        .update({ team_id: teamId })
        .eq('id', memberId)
        .select('id, full_name, email, role, team_id')
        .single();

      if (error) throw error;

      // Also update the brokers table if the member is a corretor
      const member = teamMembers.find(m => m.id === memberId);
      if (member?.role === 'corretor') {
        await supabase
          .from('brokers')
          .update({ team_id: teamId })
          .eq('user_id', memberId);
      }

      setTeamMembers(prev => prev.map(member => 
        member.id === memberId ? data : member
      ));

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