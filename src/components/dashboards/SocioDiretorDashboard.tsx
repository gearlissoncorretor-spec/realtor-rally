import React, { useState, useMemo, useEffect } from 'react';
import { OriginAnalyticsDashboard } from './OriginAnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import {
  BarChart3, TrendingUp, DollarSign, Users, Target, Home,
  Filter, RotateCcw, Building, User, Trophy, Medal, Award,
  PieChart, ArrowUpRight, ChevronDown, ChevronUp, Activity,
  LayoutDashboard, TrendingDown, Clock, Search, Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTeams } from '@/hooks/useTeams';
import { useAgencies } from '@/hooks/useAgencies';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useFollowUps } from '@/hooks/useFollowUps';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, LineChart, Line, AreaChart, Area,
  Cell, PieChart as RechartsPie, Pie
} from 'recharts';

interface FiltersState {
  agencyId: string;
  teamId: string;
  brokerId: string;
  month: string;
  year: string;
}

const MONTHS = [
  { value: 'all', label: 'Todos os Meses' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const SocioDiretorDashboard = () => {
  const { company } = useAuth();
  const { sales, brokers, targets, salesLoading, brokersLoading } = useData();
  const { teams } = useTeams();
  const { agencies } = useAgencies();
  const { negotiations } = useNegotiations();
  const { followUps } = useFollowUps();

  const [filters, setFilters] = useState<FiltersState>({
    agencyId: 'all',
    teamId: 'all',
    brokerId: 'all',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
  });

  const [agencyRankingExpanded, setAgencyRankingExpanded] = useState(false);
  const [managerRankingExpanded, setManagerRankingExpanded] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      if (sale.status === 'distrato') return false;
      // Para o VGV de vendas principal, ignoramos captações
      if (sale.tipo === 'captacao' || (sale.tipo === 'venda' && sale.parceria_tipo === 'Agência')) return false;

      const rawDate = sale.sale_date || sale.created_at;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;

      if (filters.year !== 'all' && d.getFullYear() !== Number(filters.year)) return false;
      if (filters.month !== 'all' && d.getMonth() + 1 !== Number(filters.month)) return false;

      if (filters.agencyId !== 'all' && sale.agency_id !== filters.agencyId) return false;
      
      if (filters.teamId !== 'all') {
        const broker = brokers.find(b => b.id === sale.broker_id);
        if (!broker || broker.team_id !== filters.teamId) return false;
      }
      
      if (filters.brokerId !== 'all' && sale.broker_id !== filters.brokerId) return false;
      
      return true;
    });
  }, [sales, brokers, filters]);

  // KPIs
  const metrics = useMemo(() => {
    const totalVGV = filteredSales.reduce((s, sale) => s + Number(sale.vgv || 0), 0);
    const totalVGC = filteredSales.reduce((s, sale) => s + Number(sale.vgc || 0), 0);
    const totalSales = filteredSales.length;
    const ticketMedio = totalSales > 0 ? totalVGV / totalSales : 0;
    
    // VGV de Captação calculado separadamente
    const totalVGVCaptacao = (sales || []).filter(s => {
      const isOnlyCaptacao = s.tipo === 'captacao' || (s.tipo === 'venda' && s.parceria_tipo === 'Agência');
      if (!isOnlyCaptacao) return false;
      if (s.status === 'distrato') return false;
      
      const rawDate = s.sale_date || s.created_at;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      
      if (filters.year !== 'all' && d.getFullYear() !== Number(filters.year)) return false;
      if (filters.month !== 'all' && d.getMonth() + 1 !== Number(filters.month)) return false;
      if (filters.agencyId !== 'all' && s.agency_id !== filters.agencyId) return false;
      
      return true;
    }).reduce((s, sale) => s + Number(sale.property_value || 0), 0);
    
    const leadsCount = (followUps || []).length;
    const confirmedSales = filteredSales.filter(s => s.status === 'confirmada');
    const conversionRate = totalSales > 0 ? (confirmedSales.length / totalSales) * 100 : 0;

    return {
      totalVGV,
      totalVGC,
      totalVGVCaptacao,
      totalSales,
      ticketMedio,
      leadsCount,
      conversionRate
    };
  }, [filteredSales, sales, followUps, filters]);

  // Agency Stats
  const agencyStats = useMemo(() => {
    return (agencies || []).map(agency => {
      const agencySales = (sales || []).filter(s => 
        s.agency_id === agency.id && 
        s.status !== 'distrato' &&
        (!filters.year || filters.year === 'all' || new Date(s.sale_date || s.created_at || '').getFullYear() === Number(filters.year)) &&
        (!filters.month || filters.month === 'all' || new Date(s.sale_date || s.created_at || '').getMonth() + 1 === Number(filters.month))
      );
      
      const vgv = agencySales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const salesCount = agencySales.length;
      const agencyBrokers = brokers.filter(b => b.agency_id === agency.id);
      const ticketMedio = salesCount > 0 ? vgv / salesCount : 0;
      const confirmed = agencySales.filter(s => s.status === 'confirmada').length;
      const conversion = salesCount > 0 ? (confirmed / salesCount) * 100 : 0;

      return {
        id: agency.id,
        name: agency.name,
        vgv,
        sales: salesCount,
        ticketMedio,
        brokerCount: agencyBrokers.length,
        conversion
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [agencies, sales, brokers, filters.year, filters.month]);

  // Manager Stats (based on teams)
  const managerStats = useMemo(() => {
    return (teams || []).map(team => {
      const teamBrokers = brokers.filter(b => b.team_id === team.id);
      const teamSales = (sales || []).filter(s => 
        teamBrokers.some(b => b.id === s.broker_id) && 
        s.status !== 'distrato' &&
        (!filters.year || filters.year === 'all' || new Date(s.sale_date || s.created_at || '').getFullYear() === Number(filters.year)) &&
        (!filters.month || filters.month === 'all' || new Date(s.sale_date || s.created_at || '').getMonth() + 1 === Number(filters.month))
      );
      
      const vgv = teamSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const salesCount = teamSales.length;
      const agency = agencies.find(a => a.id === team.agency_id);

      // Simple performance heuristic
      const performance = salesCount > 0 ? (vgv / 1000000) * 10 : 0; // Mock performance score

      return {
        id: team.id,
        name: team.name, // Assuming team name often includes manager or team designation
        agencyName: agency?.name || 'N/A',
        vgv,
        sales: salesCount,
        brokerCount: teamBrokers.length,
        performance
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [teams, brokers, sales, agencies, filters.year, filters.month]);

  // Broker Stats
  const brokerStats = useMemo(() => {
    return (brokers || []).map(broker => {
      const brokerSales = (sales || []).filter(s => 
        s.broker_id === broker.id && 
        s.status !== 'distrato' &&
        (!filters.year || filters.year === 'all' || new Date(s.sale_date || s.created_at || '').getFullYear() === Number(filters.year)) &&
        (!filters.month || filters.month === 'all' || new Date(s.sale_date || s.created_at || '').getMonth() + 1 === Number(filters.month))
      );
      
      const vgv = brokerSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const salesCount = brokerSales.length;

      return {
        id: broker.id,
        name: broker.name,
        avatar: (broker as any).avatar_url,
        vgv,
        sales: salesCount,
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [brokers, sales, filters.year, filters.month]);

  // Sales evolution chart data
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYearSales = (sales || []).filter(s => 
      s.status !== 'distrato' && 
      new Date(s.sale_date || s.created_at || '').getFullYear() === Number(filters.year)
    );

    return months.map((name, i) => {
      const monthSales = currentYearSales.filter(s => 
        new Date(s.sale_date || s.created_at || '').getMonth() === i &&
        (filters.agencyId === 'all' || s.agency_id === filters.agencyId)
      );
      return {
        name,
        vgv: monthSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0),
        vendas: monthSales.length
      };
    });
  }, [sales, filters.year, filters.agencyId]);

  if (salesLoading || brokersLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-muted rounded-xl w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header with Group Name */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Visão Global: <span className="text-primary">{company?.name || 'Sua Imobiliária'}</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Acompanhamento estratégico consolidado de todas as unidades
          </p>
        </div>

        {/* Quick Summary Bar */}
        <div className="flex items-center gap-4 sm:gap-8 bg-card/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-border/50 shadow-sm animate-fade-in self-start lg:self-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> VGV
            </span>
            <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(metrics.totalVGV)}</span>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> VGC
            </span>
            <span className="text-sm font-bold text-success tabular-nums">{formatCurrency(metrics.totalVGC)}</span>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Vendas
            </span>
            <span className="text-sm font-bold text-warning tabular-nums">{metrics.totalSales}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilters({
            agencyId: 'all', teamId: 'all', brokerId: 'all',
            month: (new Date().getMonth() + 1).toString(),
            year: new Date().getFullYear().toString()
          })}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Building className="h-3 w-3" /> Unidade
            </label>
            <Select value={filters.agencyId} onValueChange={(v) => setFilters(f => ({ ...f, agencyId: v, teamId: 'all', brokerId: 'all' }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas as Unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Users className="h-3 w-3" /> Gerente/Equipe
            </label>
            <Select value={filters.teamId} onValueChange={(v) => setFilters(f => ({ ...f, teamId: v, brokerId: 'all' }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos os Gerentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Gerentes</SelectItem>
                {teams
                  .filter(t => filters.agencyId === 'all' || t.agency_id === filters.agencyId)
                  .map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Mês
            </label>
            <Select value={filters.month} onValueChange={(v) => setFilters(f => ({ ...f, month: v }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos os Meses" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[100px]">
            <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Ano
            </label>
            <Select value={filters.year} onValueChange={(v) => setFilters(f => ({ ...f, year: v }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* General Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Vendas Totais', value: metrics.totalSales, icon: Home, color: 'text-primary' },
          { label: 'VGV Vendas', value: formatCurrency(metrics.totalVGV), icon: DollarSign, color: 'text-success' },
          { label: 'VGV Captação', value: formatCurrency(metrics.totalVGVCaptacao), icon: Building, color: 'text-warning' },
          { label: 'Ticket Médio', value: formatCurrency(metrics.ticketMedio), icon: TrendingUp, color: 'text-info' },
          { label: 'Leads Gerados', value: metrics.leadsCount, icon: Users, color: 'text-purple-500' },
          { label: 'Taxa de Conversão', value: `${metrics.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-rose-500' },
        ].map((kpi, idx) => (
          <Card key={idx} className="border-border/40 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg bg-muted/50", kpi.color)}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {kpi.label}
                </span>
              </div>
              <div className="text-xl font-bold tracking-tight">
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Evolução de Vendas ({filters.year})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: any) => [formatCurrency(value), 'VGV']}
                />
                <Area type="monotone" dataKey="vgv" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVgv)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agency Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              VGV por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={agencyStats.filter(a => a.vgv > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="vgv"
                >
                  {agencyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend layout="vertical" verticalAlign="bottom" />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <OriginAnalyticsDashboard />

      {/* Agency Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unidades Ranking */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Ranking de Unidades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-4">
            <div className="space-y-3">
              {agencyStats.slice(0, 5).map((stat, idx) => (
                <div key={stat.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs truncate">{stat.name}</span>
                      <span className="font-bold text-xs">{formatCurrency(stat.vgv)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {stat.sales} vendas · {stat.brokerCount} corretores
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gerentes Ranking */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Medal className="h-4 w-4 text-blue-500" />
              Ranking de Gerentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-4">
            <div className="space-y-3">
              {managerStats.slice(0, 5).map((stat, idx) => (
                <div key={stat.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs truncate">{stat.name}</span>
                      <span className="font-bold text-xs">{formatCurrency(stat.vgv)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground italic">
                      {stat.agencyName} · {stat.sales} vendas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Corretores Ranking */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              Ranking de Corretores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-4">
            <div className="space-y-3">
              {brokerStats.slice(0, 5).map((stat, idx) => (
                <div key={stat.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <Avatar className="h-8 w-8 border border-border shadow-sm">
                    <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                      {stat.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs truncate">{stat.name}</span>
                      <span className="font-bold text-xs">{formatCurrency(stat.vgv)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {stat.sales} vendas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Comparativo de Desempenho por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="pb-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider px-2">Unidade</th>
                  <th className="pb-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right px-2">VGV</th>
                  <th className="pb-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right px-2">Vendas</th>
                  <th className="pb-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right px-2">Ticket Médio</th>
                  <th className="pb-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right px-2">Corretores</th>
                  <th className="pb-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right px-2">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {agencyStats.map((agency) => (
                  <tr key={agency.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 font-medium px-2">{agency.name}</td>
                    <td className="py-4 text-right font-bold px-2">{formatCurrency(agency.vgv)}</td>
                    <td className="py-4 text-right px-2">{agency.sales}</td>
                    <td className="py-4 text-right px-2 text-muted-foreground">{formatCurrency(agency.ticketMedio)}</td>
                    <td className="py-4 text-right px-2">{agency.brokerCount}</td>
                    <td className="py-4 text-right px-2">
                      <Badge variant={agency.conversion > 10 ? "default" : "secondary"} className="bg-success/10 text-success border-success/20">
                        {agency.conversion.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
                {agencyStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhuma unidade encontrada para os filtros selecionados
                    </td>
                  </tr>
                )}
              </tbody>
              {agencyStats.length > 0 && (
                <tfoot className="border-t-2 border-border font-bold bg-muted/20">
                  <tr>
                    <td className="py-3 px-2">TOTAL GERAL</td>
                    <td className="py-3 text-right px-2 text-primary">{formatCurrency(metrics.totalVGV)}</td>
                    <td className="py-3 text-right px-2">{metrics.totalSales}</td>
                    <td className="py-3 text-right px-2">{formatCurrency(metrics.ticketMedio)}</td>
                    <td className="py-3 text-right px-2">{agencyStats.reduce((sum, a) => sum + a.brokerCount, 0)}</td>
                    <td className="py-3 text-right px-2">{metrics.conversionRate.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocioDiretorDashboard;
