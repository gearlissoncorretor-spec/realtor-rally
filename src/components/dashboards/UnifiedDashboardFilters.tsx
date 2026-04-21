import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Users, LayoutGrid, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UnifiedDashboardFiltersState {
  month: number;
  year: number;
  teamId: string;
  periodLabel?: string;
}

interface UnifiedDashboardFiltersProps {
  filters: UnifiedDashboardFiltersState;
  onFiltersChange: (filters: UnifiedDashboardFiltersState) => void;
  teams: any[];
}

const UnifiedDashboardFilters: React.FC<UnifiedDashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  teams,
}) => {
  const months = [
    { value: 0, label: 'Todos os meses' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [
    { value: 0, label: 'Todos os anos' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: (currentYear - i).toString(),
    })),
  ];

  const handleQuickFilter = (type: 'today' | '7days' | 'month') => {
    const now = new Date();
    if (type === 'today') {
      onFiltersChange({ ...filters, month: now.getMonth() + 1, year: now.getFullYear(), periodLabel: 'hoje' });
    } else if (type === '7days') {
      onFiltersChange({ ...filters, month: now.getMonth() + 1, year: now.getFullYear(), periodLabel: '7dias' });
    } else if (type === 'month') {
      onFiltersChange({ ...filters, month: now.getMonth() + 1, year: now.getFullYear(), periodLabel: 'mes' });
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-md border-border/50 mb-6 animate-fade-in shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Filtros Globais</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filters.month.toString()}
              onValueChange={(value) => onFiltersChange({ ...filters, month: parseInt(value), periodLabel: undefined })}
            >
              <SelectTrigger className="w-[140px] h-9 bg-background/50">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filters.year.toString()}
              onValueChange={(value) => onFiltersChange({ ...filters, year: parseInt(value), periodLabel: undefined })}
            >
              <SelectTrigger className="w-[100px] h-9 bg-background/50">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.value} value={y.value.toString()}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border/50 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filters.teamId}
              onValueChange={(value) => onFiltersChange({ ...filters, teamId: value })}
            >
              <SelectTrigger className="w-[180px] h-9 bg-background/50">
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Equipes</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg self-end lg:self-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 text-[11px] font-bold uppercase tracking-tight px-3", filters.periodLabel === 'today' && "bg-background shadow-sm")}
            onClick={() => handleQuickFilter('today')}
          >
            Hoje
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 text-[11px] font-bold uppercase tracking-tight px-3", filters.periodLabel === '7dias' && "bg-background shadow-sm")}
            onClick={() => handleQuickFilter('7days')}
          >
            7 dias
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 text-[11px] font-bold uppercase tracking-tight px-3", filters.periodLabel === 'mes' && "bg-background shadow-sm")}
            onClick={() => handleQuickFilter('month')}
          >
            Este mês
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UnifiedDashboardFilters;
