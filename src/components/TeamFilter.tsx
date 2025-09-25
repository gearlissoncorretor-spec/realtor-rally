import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';

interface TeamFilterProps {
  selectedTeamId?: string;
  onTeamChange: (teamId: string | 'all') => void;
  label?: string;
  placeholder?: string;
  includeAllOption?: boolean;
}

const TeamFilter: React.FC<TeamFilterProps> = ({
  selectedTeamId,
  onTeamChange,
  label = "Filtrar por Equipe",
  placeholder = "Selecione uma equipe",
  includeAllOption = true
}) => {
  const { teams, loading } = useTeams();

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {label}
        </Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        {label}
      </Label>
      <Select value={selectedTeamId || 'all'} onValueChange={onTeamChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption && (
            <SelectItem value="all">Todas as Equipes</SelectItem>
          )}
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TeamFilter;