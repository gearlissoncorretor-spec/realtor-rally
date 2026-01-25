import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useTeams } from '@/hooks/useTeams';

interface ContextualIdentity {
  displayName: string;
  subtitle: string | null;
  showOrgBranding: boolean;
}

export const useContextualIdentity = (): ContextualIdentity => {
  const { profile, getUserRole, teamHierarchy } = useAuth();
  const { settings } = useOrganizationSettings();
  const { teams } = useTeams();

  const identity = useMemo(() => {
    const role = getUserRole();

    // Diretor/Admin: Show organization name
    if (role === 'diretor' || role === 'admin') {
      return {
        displayName: settings?.organization_name || 'Sua Imobiliária',
        subtitle: settings?.organization_tagline || null,
        showOrgBranding: true,
      };
    }

    // Gerente: Show team name
    if (role === 'gerente') {
      const teamName = teamHierarchy?.team_name;
      if (teamName) {
        return {
          displayName: teamName,
          subtitle: 'Equipe',
          showOrgBranding: false,
        };
      }
      // Fallback if no team assigned
      return {
        displayName: profile?.full_name || 'Gerente',
        subtitle: 'Sem equipe vinculada',
        showOrgBranding: false,
      };
    }

    // Corretor: Show team name or personal context
    if (role === 'corretor') {
      // Find broker's team from teamHierarchy or profile
      const teamId = profile?.team_id;
      const team = teams.find(t => t.id === teamId);
      
      if (team) {
        return {
          displayName: team.name,
          subtitle: 'Corretor',
          showOrgBranding: false,
        };
      }

      // Fallback to personal name
      return {
        displayName: profile?.full_name || 'Corretor',
        subtitle: null,
        showOrgBranding: false,
      };
    }

    // Default fallback
    return {
      displayName: settings?.organization_name || 'Sistema',
      subtitle: null,
      showOrgBranding: true,
    };
  }, [profile, getUserRole, teamHierarchy, settings, teams]);

  return identity;
};
