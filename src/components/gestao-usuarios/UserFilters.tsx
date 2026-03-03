import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  teamFilter: string;
  onTeamFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  teams: { id: string; name: string }[];
}

const UserFilters: React.FC<UserFiltersProps> = ({
  search, onSearchChange,
  roleFilter, onRoleFilterChange,
  teamFilter, onTeamFilterChange,
  statusFilter, onStatusFilterChange,
  teams
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Perfil" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Perfis</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="diretor">Diretor</SelectItem>
          <SelectItem value="gerente">Gerente</SelectItem>
          <SelectItem value="corretor">Corretor</SelectItem>
        </SelectContent>
      </Select>
      <Select value={teamFilter} onValueChange={onTeamFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Equipe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Equipes</SelectItem>
          <SelectItem value="none">Sem Equipe</SelectItem>
          {teams.map(team => (
            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="ativo">Ativo</SelectItem>
          <SelectItem value="inativo">Inativo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserFilters;
