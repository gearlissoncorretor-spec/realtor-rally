import React, { useState, useMemo, useCallback } from 'react';
import { useSales } from '@/hooks/useSales';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatting';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import {
  BarChart3, PieChart as PieIcon, TrendingUp, TrendingDown, Target,
  Users, User, Calendar, Filter, RotateCcw, Sparkles, Loader2,
  ArrowUpRight, ArrowDownRight, Award, AlertTriangle, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───
interface OriginMetrics {
  name: string;
  leads: number;
  vendas: number;
  conversao: number;
  valorTotal: number;
  ticketMedio: number;
}

interface OriginFilters {
  month: string;
  year: string;
  brokerId: string;
  teamId: string;
}

// ─── Colors ───
const CHART_COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(32, 95%, 44%)',
  'hsl(199, 89%, 48%)', 'hsl(280, 70%, 55%)', 'hsl(350, 80%, 55%)',
  'hsl(170, 70%, 45%)', 'hsl(45, 90%, 50%)', 'hsl(10, 80%, 55%)',
  'hsl(260, 60%, 50%)',
];

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

// ─── Component ───
interface OriginAnalyticsDashboardProps {
  brokerId?: string;
  compact?: boolean;
}

export const OriginAnalyticsDashboard: React.FC<OriginAnalyticsDashboardProps> = ({
  brokerId: fixedBrokerId,
  compact = false,
}) => {
  const { sales } = useSales();
  const { negotiations, lostNegotiations } = useNegotiations();
  const { brokers } = useBrokers();
  const { teams } = useTeams();
  const { isDiretor, isAdmin } = useAuth();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<OriginFilters>({
    month: currentMonth.toString(),
    year: currentYear.toString(),
    brokerId: fixedBrokerId || 'all',
    teamId: 'all',
  });


  const showFilters = !fixedBrokerId && !compact;

  // ─── Calculate Metrics ───
  const originsData = useMemo(() => {
    const allNegotiations = [...(negotiations || []), ...(lostNegotiations || [])];

    // Apply filters
    const filterByPeriod = (date: string) => {
      const d = new Date(date);
      if (filters.month !== 'all' && d.getMonth() + 1 !== parseInt(filters.month)) return false;
      if (filters.year !== 'all' && d.getFullYear() !== parseInt(filters.year)) return false;
      return true;
    };

    const filterByBroker = (brokerId: string | null) => {
      const targetBrokerId = fixedBrokerId || (filters.brokerId !== 'all' ? filters.brokerId : null);
      if (targetBrokerId && brokerId !== targetBrokerId) return false;
      if (filters.teamId !== 'all') {
        const teamBrokerIds = brokers?.filter(b => b.team_id === filters.teamId).map(b => b.id) || [];
        if (brokerId && !teamBrokerIds.includes(brokerId)) return false;
      }
      return true;
    };

    const filteredSales = (sales || []).filter(s =>
      s.status !== 'distrato' &&
      filterByPeriod(s.sale_date || s.created_at || '') &&
      filterByBroker(s.broker_id)
    );

    const filteredNegotiations = allNegotiations.filter(n =>
      filterByPeriod(n.start_date || n.created_at) &&
      filterByBroker(n.broker_id)
    );

    // Group by origin
    const originsMap = new Map<string, { leads: number; vendas: number; valorTotal: number; wonNegotiations: number }>();

    // Count negotiations as leads
    filteredNegotiations.forEach(n => {
      const origem = n.origem || 'Não informado';
      const entry = originsMap.get(origem) || { leads: 0, vendas: 0, valorTotal: 0, wonNegotiations: 0 };
      entry.leads += 1;
      if (n.status === 'venda_concluida' || n.status === 'ganha') {
        entry.wonNegotiations += 1;
      }
      originsMap.set(origem, entry);
    });

    // Count sales
    filteredSales.forEach(s => {
      const origem = s.origem || 'Não informado';
      const entry = originsMap.get(origem) || { leads: 0, vendas: 0, valorTotal: 0, wonNegotiations: 0 };
      entry.vendas += 1;
      entry.valorTotal += s.property_value || 0;
      // If no lead was counted for this origin, add it
      if (entry.leads === 0) entry.leads = entry.vendas;
      originsMap.set(origem, entry);
    });

    const result: OriginMetrics[] = Array.from(originsMap.entries())
      .map(([name, data]) => ({
        name,
        leads: Math.max(data.leads, data.vendas),
        vendas: data.vendas,
        conversao: data.leads > 0 ? (data.vendas / Math.max(data.leads, data.vendas)) * 100 : 0,
        valorTotal: data.valorTotal,
        ticketMedio: data.vendas > 0 ? data.valorTotal / data.vendas : 0,
      }))
      .sort((a, b) => b.vendas - a.vendas || b.leads - a.leads);

    return result;
  }, [sales, negotiations, lostNegotiations, brokers, filters, fixedBrokerId]);

  // ─── Totals ───
  const totals = useMemo(() => {
    const totalLeads = originsData.reduce((s, o) => s + o.leads, 0);
    const totalVendas = originsData.reduce((s, o) => s + o.vendas, 0);
    const totalValor = originsData.reduce((s, o) => s + o.valorTotal, 0);
    return {
      totalLeads,
      totalVendas,
      totalValor,
      conversaoGeral: totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0,
      ticketMedioGeral: totalVendas > 0 ? totalValor / totalVendas : 0,
    };
  }, [originsData]);

  // ─── Best / Worst origins ───
  const bestOrigin = useMemo(() => {
    const withSales = originsData.filter(o => o.vendas > 0);
    return withSales.sort((a, b) => b.conversao - a.conversao)[0] || null;
  }, [originsData]);

  const worstOrigin = useMemo(() => {
    const withLeads = originsData.filter(o => o.leads >= 2);
    return withLeads.sort((a, b) => a.conversao - b.conversao)[0] || null;
  }, [originsData]);

  // ─── Pie chart data ───
  const pieData = useMemo(() =>
    originsData.filter(o => o.vendas > 0).map(o => ({
      name: o.name,
      value: o.vendas,
    })), [originsData]);


  // ─── Compact Broker View ───
  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Origem dos Clientes
        </h2>

        {originsData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado de origem disponível</p>
        ) : (
          <>
            {/* Best / Worst */}
            <div className="grid grid-cols-2 gap-3">
              {bestOrigin && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium mb-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Melhor origem
                  </div>
                  <p className="text-sm font-bold text-foreground">{bestOrigin.name}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(bestOrigin.conversao)}% conversão</p>
                </div>
              )}
              {worstOrigin && worstOrigin.name !== bestOrigin?.name && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium mb-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Pior origem
                  </div>
                  <p className="text-sm font-bold text-foreground">{worstOrigin.name}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(worstOrigin.conversao)}% conversão</p>
                </div>
              )}
            </div>

            {/* Origin list */}
            <div className="space-y-2">
              {originsData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-foreground truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-muted-foreground">{item.vendas} venda{item.vendas !== 1 ? 's' : ''}</span>
                    <Badge variant="outline" className={cn("text-[10px]", item.conversao >= 50 ? "text-emerald-500 border-emerald-500/30" : item.conversao >= 20 ? "text-amber-500 border-amber-500/30" : "text-red-500 border-red-500/30")}>
                      {Math.round(item.conversao)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={originsData.slice(0, 8)} layout="vertical" margin={{ left: 5, right: 15 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [value, name === 'vendas' ? 'Vendas' : 'Leads']}
                  />
                  <Bar dataKey="vendas" name="vendas" radius={[0, 4, 4, 0]}>
                    {originsData.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Full Dashboard View ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          📊 Origem dos Clientes
        </h2>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Filtros:</span>
              </div>

              <Select value={filters.month} onValueChange={v => setFilters(f => ({ ...f, month: v }))}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.year} onValueChange={v => setFilters(f => ({ ...f, year: v }))}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(isDiretor() || isAdmin()) && (
                <>
                  <Select value={filters.teamId} onValueChange={v => setFilters(f => ({ ...f, teamId: v }))}>
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue placeholder="Equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas equipes</SelectItem>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filters.brokerId} onValueChange={v => setFilters(f => ({ ...f, brokerId: v }))}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Corretor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos corretores</SelectItem>
                      {brokers?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={() => setFilters({ month: 'all', year: 'all', brokerId: 'all', teamId: 'all' })}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {originsData.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum dado de origem encontrado para os filtros selecionados.</CardContent></Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={<Users className="w-4 h-4" />} label="Total Leads" value={totals.totalLeads.toString()} />
            <KPICard icon={<Target className="w-4 h-4" />} label="Total Vendas" value={totals.totalVendas.toString()} />
            <KPICard icon={<TrendingUp className="w-4 h-4" />} label="Conversão Geral" value={`${Math.round(totals.conversaoGeral)}%`} accent={totals.conversaoGeral >= 30} />
            <KPICard icon={<Award className="w-4 h-4" />} label="Ticket Médio" value={formatCurrency(totals.ticketMedioGeral)} />
          </div>

          {/* Best / Worst highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestOrigin && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/15">
                    <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">🏆 Melhor Origem</p>
                    <p className="text-lg font-bold text-foreground">{bestOrigin.name}</p>
                    <p className="text-sm text-emerald-500">
                      {Math.round(bestOrigin.conversao)}% conversão • {bestOrigin.vendas} vendas • {formatCurrency(bestOrigin.valorTotal)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {worstOrigin && worstOrigin.name !== bestOrigin?.name && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/15">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">⚠️ Menor Conversão</p>
                    <p className="text-lg font-bold text-foreground">{worstOrigin.name}</p>
                    <p className="text-sm text-red-500">
                      {Math.round(worstOrigin.conversao)}% conversão • {worstOrigin.leads} leads • {worstOrigin.vendas} vendas
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - Conversão por Origem */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Conversão por Origem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={originsData.slice(0, 10)} layout="vertical" margin={{ left: 5, right: 20 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'leads') return [value, 'Leads'];
                          if (name === 'vendas') return [value, 'Vendas'];
                          return [value, name];
                        }}
                      />
                      <Legend formatter={v => v === 'leads' ? 'Leads' : 'Vendas'} />
                      <Bar dataKey="leads" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="vendas" radius={[0, 4, 4, 0]}>
                        {originsData.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart - Participação das Vendas */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-primary" /> Participação das Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                          formatter={(value: number) => [`${value} vendas`, 'Vendas']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Nenhuma venda registrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Ranking das Origens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {originsData.map((item, index) => {
                  const maxLeads = originsData[0]?.leads || 1;
                  return (
                    <div key={item.name} className={cn(
                      "p-3 rounded-lg border transition-all",
                      index === 0 ? "bg-primary/5 border-primary/20" : "border-border/40 hover:border-border"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 text-center">
                            {index < 3 ? (
                              <span className="text-lg">{'🥇🥈🥉'[index]}</span>
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                            )}
                          </div>
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          item.conversao >= 50 ? "text-emerald-500 border-emerald-500/30" :
                          item.conversao >= 20 ? "text-amber-500 border-amber-500/30" :
                          "text-red-500 border-red-500/30"
                        )}>
                          {Math.round(item.conversao)}% conversão
                        </Badge>
                      </div>
                      <div className="ml-11 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Leads:</span>{' '}
                          <span className="font-semibold text-foreground">{item.leads}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vendas:</span>{' '}
                          <span className="font-semibold text-foreground">{item.vendas}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor:</span>{' '}
                          <span className="font-semibold text-foreground">{formatCurrency(item.valorTotal)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ticket:</span>{' '}
                          <span className="font-semibold text-foreground">{formatCurrency(item.ticketMedio)}</span>
                        </div>
                      </div>
                      <div className="ml-11 mt-2">
                        <Progress value={(item.leads / maxLeads) * 100} className="h-1.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
};

// ─── KPI Card ───
const KPICard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
  <Card>
    <CardContent className="py-4 flex items-center gap-3">
      <div className={cn("p-2.5 rounded-lg", accent ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary")}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-lg font-bold", accent ? "text-emerald-500" : "text-foreground")}>{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default OriginAnalyticsDashboard;
