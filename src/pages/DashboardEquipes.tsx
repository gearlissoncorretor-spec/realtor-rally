import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Building, Calendar, Target, Trophy, DollarSign, Package, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import DashboardFilters, { DashboardFiltersState } from '@/components/DashboardFilters';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const fmt = (value: number, compact = false) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    ...(compact ? { notation: 'compact' as const } : {}),
  }).format(value);

const applyPeriodFilter = (sales: any[], filters: DashboardFiltersState) => {
  let result = sales;
  if (filters.month !== 'all') {
    result = result.filter(s => s.sale_date && (new Date(s.sale_date).getMonth() + 1).toString() === filters.month);
  }
  if (filters.year !== 'all') {
    result = result.filter(s => s.sale_date && new Date(s.sale_date).getFullYear().toString() === filters.year);
  }
  return result;
};

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

  // Core filtered data — separating venda vs captação
  const { vendas, captacoes, filteredBrokers } = useMemo(() => {
    const allSales = sales || [];
    let fBrokers = brokers || [];

    if (filters.teamId !== 'all') {
      fBrokers = fBrokers.filter(b => b.team_id === filters.teamId);
    }
    if (filters.brokerId !== 'all') {
      fBrokers = fBrokers.filter(b => b.id === filters.brokerId);
    }

    const brokerIds = new Set(fBrokers.map(b => b.id));
    const byBroker = (s: any) => filters.teamId === 'all' && filters.brokerId === 'all' ? true : brokerIds.has(s.broker_id);

    const vendasRaw = applyPeriodFilter(allSales.filter(s => s.tipo !== 'captacao' && byBroker(s)), filters);
    const captacoesRaw = applyPeriodFilter(allSales.filter(s => s.tipo === 'captacao' && byBroker(s)), filters);

    return { vendas: vendasRaw, captacoes: captacoesRaw, filteredBrokers: fBrokers };
  }, [sales, brokers, filters]);

  // Only confirmed sales count for VGV
  const confirmedVendas = vendas.filter(s => s.status === 'confirmada');
  const totalVGV = confirmedVendas.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
  const totalVGC = confirmedVendas.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
  const totalSales = confirmedVendas.length;
  const ticketMedio = totalSales > 0 ? totalVGV / totalSales : 0;
  const activeBrokers = filteredBrokers.filter(b => b.status === 'ativo').length;

  // Team stats
  const teamStats = useMemo(() => {
    const teamsToShow = filters.teamId !== 'all' ? (teams || []).filter(t => t.id === filters.teamId) : (teams || []);
    const allBrokers = brokers || [];
    const allSales = sales || [];

    return teamsToShow
      .map(team => {
        const tBrokers = allBrokers.filter(b => b.team_id === team.id);
        const tBrokerIds = new Set(tBrokers.map(b => b.id));

        let tSales = allSales.filter(s => s.tipo !== 'captacao' && tBrokerIds.has(s.broker_id));
        if (filters.brokerId !== 'all') tSales = tSales.filter(s => s.broker_id === filters.brokerId);
        tSales = applyPeriodFilter(tSales, filters);

        const confirmed = tSales.filter(s => s.status === 'confirmada');
        return {
          id: team.id,
          name: team.name,
          sales: confirmed.length,
          totalSales: tSales.length,
          vgv: confirmed.reduce((sum, s) => sum + Number(s.vgv || 0), 0),
          vgc: confirmed.reduce((sum, s) => sum + Number(s.vgc || 0), 0),
          brokers: tBrokers.length,
          activeBrokers: tBrokers.filter(b => b.status === 'ativo').length,
          conversionRate: tSales.length > 0 ? (confirmed.length / tSales.length) * 100 : 0,
        };
      })
      .sort((a, b) => b.vgv - a.vgv);
  }, [teams, brokers, sales, filters]);

  // Broker ranking (top 10)
  const brokerRanking = useMemo(() => {
    const allBrokers = filteredBrokers;
    return allBrokers
      .map(broker => {
        const bSales = confirmedVendas.filter(s => s.broker_id === broker.id);
        return {
          id: broker.id,
          name: broker.name,
          avatar: broker.avatar_url,
          sales: bSales.length,
          vgv: bSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0),
        };
      })
      .filter(b => b.vgv > 0)
      .sort((a, b) => b.vgv - a.vgv)
      .slice(0, 10);
  }, [filteredBrokers, confirmedVendas]);

  // Monthly chart data from confirmed vendas only
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string; vgv: number; vgc: number; sales: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      monthlyData[key] = { month: label, vgv: 0, vgc: 0, sales: 0 };
    }
    confirmedVendas.forEach(sale => {
      const d = new Date(sale.sale_date || sale.created_at || '');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].vgv += Number(sale.vgv || 0);
        monthlyData[key].vgc += Number(sale.vgc || 0);
        monthlyData[key].sales += 1;
      }
    });
    return Object.values(monthlyData);
  }, [confirmedVendas]);

  const getMedalColor = (i: number) => {
    if (i === 0) return 'from-amber-400 to-yellow-600 text-white shadow-amber-500/30';
    if (i === 1) return 'from-slate-300 to-slate-400 text-white shadow-slate-400/30';
    if (i === 2) return 'from-orange-400 to-amber-700 text-white shadow-orange-500/30';
    return 'from-muted to-muted text-muted-foreground';
  };

  const kpiCards = [
    { title: 'VGV Confirmado', value: fmt(totalVGV), subtitle: `${totalSales} vendas confirmadas`, icon: DollarSign, color: 'from-success/20 to-success/5', iconColor: 'text-success', borderColor: 'border-success/20' },
    { title: 'VGC Total', value: fmt(totalVGC), subtitle: totalVGV > 0 ? `${((totalVGC / totalVGV) * 100).toFixed(1)}% do VGV` : '0%', icon: TrendingUp, color: 'from-primary/20 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/20' },
    { title: 'Ticket Médio', value: fmt(ticketMedio), subtitle: `${activeBrokers} corretores ativos`, icon: Target, color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-500', borderColor: 'border-violet-500/20' },
    { title: 'Captações', value: captacoes.length.toString(), subtitle: `${fmt(captacoes.reduce((s, c) => s + Number(c.vgv || 0), 0))} em VGV estimado`, icon: Package, color: 'from-info/20 to-info/5', iconColor: 'text-info', borderColor: 'border-info/20' },
  ];

  return (
    <>
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6 min-h-screen">
        <div className="space-y-6 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard de Equipes</h1>
              <p className="text-muted-foreground mt-1">
                Olá, <span className="font-medium text-foreground">{profile?.full_name}</span>. Visão consolidada de desempenho.
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-border/60">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Badge>
          </div>

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
                  VGV Mensal (Confirmadas)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))' }} formatter={(v: number) => [fmt(v), '']} />
                    <Bar dataKey="vgv" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="VGV" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border/60 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Evolução VGV vs VGC
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))' }} formatter={(v: number) => [fmt(v), '']} />
                    <Line type="monotone" dataKey="vgv" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} name="VGV" />
                    <Line type="monotone" dataKey="vgc" stroke="hsl(var(--success))" strokeWidth={3} dot={{ r: 3 }} name="VGC" />
                  </LineChart>
                </ResponsiveContainer>
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
                  <CardDescription className="mt-1">Vendas confirmadas no período</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">{teamStats.length} equipe{teamStats.length !== 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {teamStats.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {teamStats.map((team, index) => {
                    const pct = teamStats[0]?.vgv > 0 ? Math.min((team.vgv / teamStats[0].vgv) * 100, 100) : 0;
                    return (
                      <div key={team.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-5 hover:bg-muted/30 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${getMedalColor(index)} font-bold text-sm shadow-md flex-shrink-0`}>
                            {index + 1}º
                          </div>
                          <div>
                            <p className="font-semibold text-base lg:text-lg">{team.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{team.activeBrokers} ativo{team.activeBrokers !== 1 ? 's' : ''} de {team.brokers}</span>
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
                            <p className="font-bold text-xl text-primary tabular-nums mt-0.5">{fmt(team.vgv, true)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">VGC</p>
                            <p className="font-bold text-xl text-success tabular-nums mt-0.5">{fmt(team.vgc, true)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Conversão</p>
                            <p className="font-bold text-lg tabular-nums mt-0.5">{team.conversionRate.toFixed(0)}%</p>
                          </div>
                          <div className="hidden md:block w-32">
                            <Progress value={pct} className="h-2" />
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">{Math.round(pct)}%</p>
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

          {/* Broker Ranking */}
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-primary" />
                Top Corretores
              </CardTitle>
              <CardDescription>Ranking por VGV confirmado no período</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {brokerRanking.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {brokerRanking.map((broker, index) => (
                    <div key={broker.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${getMedalColor(index)} font-bold text-xs shadow-md flex-shrink-0`}>
                          {index + 1}º
                        </div>
                        <div className="flex items-center gap-3">
                          {broker.avatar ? (
                            <img src={broker.avatar} alt={broker.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {broker.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium">{broker.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Vendas</p>
                          <p className="font-bold tabular-nums">{broker.sales}</p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-xs text-muted-foreground">VGV</p>
                          <p className="font-bold text-primary tabular-nums">{fmt(broker.vgv, true)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum corretor com vendas no período</p>
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
