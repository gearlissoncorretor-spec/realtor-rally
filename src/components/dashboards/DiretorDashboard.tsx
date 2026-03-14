import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Target, Home,
  Filter, RotateCcw, Calendar, User, Trophy, Medal, Award,
  AlertTriangle, Flame, Clock, Percent, PieChart, ArrowUpRight,
  ArrowDownRight, ChevronDown, ChevronUp, Building, UserMinus,
  Eye, Handshake, Phone, Zap, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTeams } from '@/hooks/useTeams';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useFollowUps } from '@/hooks/useFollowUps';
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// ─── Types ───
interface FiltersState {
  teamId: string;
  brokerId: string;
  month: string;
  year: string;
}

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const PIE_COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(32, 95%, 44%)',
  'hsl(199, 89%, 48%)', 'hsl(280, 70%, 55%)', 'hsl(350, 80%, 55%)',
  'hsl(170, 70%, 45%)', 'hsl(45, 90%, 50%)',
];

const DiretorDashboard = () => {
  const { profile, isDiretor, isAdmin } = useAuth();
  const { sales, brokers, targets } = useData();
  const { teams } = useTeams();
  const { negotiations } = useNegotiations();
  const { followUps } = useFollowUps();

  const [filters, setFilters] = useState<FiltersState>({
    teamId: 'all', brokerId: 'all',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
  });
  const [rankingExpanded, setRankingExpanded] = useState(false);
  const [teamRankingExpanded, setTeamRankingExpanded] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // ─── Filtered sales ───
  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      if (sale.status === 'distrato') return false;
      const rawDate = sale.sale_date || sale.created_at;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;

      if (filters.year !== 'all' && d.getFullYear() !== Number(filters.year)) return false;
      if (filters.month !== 'all' && d.getMonth() + 1 !== Number(filters.month)) return false;

      if (filters.teamId !== 'all') {
        const broker = brokers.find(b => b.id === sale.broker_id);
        if (!broker || broker.team_id !== filters.teamId) return false;
      }
      if (filters.brokerId !== 'all' && sale.broker_id !== filters.brokerId) return false;
      return true;
    });
  }, [sales, brokers, filters]);

  // Previous period sales for comparison
  const prevPeriodSales = useMemo(() => {
    if (filters.month === 'all' || filters.year === 'all') return [];
    let prevMonth = Number(filters.month) - 1;
    let prevYear = Number(filters.year);
    if (prevMonth === 0) { prevMonth = 12; prevYear--; }

    return (sales || []).filter(sale => {
      if (sale.status === 'distrato') return false;
      const rawDate = sale.sale_date || sale.created_at;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth;
    });
  }, [sales, filters]);

  // ─── KPI calculations ───
  const metrics = useMemo(() => {
    const totalVGV = filteredSales.reduce((s, sale) => s + Number(sale.vgv || 0), 0);
    const totalVGC = filteredSales.reduce((s, sale) => s + Number(sale.vgc || 0), 0);
    const totalSales = filteredSales.length;
    const confirmedSales = filteredSales.filter(s => s.status === 'confirmada');
    const ticketMedio = totalSales > 0 ? totalVGV / totalSales : 0;
    const conversionRate = totalSales > 0 ? (confirmedSales.length / totalSales) * 100 : 0;

    const prevVGV = prevPeriodSales.reduce((s, sale) => s + Number(sale.vgv || 0), 0);
    const prevSalesCount = prevPeriodSales.length;

    const vgvChange = prevVGV > 0 ? ((totalVGV - prevVGV) / prevVGV) * 100 : (totalVGV > 0 ? 100 : 0);
    const salesChange = prevSalesCount > 0 ? ((totalSales - prevSalesCount) / prevSalesCount) * 100 : (totalSales > 0 ? 100 : 0);

    // Active brokers (those with sales in period)
    const brokerIdsWithSales = new Set(filteredSales.map(s => s.broker_id).filter(Boolean));
    const filteredBrokers = filters.teamId !== 'all'
      ? brokers.filter(b => b.team_id === filters.teamId)
      : brokers;
    const totalBrokers = filteredBrokers.filter(b => b.status === 'ativo').length;
    const activeBrokersCount = filteredBrokers.filter(b => b.status === 'ativo' && brokerIdsWithSales.has(b.id)).length;
    const activityRate = totalBrokers > 0 ? (activeBrokersCount / totalBrokers) * 100 : 0;

    // Active negotiations
    const activeNegotiations = negotiations?.length || 0;
    const negotiationsVGV = (negotiations || []).reduce((s, n) => s + Number(n.negotiated_value || 0), 0);

    // Follow-ups pending
    const pendingFollowUps = (followUps || []).filter(f => {
      if (!f.next_contact_date) return true;
      return f.next_contact_date <= new Date().toISOString().split('T')[0];
    }).length;

    // Monthly target
    const now = new Date();
    const currentMonthTargets = (targets || []).filter(t =>
      t.month === now.getMonth() + 1 && t.year === now.getFullYear()
    );
    const monthlyTargetValue = currentMonthTargets.reduce((s, t) => s + Number(t.target_value || 0), 0);
    const monthlyTargetPercent = monthlyTargetValue > 0 ? Math.min((totalVGV / monthlyTargetValue) * 100, 150) : 0;

    // Days metrics
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = totalDays - daysPassed;
    const dailyAvg = daysPassed > 0 ? totalVGV / daysPassed : 0;
    const projectedVGV = dailyAvg * totalDays;
    const metaProbability = monthlyTargetValue > 0 ? Math.min((projectedVGV / monthlyTargetValue) * 100, 100) : 0;

    // Avg close time (estimated from sale_date - created_at)
    const closeTimes = filteredSales.filter(s => s.sale_date && s.created_at).map(s => {
      const created = new Date(s.created_at!);
      const sold = new Date(s.sale_date!);
      return Math.max(0, Math.round((sold.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
    }).filter(d => d >= 0 && d < 365);
    const avgCloseTime = closeTimes.length > 0 ? Math.round(closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length) : 0;

    return {
      totalVGV, totalVGC, totalSales, ticketMedio, conversionRate,
      vgvChange, salesChange,
      totalBrokers, activeBrokersCount, activityRate,
      activeNegotiations, negotiationsVGV, pendingFollowUps,
      monthlyTargetValue, monthlyTargetPercent,
      totalDays, daysPassed, daysRemaining, dailyAvg, projectedVGV, metaProbability,
      avgCloseTime,
    };
  }, [filteredSales, prevPeriodSales, brokers, negotiations, followUps, targets, filters]);

  // ─── VGV by team ───
  const teamStats = useMemo(() => {
    return (teams || []).map(team => {
      const teamBrokers = brokers.filter(b => b.team_id === team.id);
      const teamSales = filteredSales.filter(s => teamBrokers.some(b => b.id === s.broker_id));
      const vgv = teamSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const salesCount = teamSales.length;
      return { id: team.id, name: team.name, vgv, sales: salesCount, brokers: teamBrokers.length };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [teams, brokers, filteredSales]);

  // ─── VGV evolution (monthly) ───
  const vgvEvolution = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = filters.year !== 'all' ? Number(filters.year) : new Date().getFullYear();

    return monthNames.map((name, i) => {
      const monthSales = (sales || []).filter(sale => {
        if (sale.status === 'distrato') return false;
        const rawDate = sale.sale_date || sale.created_at;
        if (!rawDate) return false;
        const d = new Date(rawDate);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      const vgv = monthSales.reduce((s, sale) => s + Number(sale.vgv || 0), 0);
      const count = monthSales.length;
      return { month: name, vgv, vendas: count };
    });
  }, [sales, filters.year]);

  // ─── Property type distribution ───
  const propertyTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const type = sale.property_type || 'outros';
      const label = type === 'apartamento' ? 'Apartamento' : type === 'casa' ? 'Casa' : type === 'terreno' ? 'Terreno' : type === 'comercial' ? 'Comercial' : type === 'rural' ? 'Rural' : 'Outros';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // ─── Origin distribution ───
  const originData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const origem = (sale as any).origem || 'Não informado';
      counts[origem] = (counts[origem] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // ─── Broker ranking ───
  const brokerRankings = useMemo(() => {
    const filteredBrokers = filters.teamId !== 'all'
      ? brokers.filter(b => b.team_id === filters.teamId)
      : brokers;

    return filteredBrokers.map(broker => {
      const bSales = filteredSales.filter(s => s.broker_id === broker.id);
      const vgv = bSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      return { id: broker.id, name: broker.name, avatar: broker.avatar_url, sales: bSales.length, vgv };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [brokers, filteredSales, filters.teamId]);

  // ─── Strategic alerts ───
  const alerts = useMemo(() => {
    const result: { type: 'warning' | 'danger' | 'info'; message: string }[] = [];

    // Inactive brokers
    const brokerIdsWithSales = new Set(filteredSales.map(s => s.broker_id));
    const inactiveBrokers = brokers.filter(b => b.status === 'ativo' && !brokerIdsWithSales.has(b.id));
    if (inactiveBrokers.length > 0) {
      result.push({ type: 'warning', message: `${inactiveBrokers.length} corretor(es) sem atividade no período` });
    }

    // Below target
    if (metrics.monthlyTargetValue > 0 && metrics.monthlyTargetPercent < 50 && metrics.daysPassed > 15) {
      result.push({ type: 'danger', message: `Equipe abaixo de 50% da meta mensal com ${metrics.daysRemaining} dias restantes` });
    }

    // Low conversion
    if (metrics.conversionRate < 30 && metrics.totalSales > 5) {
      result.push({ type: 'warning', message: `Taxa de conversão baixa: ${metrics.conversionRate.toFixed(0)}%` });
    }

    // Pending follow-ups
    if (metrics.pendingFollowUps > 10) {
      result.push({ type: 'info', message: `${metrics.pendingFollowUps} follow-ups pendentes precisam de atenção` });
    }

    return result;
  }, [filteredSales, brokers, metrics]);

  // ─── Sales funnel ───
  const funnelData = useMemo(() => {
    const totalFollowUps = followUps?.length || 0;
    const totalNegotiations = negotiations?.length || 0;
    const propostas = (negotiations || []).filter(n => ['proposta_enviada', 'proposta_aceita', 'venda_concluida'].includes(n.status)).length;
    const vendas = metrics.totalSales;

    return [
      { stage: 'Follow-ups', value: totalFollowUps, color: 'hsl(var(--primary))' },
      { stage: 'Negociações', value: totalNegotiations, color: 'hsl(221, 83%, 53%)' },
      { stage: 'Propostas', value: propostas, color: 'hsl(32, 95%, 44%)' },
      { stage: 'Vendas', value: vendas, color: 'hsl(142, 71%, 45%)' },
    ];
  }, [followUps, negotiations, metrics.totalSales]);

  // ─── Helpers ───
  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      teamId: 'all', brokerId: 'all',
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
    });
  };

  const hasActiveFilters = filters.teamId !== 'all' || filters.brokerId !== 'all';

  const getChangeIcon = (change: number) => change >= 0
    ? <ArrowUpRight className="w-3 h-3 text-emerald-500" />
    : <ArrowDownRight className="w-3 h-3 text-red-500" />;

  const getProbColor = (prob: number) => prob >= 71 ? 'text-emerald-500' : prob >= 41 ? 'text-amber-500' : 'text-red-500';
  const getProbIcon = (prob: number) => prob >= 71 ? '🔥' : prob >= 41 ? '⚠️' : '🔴';
  const getProgressColor = (pct: number) => pct >= 71 ? 'bg-emerald-500' : pct >= 31 ? 'bg-amber-500' : 'bg-red-500';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground text-sm">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs text-muted-foreground">
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Estratégico
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão completa de performance — {profile?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ═══ Filters ═══ */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={filters.teamId} onValueChange={v => handleFilterChange('teamId', v)}>
              <SelectTrigger className="h-9 text-xs">
                <Users className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                {(teams || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.brokerId} onValueChange={v => handleFilterChange('brokerId', v)}>
              <SelectTrigger className="h-9 text-xs">
                <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Corretor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os corretores</SelectItem>
                {brokers.filter(b => b.status === 'ativo').map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.month} onValueChange={v => handleFilterChange('month', v)}>
              <SelectTrigger className="h-9 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.year} onValueChange={v => handleFilterChange('year', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters && filters.month === (new Date().getMonth() + 1).toString()}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ KPI Cards Row 1 ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICardCompact title="Vendas Realizadas" value={metrics.totalSales.toString()} change={metrics.salesChange} icon={<Home className="w-5 h-5" />} accent="text-primary" />
        <KPICardCompact title="VGV Total" value={formatCurrency(metrics.totalVGV)} change={metrics.vgvChange} icon={<DollarSign className="w-5 h-5" />} accent="text-emerald-500" />
        <KPICardCompact title="Meta Geral" value={`${metrics.monthlyTargetPercent.toFixed(0)}%`} subtitle={metrics.monthlyTargetValue > 0 ? `de ${formatCurrency(metrics.monthlyTargetValue)}` : 'Sem meta definida'} icon={<Target className="w-5 h-5" />} accent="text-amber-500" />
        <KPICardCompact title="Corretores Ativos" value={`${metrics.activeBrokersCount}`} subtitle={`de ${metrics.totalBrokers} — ${metrics.activityRate.toFixed(0)}% ativos`} icon={<Users className="w-5 h-5" />} accent="text-blue-500" />
      </div>

      {/* ═══ KPI Cards Row 2 ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICardCompact title="Negociações Ativas" value={metrics.activeNegotiations.toString()} subtitle={formatCurrency(metrics.negotiationsVGV)} icon={<Handshake className="w-5 h-5" />} accent="text-violet-500" />
        <KPICardCompact title="Follow-ups Pendentes" value={metrics.pendingFollowUps.toString()} icon={<Phone className="w-5 h-5" />} accent="text-orange-500" />
        <KPICardCompact title="Ticket Médio" value={formatCurrency(metrics.ticketMedio)} icon={<BarChart3 className="w-5 h-5" />} accent="text-cyan-500" />
        <KPICardCompact title="Tempo Médio Fechamento" value={`${metrics.avgCloseTime} dias`} icon={<Clock className="w-5 h-5" />} accent="text-pink-500" />
      </div>

      {/* ═══ Meta Progress + Strategic Indicators ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meta mensal */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Meta Mensal da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-bold text-foreground">{formatCurrency(metrics.monthlyTargetValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Realizado</span>
              <span className="font-bold text-emerald-500">{formatCurrency(metrics.totalVGV)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Faltam</span>
              <span className="font-bold text-foreground">{formatCurrency(Math.max(0, metrics.monthlyTargetValue - metrics.totalVGV))}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span className="font-semibold">{metrics.monthlyTargetPercent.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700", getProgressColor(metrics.monthlyTargetPercent))} style={{ width: `${Math.min(metrics.monthlyTargetPercent, 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{metrics.daysPassed}</p>
                <p className="text-[10px] text-muted-foreground">Dias passados</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{metrics.daysRemaining}</p>
                <p className="text-[10px] text-muted-foreground">Dias restantes</p>
              </div>
              <div className="text-center">
                <p className={cn("text-lg font-bold", getProbColor(metrics.metaProbability))}>
                  {getProbIcon(metrics.metaProbability)} {metrics.metaProbability.toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground">Probabilidade</p>
              </div>
            </div>
            {metrics.monthlyTargetValue > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                {metrics.metaProbability >= 100
                  ? '🎉 Meta será batida mantendo o ritmo atual!'
                  : `📊 Ritmo atual: ${formatCurrency(metrics.dailyAvg)}/dia — Projeção: ${formatCurrency(metrics.projectedVGV)}`
                }
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strategic indicators */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Indicadores Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <IndicatorRow label="Taxa de Conversão Geral" value={`${metrics.conversionRate.toFixed(1)}%`} icon={<Percent className="w-4 h-4" />} />
            <IndicatorRow label="VGC Total (Comissões)" value={formatCurrency(metrics.totalVGC)} icon={<DollarSign className="w-4 h-4" />} />
            <IndicatorRow label="Ticket Médio" value={formatCurrency(metrics.ticketMedio)} icon={<BarChart3 className="w-4 h-4" />} />
            <IndicatorRow label="Vendas/Dia (ritmo)" value={formatCurrency(metrics.dailyAvg)} icon={<Zap className="w-4 h-4" />} />
            <IndicatorRow label="Previsão de Vendas (mês)" value={formatCurrency(metrics.projectedVGV)} icon={<TrendingUp className="w-4 h-4" />} />
            <IndicatorRow label="Tempo Médio de Fechamento" value={`${metrics.avgCloseTime} dias`} icon={<Clock className="w-4 h-4" />} />
          </CardContent>
        </Card>
      </div>

      {/* ═══ VGV Evolution + VGV by Team ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Evolução do VGV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={vgvEvolution}>
                <defs>
                  <linearGradient id="vgvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="vgv" name="VGV" stroke="hsl(var(--primary))" fill="url(#vgvGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" /> VGV por Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={teamStats.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="vgv" name="VGV" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Team Ranking + Sales Funnel ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Ranking */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Ranking de Equipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible open={teamRankingExpanded} onOpenChange={setTeamRankingExpanded}>
              <div className="space-y-2">
                {teamStats.slice(0, 3).map((team, i) => (
                  <TeamRankItem key={team.id} team={team} index={i} maxVGV={Math.max(...teamStats.map(t => t.vgv), 1)} />
                ))}
              </div>
              <CollapsibleContent className="space-y-2 mt-2">
                {teamStats.slice(3).map((team, i) => (
                  <TeamRankItem key={team.id} team={team} index={i + 3} maxVGV={Math.max(...teamStats.map(t => t.vgv), 1)} />
                ))}
              </CollapsibleContent>
              {teamStats.length > 3 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
                    {teamRankingExpanded ? <><ChevronUp className="w-3.5 h-3.5 mr-1" /> Recolher</> : <><ChevronDown className="w-3.5 h-3.5 mr-1" /> Ver ranking completo</>}
                  </Button>
                </CollapsibleTrigger>
              )}
              {teamStats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma equipe com vendas no período</p>}
            </Collapsible>
          </CardContent>
        </Card>

        {/* Sales Funnel */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" /> Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((stage, i) => {
                const maxVal = Math.max(...funnelData.map(f => f.value), 1);
                const pct = (stage.value / maxVal) * 100;
                const convRate = i > 0 && funnelData[i - 1].value > 0
                  ? ((stage.value / funnelData[i - 1].value) * 100).toFixed(0)
                  : null;

                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{stage.value}</span>
                        {convRate && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {convRate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Property Types + Client Origin ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" /> Tipos de Imóveis Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propertyTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RechartsPie>
                  <Pie data={propertyTypeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {propertyTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Origem dos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {originData.length > 0 ? (
              <div className="space-y-2.5">
                {originData.slice(0, 8).map((item, i) => {
                  const maxVal = Math.max(...originData.map(o => o.value), 1);
                  const pct = (item.value / maxVal) * 100;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate">{item.name}</span>
                        <span className="font-semibold text-foreground">{item.value} vendas</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados de origem no período</p>}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Broker Ranking ═══ */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Ranking de Corretores — Top 10
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible open={rankingExpanded} onOpenChange={setRankingExpanded}>
            <div className="space-y-2">
              {brokerRankings.slice(0, 3).map((broker, i) => (
                <BrokerRankItem key={broker.id} broker={broker} index={i} maxVGV={Math.max(...brokerRankings.map(b => b.vgv), 1)} />
              ))}
            </div>
            <CollapsibleContent className="space-y-2 mt-2">
              {brokerRankings.slice(3, 10).map((broker, i) => (
                <BrokerRankItem key={broker.id} broker={broker} index={i + 3} maxVGV={Math.max(...brokerRankings.map(b => b.vgv), 1)} />
              ))}
            </CollapsibleContent>
            {brokerRankings.length > 3 && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
                  {rankingExpanded ? <><ChevronUp className="w-3.5 h-3.5 mr-1" /> Recolher</> : <><ChevronDown className="w-3.5 h-3.5 mr-1" /> Ver ranking completo</>}
                </Button>
              </CollapsibleTrigger>
            )}
            {brokerRankings.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados no período</p>}
          </Collapsible>
        </CardContent>
      </Card>

      {/* ═══ Alerts ═══ */}
      {alerts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Alertas Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-sm",
                  alert.type === 'danger' && 'bg-red-500/5 border-red-500/20 text-red-500',
                  alert.type === 'warning' && 'bg-amber-500/5 border-amber-500/20 text-amber-500',
                  alert.type === 'info' && 'bg-blue-500/5 border-blue-500/20 text-blue-500',
                )}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Corretores Ativos Details ═══ */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Produtividade dos Corretores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">{metrics.totalBrokers}</p>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
            </div>
            <div className="text-center p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <p className="text-2xl font-bold text-emerald-500">{metrics.activeBrokersCount}</p>
              <p className="text-xs text-muted-foreground">Ativos no período</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">{metrics.activityRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Taxa de atividade</p>
            </div>
          </div>
          {metrics.totalBrokers > metrics.activeBrokersCount && (
            <div className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <UserMinus className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />
              {metrics.totalBrokers - metrics.activeBrokersCount} corretor(es) sem vendas registradas no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Sub-components ───

const KPICardCompact = ({ title, value, change, subtitle, icon, accent }: {
  title: string; value: string; change?: number; subtitle?: string; icon: React.ReactNode; accent: string;
}) => (
  <Card className="border-border/50 hover:border-primary/20 transition-colors">
    <CardContent className="pt-4 pb-4 px-4">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg bg-muted/50", accent)}>{icon}</div>
        {change !== undefined && (
          <Badge variant={change >= 0 ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0 h-5">
            {change >= 0 ? '+' : ''}{change.toFixed(0)}%
          </Badge>
        )}
      </div>
      <p className="text-xl font-bold text-foreground mt-3 tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle || title}</p>
    </CardContent>
  </Card>
);

const IndicatorRow = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <span className="font-bold text-sm text-foreground">{value}</span>
  </div>
);

const TeamRankItem = ({ team, index, maxVGV }: { team: any; index: number; maxVGV: number }) => {
  const barPct = (team.vgv / maxVGV) * 100;
  const medalColors = ['from-yellow-400 to-amber-500', 'from-slate-300 to-slate-400', 'from-orange-400 to-orange-600'];

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", index === 0 ? "bg-amber-500/5 border-amber-500/20" : "border-border/50")}>
      {index < 3 ? (
        <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0", medalColors[index])}>
          {index === 0 ? <Trophy className="w-4 h-4 text-white" /> : <Medal className="w-4 h-4 text-white" />}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{team.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{team.sales} vendas</span>
          <span>•</span>
          <span>{team.brokers} corretores</span>
        </div>
        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", index === 0 ? "bg-amber-500" : "bg-primary/60")} style={{ width: `${barPct}%` }} />
        </div>
      </div>
      <span className={cn("font-bold text-sm shrink-0", index === 0 ? "text-amber-500" : "text-foreground")}>{formatCurrency(team.vgv)}</span>
    </div>
  );
};

const BrokerRankItem = ({ broker, index, maxVGV }: { broker: any; index: number; maxVGV: number }) => {
  const barPct = (broker.vgv / maxVGV) * 100;
  const medalEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-all", index === 0 ? "bg-amber-500/5 border-amber-500/20" : "border-border/30")}>
      <div className="w-8 text-center shrink-0">
        {index < 3 ? (
          <span className="text-lg">{medalEmojis[index]}</span>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
        )}
      </div>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={broker.avatar || ''} />
        <AvatarFallback className="text-[10px]">{broker.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{broker.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{broker.sales} vendas</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-bold", index === 0 ? "text-amber-500" : "text-foreground")}>{formatCurrency(broker.vgv)}</p>
      </div>
    </div>
  );
};

export default DiretorDashboard;
