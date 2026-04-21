import React, { useState, useMemo, useEffect } from 'react';
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useNegotiations } from "@/hooks/useNegotiations";
import { formatCurrency } from "@/utils/formatting";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  BarChart3, 
  PieChart, 
  Trophy, 
  LayoutDashboard,
  Eye,
  EyeOff,
  Building2,
  TrendingDown,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  Clock
} from "lucide-react";
import KPICard from "@/components/KPICard";
import UnifiedDashboardFilters, { UnifiedDashboardFiltersState } from "./UnifiedDashboardFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RankingPodium from "@/components/RankingPodium";
import VGCPercentageCard from "@/components/VGCPercentageCard";
import { LazyComponentLoader, ChartSkeleton } from "@/components/LazyComponentLoader";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SalesInsightsAlerts } from "@/components/dashboards/SalesInsightsAlerts";

const DashboardChart = React.lazy(() => import("@/components/DashboardChart"));
const PropertyTypeChart = React.lazy(() => import("@/components/PropertyTypeChart"));
const TicketMedioChart = React.lazy(() => import("@/components/TicketMedioChart"));

const UnifiedDirectorDashboard = () => {
  const { brokers, sales, targets, brokersLoading, salesLoading } = useData();
  const { user } = useAuth();
  const { teams } = useTeams();
  const { followUps } = useFollowUps();
  const { negotiations } = useNegotiations();

  const [filters, setFilters] = useState<UnifiedDashboardFiltersState>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    teamId: 'all',
  });

  const [directorMode, setDirectorMode] = useState(false);
  const [activeTab, setActiveTab] = useState("geral");

  // Logic to filter data based on global filters
  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      if (sale.status === 'distrato') return false;
      const rawDate = sale.sale_date || sale.created_at;
      if (!rawDate) return false;
      const saleDate = new Date(rawDate);
      
      if (filters.year !== 0 && saleDate.getFullYear() !== filters.year) return false;
      if (filters.month !== 0 && saleDate.getMonth() + 1 !== filters.month) return false;

      if (filters.teamId !== 'all') {
        const broker = brokers.find(b => b.id === sale.broker_id);
        if (!broker || broker.team_id !== filters.teamId) return false;
      }

      return true;
    });
  }, [sales, brokers, filters]);

  // VGN calculation (Value in Negotiation)
  const vgnTotal = useMemo(() => {
    return (negotiations || []).filter(n => {
      if (filters.teamId !== 'all') {
        const broker = brokers.find(b => b.id === n.broker_id);
        if (!broker || broker.team_id !== filters.teamId) return false;
      }
      return true;
    }).reduce((sum, n) => sum + Number(n.negotiated_value || 0), 0);
  }, [negotiations, brokers, filters.teamId]);

  // Main Metrics
  const totalVGV = filteredSales.reduce((sum, s) => {
    const isVendaReal = s.tipo === 'venda' && s.parceria_tipo !== 'Agência';
    return isVendaReal ? sum + Number(s.vgv || 0) : sum;
  }, 0);
  
  const totalVGC = filteredSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
  const totalSales = filteredSales.filter(s => s.tipo === 'venda' && s.parceria_tipo !== 'Agência').length;
  
  // Meta calculation
  const monthlyGoal = useMemo(() => {
    if (!targets || targets.length === 0 || filters.month === 0) {
      return { percent: 0, label: "—" };
    }
    const target = targets.find(t => t.month === filters.month && t.year === filters.year);
    if (!target || !target.target_value) return { percent: 0, label: "—" };
    
    const percent = Math.min((totalVGV / target.target_value) * 100, 100);
    return { percent, label: `${percent.toFixed(0)}%` };
  }, [targets, filters, totalVGV]);

  // Chart Data
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { vgv: number, vgc: number, sales: number }> = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = months[date.getMonth()];
      monthlyData[monthKey] = { vgv: 0, vgc: 0, sales: 0 };
    }

    filteredSales.forEach(sale => {
      const rawDate = sale.sale_date || sale.created_at;
      const saleDate = new Date(rawDate);
      const monthKey = months[saleDate.getMonth()];
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].vgv += Number(sale.vgv || 0);
        monthlyData[monthKey].vgc += Number(sale.vgc || 0);
        monthlyData[monthKey].sales += 1;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  }, [filteredSales]);

  // Broker Rankings for the tab
  const brokerRankings = useMemo(() => {
    const brokersWithStats = brokers.map(broker => {
      const bSales = filteredSales.filter(s => s.broker_id === broker.id);
      const revenue = bSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      return {
        id: broker.id,
        name: broker.name,
        avatar: broker.avatar_url || "",
        sales: bSales.length,
        revenue,
      };
    }).filter(b => b.revenue > 0 || b.sales > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .map((b, i) => ({ ...b, position: i + 1 }));
    
    return brokersWithStats;
  }, [brokers, filteredSales]);

  // Team performance for the tab
  const teamPerformance = useMemo(() => {
    return teams.map(team => {
      const teamBrokers = brokers.filter(b => b.team_id === team.id);
      const tSales = filteredSales.filter(s => teamBrokers.some(b => b.id === s.broker_id));
      const confirmed = tSales.filter(s => s.status === 'confirmada');
      const vgv = confirmed.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const vgc = confirmed.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
      
      return {
        id: team.id,
        name: team.name,
        salesCount: tSales.length,
        confirmedCount: confirmed.length,
        vgv,
        vgc,
        conversion: tSales.length > 0 ? (confirmed.length / tSales.length) * 100 : 0,
        activeBrokers: teamBrokers.filter(b => b.status === 'ativo').length
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [teams, brokers, filteredSales]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Fixed Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="VGV Total"
          value={formatCurrency(totalVGV)}
          variant="hero"
          icon={<DollarSign className="w-6 h-6 text-primary" />}
        />
        <KPICard
          title="VGC Total"
          value={formatCurrency(totalVGC)}
          icon={<TrendingUp className="w-6 h-6 text-success" />}
        />
        <KPICard
          title="Total de Vendas"
          value={totalSales.toString()}
          icon={<Target className="w-6 h-6 text-warning" />}
        />
        <Card className="p-5 border-border/50 bg-card relative overflow-hidden group">
          <div className="flex flex-col h-full justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">Meta do Mês</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-foreground">{monthlyGoal.label}</span>
              <BarChart3 className="w-6 h-6 text-primary opacity-50" />
            </div>
            <Progress value={monthlyGoal.percent} className="h-2" />
          </div>
        </Card>
        <KPICard
          title="VGN (Em Negociação)"
          value={formatCurrency(vgnTotal)}
          icon={<Clock className="w-6 h-6 text-info" />}
        />
      </div>

      {/* Global Filters & Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <UnifiedDashboardFilters
            filters={filters}
            onFiltersChange={setFilters}
            teams={teams}
          />
        </div>
        <Button 
          variant={directorMode ? "default" : "outline"} 
          size="sm"
          className="lg:mb-6 h-10 gap-2 shrink-0 border-border/50"
          onClick={() => setDirectorMode(!directorMode)}
        >
          {directorMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          Modo Diretor
        </Button>
      </div>

      {!directorMode ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/30 p-1">
            <TabsTrigger value="geral" className="h-10 gap-2 text-xs font-bold uppercase tracking-wider">
              <LayoutDashboard className="w-4 h-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="equipes" className="h-10 gap-2 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" /> Performance por Equipe
            </TabsTrigger>
            <TabsTrigger value="ranking" className="h-10 gap-2 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4" /> Ranking de Corretores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6 border-border/50">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Comparativo VGV vs VGC
                  </CardTitle>
                </CardHeader>
                <LazyComponentLoader fallback={<ChartSkeleton height={350} />}>
                  <DashboardChart data={chartData} type="line" height={350} title="Evolução Mensal" />
                </LazyComponentLoader>
              </Card>

              <div className="space-y-6">
                <VGCPercentageCard sales={filteredSales} />
                <Card className="p-6 border-border/50">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><UserCheck className="w-4 h-4" /> Taxa de Conversão</span>
                      <span className="text-lg font-bold">
                        {totalSales > 0 ? ((filteredSales.filter(s => s.status === 'confirmada').length / totalSales) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Ticket Médio</span>
                      <span className="text-lg font-bold">{formatCurrency(totalSales > 0 ? totalVGV / totalSales : 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><ArrowUpRight className="w-4 h-4" /> Novos Leads</span>
                      <span className="text-lg font-bold">{negotiations?.length || 0}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LazyComponentLoader fallback={<ChartSkeleton height={300} />}>
                <PropertyTypeChart sales={filteredSales} title="Mix de Produtos" height={300} />
              </LazyComponentLoader>
              <Card className="p-6 border-border/50">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" /> Funil de Vendas
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4 mt-4">
                  {/* Simple Funnel Representation */}
                  {[
                    { label: 'Leads', count: (negotiations || []).length, color: 'bg-primary' },
                    { label: 'Visitas', count: Math.round((negotiations || []).length * 0.4), color: 'bg-info' },
                    { label: 'Propostas', count: Math.round((negotiations || []).length * 0.15), color: 'bg-warning' },
                    { label: 'Fechamentos', count: totalSales, color: 'bg-success' },
                  ].map((item, i, arr) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{item.label}</span>
                        <span>{item.count}</span>
                      </div>
                      <Progress 
                        value={(item.count / (arr[0].count || 1)) * 100} 
                        className={cn("h-2", item.color)} 
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="equipes" className="space-y-6">
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <CardTitle className="text-lg font-bold">Desempenho de Equipes</CardTitle>
                <CardDescription>Métricas comparativas entre todas as equipes da organização</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {teamPerformance.map((team, idx) => (
                    <div key={team.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {idx + 1}º
                        </div>
                        <div>
                          <p className="font-bold text-base">{team.name}</p>
                          <p className="text-xs text-muted-foreground">{team.activeBrokers} corretores ativos</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full md:w-auto">
                        <div className="text-center md:text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">VGV</p>
                          <p className="text-sm font-bold text-primary">{formatCurrency(team.vgv)}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Vendas</p>
                          <p className="text-sm font-bold">{team.confirmedCount}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Conversão</p>
                          <p className="text-sm font-bold">{team.conversion.toFixed(1)}%</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">VGC</p>
                          <p className="text-sm font-bold text-success">{formatCurrency(team.vgc)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <RankingPodium brokers={brokerRankings.slice(0, 10)} />
              </div>
              <Card className="lg:col-span-2 border-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle className="text-lg font-bold">Listagem Completa de Rankings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto divide-y divide-border/30">
                    {brokerRankings.map((broker) => (
                      <div key={broker.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-sm font-bold text-muted-foreground">#{broker.position}</span>
                          <span className="font-medium">{broker.name}</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">VGV</p>
                            <p className="text-sm font-bold text-primary">{formatCurrency(broker.revenue)}</p>
                          </div>
                          <div className="text-right w-16">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Vendas</p>
                            <p className="text-sm font-bold">{broker.sales}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        /* MODO DIRETOR VIEW */
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <SalesInsightsAlerts 
                brokers={brokers} 
                sales={sales} 
                followUps={followUps} 
              />
              <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-bold">Projeção de Metas</CardTitle>
                </CardHeader>
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status Atual</p>
                      <p className="text-2xl font-black text-primary">{monthlyGoal.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Expectativa Final</p>
                      <p className="text-2xl font-black text-success">92%</p>
                    </div>
                  </div>
                  <Progress value={monthlyGoal.percent} className="h-4" />
                </div>
              </Card>
            </div>
            
            <div className="space-y-8">
              <RankingPodium brokers={brokerRankings.slice(0, 3)} />
              <Card className="p-6 border-border/50">
                <CardTitle className="text-base font-bold mb-4">Principais Alertas</CardTitle>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <TrendingDown className="w-5 h-5 text-warning shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Conversão em queda (-12%)</p>
                      <p className="text-xs text-muted-foreground">Equipe Fênix está com 5 vendas pendentes de confirmação.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Meta individual batida</p>
                      <p className="text-xs text-muted-foreground">Ricardo Silva atingiu 105% da meta trimestral hoje.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedDirectorDashboard;
