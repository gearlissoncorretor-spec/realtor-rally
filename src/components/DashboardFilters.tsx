import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Filter, Users, User, Calendar, RotateCcw } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useBrokers } from '@/hooks/useBrokers';

export interface DashboardFiltersState {
  teamId: string;
  brokerId: string;
  month: string;
  year: string;
}

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  onFiltersChange: (filters: DashboardFiltersState) => void;
  hideTeamFilter?: boolean;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  hideTeamFilter = false
}) => {
  const { teams, loading: teamsLoading } = useTeams();
  const { brokers, loading: brokersLoading } = useBrokers();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const handleFilterChange = (key: keyof DashboardFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      teamId: 'all',
      brokerId: 'all',
      month: 'all',
      year: 'all'
    });
  };

  const hasActiveFilters = (!hideTeamFilter && filters.teamId !== 'all') || 
                          filters.brokerId !== 'all' || 
                          filters.month !== 'all' || 
                          filters.year !== 'all';

  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
          </div>

          {!hideTeamFilter && (
            <Select
              value={filters.teamId}
              onValueChange={(value) => handleFilterChange('teamId', value)}
              disabled={teamsLoading}
            >
              <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
                <Users className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={filters.brokerId}
            onValueChange={(value) => handleFilterChange('brokerId', value)}
            disabled={brokersLoading}
          >
            <SelectTrigger className="h-9 w-auto min-w-[150px] text-sm">
              <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Corretor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os corretores</SelectItem>
              {brokers.map((broker) => (
                <SelectItem key={broker.id} value={broker.id}>
                  {broker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.month}
            onValueChange={(value) => handleFilterChange('month', value)}
          >
            <SelectTrigger className="h-9 w-auto min-w-[120px] text-sm">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.year}
            onValueChange={(value) => handleFilterChange('year', value)}
          >
            <SelectTrigger className="h-9 w-auto min-w-[100px] text-sm">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 px-2 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;