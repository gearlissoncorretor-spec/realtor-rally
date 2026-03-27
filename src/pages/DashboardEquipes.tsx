import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Building, Calendar, Target, Trophy, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import DashboardFilters, { DashboardFiltersState } from '@/components/DashboardFilters';
import DashboardChart from '@/components/DashboardChart';
import Navigation from '@/components/Navigation';
import { calculateMonthlyData } from '@/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const formatCurrency = (value: number, compact = false) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    ...(compact ? { notation: 'compact' as const } : {}),
  }).format(value);

const DashboardEquipes = () => {
  const { profile } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { teams } = useTeams();

  const [filters, setFilters] = useState<DashboardFiltersState>({
    teamId: 'all',
    brokerId: 'all',
    month: 'all',
    year: 'all',
  });

  const filteredData = useMemo(() => {
    let filteredSales = (sales || []).filter(sale => sale.tipo !== 'captacao');
    let filteredBrokers = brokers || [];

    if (filters.teamId !== 'all') {
      filteredBrokers = filteredBrokers.filter(b => b.team_id === filters.teamId);
      filteredSales = filteredSales.filter(sale =>
        filteredBrokers.some(b => b.id === sale.broker_id),
      );
    }
    if (filters.brokerId !== 'all') {
      filteredSales = filteredSales.filter(s => s.broker_id === filters.brokerId);
      filteredBrokers = filteredBrokers.filter(b => b.id === filters.brokerId);
    }
    if (filters.month !== 'all') {
      filteredSales = filteredSales.filter(s => {
        if (!s.sale_date) return false;
        return (new Date(s.sale_date).getMonth() + 1).toString() === filters.month;
      });
    }
    if (filters.year !== 'all') {
      filteredSales = filteredSales.filter(s => {
        if (!s.sale_date) return false;
        return new Date(s.sale_date).getFullYear().toString() === filters.year;
      });
    }
    return { sales: filteredSales, brokers: filteredBrokers };
  }, [sales, brokers, filters]);

  const totalSales = filteredData.sales.length;
  const totalVGV = filteredData.sales.reduce((sum, s) => sum + (s.vgv || 0), 0);
  const totalBrokers = filteredData.brokers.length;
  const activeBrokers = filteredData.brokers.filter(b => b.status === 'ativo').length;
  const ticketMedio = totalSales > 0 ? totalVGV / totalSales : 0;

  const teamStats = useMemo(() => {
    let teamsToShow = teams;
    if (filters.teamId !== 'all') {
      teamsToShow = teams.filter(t => t.id === filters.teamId);
    }
    return teamsToShow
      .map(team => {
        const teamBrokers = (brokers || []).filter(b => b.team_id === team.id);
        let teamSales = (sales || []).filter(sale =>
          sale.tipo !== 'captacao' && teamBrokers.some(b => b.id === sale.broker_id),
        );
        if (filters.brokerId !== 'all') teamSales = teamSales.filter(s => s.broker_id === filters.brokerId);
        if (filters.month !== 'all')
          teamSales = teamSales.filter(s => s.sale_date && (new Date(s.sale_date).getMonth() + 1).toString() === filters.month);
        if (filters.year !== 'all')
          teamSales = teamSales.filter(s => s.sale_date && new Date(s.sale_date).getFullYear().toString() === filters.year);

        const confirmed = teamSales.filter(s => s.status === 'confirmada');
        return {
          id: team.id,
          name: team.name,
          sales: confirmed.length,
          vgv: confirmed.reduce((sum, s) => sum + (s.vgv || 0), 0),
          vgc: confirmed.reduce((sum, s) => sum + (s.vgc || 0), 0),
          brokers: teamBrokers.length,
          activeBrokers: teamBrokers.filter(b => b.status === 'ativo').length,
        };
      })
      .sort((a, b) => b.vgv - a.vgv);
  }, [teams, brokers, sales, filters]);

  const chartData = useMemo(() => calculateMonthlyData(filteredData.sales), [filteredData.sales]);

  const kpiCards = [
    {
      title: 'Total de Vendas',
      value: totalSales.toString(),
      subtitle: 'Vendas no período',
      icon: BarChart3,
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20',
    },
    {
      title: 'VGV Total',
      value: formatCurrency(totalVGV),
      subtitle: 'Valor geral de vendas',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Corretores Ativos',
      value: activeBrokers.toString(),
      subtitle: `de ${totalBrokers} corretores`,
      icon: Users,
      color: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(ticketMedio),
      subtitle: 'Média por venda',
      icon: Target,
      color: 'from-violet-500/20 to-violet-500/5',
      iconColor: 'text-violet-500',
      borderColor: 'border-violet-500/20',
    },
  ];

  const getMedalColor = (index: number) => {
    if (index === 0) return 'from-amber-400 to-yellow-600 text-white shadow-amber-500/30';
    if (index === 1) return 'from-slate-300 to-slate-400 text-white shadow-slate-400/30';
    if (index === 2) return 'from-orange-400 to-amber-700 text-white shadow-orange-500/30';
    return 'from-muted to-muted text-muted-foreground';
  };

  return (
    <>
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6 min-h-screen">
        <div className="space-y-6 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Dashboard de Equipes
              </h1>
              <p className="text-muted-foreground mt-1">
                Olá, <span className="font-medium text-foreground">{profile?.full_name}</span>. Análise completa do desempenho.
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-border/60">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Badge>
          </div>

          {/* Filters */}
          <DashboardFilters filters={filters} onFiltersChange={setFilters} />

          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title} className={`relative overflow-hidden border ${kpi.borderColor} transition-all hover:shadow-lg hover:-translate-y-0.5`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} pointer-events-none`} />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <div className={`h-9 w-9 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center ${kpi.iconColor}`}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold tracking-tight">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/60 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Desempenho Mensal — VGV
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DashboardChart data={chartData} type="bar" title="" height={280} />
              </CardContent>
            </Card>
            <Card className="border-border/60 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Evolução de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DashboardChart data={chartData} type="line" title="" height={280} />
              </CardContent>
            </Card>
          </div>

          {/* Team Ranking */}
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Ranking de Equipes
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Desempenho detalhado por equipe no período selecionado
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {teamStats.length} equipe{teamStats.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {teamStats.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {teamStats.map((team, index) => {
                    const progressPercent = teamStats[0]?.vgv > 0
                      ? Math.min((team.vgv / teamStats[0].vgv) * 100, 100)
                      : 0;

                    return (
                      <div
                        key={team.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-5 hover:bg-muted/30 transition-colors gap-4"
                      >
                        <div className="flex items-center gap-4">
                          {/* Position Badge */}
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${getMedalColor(index)} font-bold text-sm shadow-md flex-shrink-0`}
                          >
                            {index + 1}º
                          </div>
                          <div>
                            <p className="font-semibold text-base lg:text-lg">{team.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {team.activeBrokers} ativo{team.activeBrokers !== 1 ? 's' : ''} de {team.brokers}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 sm:gap-8 pl-14 sm:pl-0">
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Vendas</p>
                            <p className="font-bold text-xl tabular-nums mt-0.5">{team.sales}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">VGV</p>
                            <p className="font-bold text-xl text-primary tabular-nums mt-0.5">
                              {formatCurrency(team.vgv, true)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">VGC</p>
                            <p className="font-bold text-xl text-emerald-500 tabular-nums mt-0.5">
                              {formatCurrency(team.vgc, true)}
                            </p>
                          </div>
                          <div className="hidden md:block w-32">
                            <Progress value={progressPercent} className="h-2" />
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">{Math.round(progressPercent)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhuma equipe encontrada</p>
                  <p className="text-sm mt-1">Ajuste os filtros para visualizar os dados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DashboardEquipes;
