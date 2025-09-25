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
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="w-5 h-5" />
          Filtros de Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${hideTeamFilter ? '3' : '4'} xl:grid-cols-${hideTeamFilter ? '4' : '5'} gap-4`}>
          {/* Team Filter - Only show for directors */}
          {!hideTeamFilter && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                Equipe
              </Label>
              <Select 
                value={filters.teamId} 
                onValueChange={(value) => handleFilterChange('teamId', value)}
                disabled={teamsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as equipes" />
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
            </div>
          )}

          {/* Broker Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4" />
              Corretor
            </Label>
            <Select 
              value={filters.brokerId} 
              onValueChange={(value) => handleFilterChange('brokerId', value)}
              disabled={brokersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os corretores" />
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
          </div>

          {/* Month Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Mês
            </Label>
            <Select 
              value={filters.month} 
              onValueChange={(value) => handleFilterChange('month', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os meses" />
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
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Ano
            </Label>
            <Select 
              value={filters.year} 
              onValueChange={(value) => handleFilterChange('year', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os anos" />
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
          </div>

          {/* Clear Filters Button */}
          <div className="space-y-2">
            <Label className="text-sm font-medium opacity-0">Limpar</Label>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filtros ativos:</span>
              {!hideTeamFilter && filters.teamId !== 'all' && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                  Equipe: {teams.find(t => t.id === filters.teamId)?.name}
                </span>
              )}
              {filters.brokerId !== 'all' && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                  Corretor: {brokers.find(b => b.id === filters.brokerId)?.name}
                </span>
              )}
              {filters.month !== 'all' && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                  Mês: {months.find(m => m.value === filters.month)?.label}
                </span>
              )}
              {filters.year !== 'all' && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                  Ano: {filters.year}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;