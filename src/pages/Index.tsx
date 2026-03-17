import Navigation from "@/components/Navigation";
import KPICard from "@/components/KPICard";
import PeriodFilter from "@/components/PeriodFilter";
import RankingPodium from "@/components/RankingPodium";
import VGCPercentageCard from "@/components/VGCPercentageCard";
import NegotiationAlert from "@/components/NegotiationAlert";
import { LazyComponentLoader, ChartSkeleton } from "@/components/LazyComponentLoader";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import React, { useState, useMemo, useEffect } from "react";
import GerenteDashboard from "@/components/dashboards/GerenteDashboard";
import CorretorDashboard from "@/components/dashboards/CorretorDashboard";
import DiretorDashboard from "@/components/dashboards/DiretorDashboard";

const DashboardChart = React.lazy(() => import("@/components/DashboardChart"));
const PropertyTypeChart = React.lazy(() => import("@/components/PropertyTypeChart"));
const TicketMedioChart = React.lazy(() => import("@/components/TicketMedioChart"));

import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { formatCurrency } from "@/utils/formatting";
import { Home, TrendingUp, DollarSign, Users, Target, BarChart3, Filter, UserMinus } from "lucide-react";
import heroImage from "@/assets/dashboard-hero.jpg";
import { useContextualIdentity } from "@/hooks/useContextualIdentity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

/**
 * Hook para centralizar cálculos de métricas do dashboard
 */
function useDashboardMetrics(sales: any[], brokers: any[], selectedMonth: number, selectedYear: number, teamFilter?: string | null, targets?: any[]) {
  // Filtro de vendas baseado no período - EXCLUI DISTRATOS dos cálculos
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Excluir distratos dos cálculos do dashboard
      if (sale.status === 'distrato') return false;
      
      const rawDate = sale.sale_date || sale.created_at;
      if (!rawDate) return false;

      const saleDate = new Date(rawDate);
      if (isNaN(saleDate.getTime())) return false;

      if (selectedYear > 0 && saleDate.getFullYear() !== selectedYear) return false;
      if (selectedMonth > 0 && saleDate.getMonth() + 1 !== selectedMonth) return false;

      // Filter by team if specified
      if (teamFilter && teamFilter !== 'all') {
        const broker = brokers.find(b => b.id === sale.broker_id);
        if (!broker || broker.team_id !== teamFilter) return false;
      }

      return true;
    });
  }, [sales, selectedMonth, selectedYear, teamFilter, brokers]);

  // Brokers filtered by team
  const filteredBrokers = useMemo(() => {
    if (teamFilter && teamFilter !== 'all') {
      return brokers.filter(b => b.team_id === teamFilter);
    }
    return brokers;
  }, [brokers, teamFilter]);

  // Métricas principais
  const totalVGV = filteredSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
  const totalVGC = filteredSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
  const totalSales = filteredSales.length;
  const activeBrokers = filteredBrokers.filter(b => b.status === "ativo").length;
  const inactiveBrokers = filteredBrokers.filter(b => b.status === "inativo").length;
  const totalBrokersForTurnover = activeBrokers + inactiveBrokers;
  const turnoverRate = totalBrokersForTurnover > 0 ? (inactiveBrokers / totalBrokersForTurnover) * 100 : 0;
  const vgcPercentage = totalVGV > 0 ? (totalVGC / totalVGV) * 100 : 0;

  // Taxa de conversão
  const conversionRate = totalSales > 0
    ? ((filteredSales.filter(s => s.status === "confirmada").length / totalSales) * 100)
    : 0;

  // Cálculo do mês anterior para comparação
  const previousPeriodMetrics = useMemo(() => {
    let prevMonth = selectedMonth > 0 ? selectedMonth - 1 : 0;
    let prevYear = selectedYear > 0 ? selectedYear : new Date().getFullYear();
    
    if (selectedMonth === 1) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    } else if (selectedMonth === 0) {
      const now = new Date();
      prevMonth = now.getMonth();
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = prevYear - 1;
      }
    }

    const previousSales = sales.filter(sale => {
      const rawDate = sale.sale_date || sale.created_at;
      if (!rawDate) return false;

      const saleDate = new Date(rawDate);
      if (isNaN(saleDate.getTime())) return false;

      if (prevYear > 0 && saleDate.getFullYear() !== prevYear) return false;
      if (prevMonth > 0 && saleDate.getMonth() + 1 !== prevMonth) return false;

      if (teamFilter && teamFilter !== 'all') {
        const broker = brokers.find(b => b.id === sale.broker_id);
        if (!broker || broker.team_id !== teamFilter) return false;
      }

      return true;
    });

    const prevVGV = previousSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    const prevVGC = previousSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
    const prevSalesCount = previousSales.length;
    const prevVGCPercentage = prevVGV > 0 ? (prevVGC / prevVGV) * 100 : 0;

    return { prevVGV, prevVGC, prevSalesCount, prevVGCPercentage };
  }, [sales, selectedMonth, selectedYear, teamFilter, brokers]);

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrend = (change: number): "up" | "down" | "neutral" => {
    if (change > 0) return "up";
    if (change < 0) return "down";
    return "neutral";
  };

  // Gerar dados de gráfico (últimos 12 meses)
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { vgv: number, vgc: number, sales: number }> = {};
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = months[date.getMonth()];
      monthlyData[monthKey] = { vgv: 0, vgc: 0, sales: 0 };
    }

    filteredSales.forEach(sale => {
      const rawDate = sale.sale_date || sale.created_at;
      const saleDate = new Date(rawDate);
      if (isNaN(saleDate.getTime())) return;

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

  // Ranking de corretores
  const brokerRankings = useMemo(() => {
    return filteredBrokers.map(broker => {
      const brokerSales = filteredSales.filter(s => s.broker_id === broker.id);
      const revenue = brokerSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      return {
        id: broker.id,
        name: broker.name,
        avatar: broker.avatar_url || "",
        sales: brokerSales.length,
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .map((broker, idx) => ({ ...broker, position: idx + 1 }))
    .slice(0, 7);
  }, [filteredSales, filteredBrokers]);

  // KPIs
  const vgvChange = calculateChange(totalVGV, previousPeriodMetrics.prevVGV);
  const vgcChange = calculateChange(totalVGC, previousPeriodMetrics.prevVGC);
  const salesChange = calculateChange(totalSales, previousPeriodMetrics.prevSalesCount);
  const vgcPercentageChange = calculateChange(vgcPercentage, previousPeriodMetrics.prevVGCPercentage);

  const kpiData = [
    {
      title: "VGV Total",
      value: formatCurrency(totalVGV),
      change: Math.round(vgvChange),
      trend: getTrend(vgvChange),
      icon: <DollarSign className="w-6 h-6 text-primary" />
    },
    {
      title: "VGC Total",
      value: formatCurrency(totalVGC),
      change: Math.round(vgcChange),
      trend: getTrend(vgcChange),
      icon: <TrendingUp className="w-6 h-6 text-success" />
    },
    {
      title: "Vendas Realizadas",
      value: totalSales.toString(),
      change: Math.round(salesChange),
      trend: getTrend(salesChange),
      icon: <Home className="w-6 h-6 text-warning" />
    },
    {
      title: "Percentual VGC",
      value: `${vgcPercentage.toFixed(2).replace('.', ',')}%`,
      change: Math.round(vgcPercentageChange),
      trend: getTrend(vgcPercentageChange),
      icon: <Target className="w-6 h-6 text-info" />
    }
  ] as const;

  // Estatísticas rápidas
  const quickStats = {
    activeBrokers,
    totalSales,
    turnoverRate: turnoverRate.toFixed(1),
    inactiveBrokers,
  };

  // Meta do mês - calcula com dados reais de targets
  const monthlyGoal = useMemo(() => {
    if (!targets || targets.length === 0) {
      return { percent: "—", trend: "neutral" as const, change: 0 };
    }
    const currentTarget = targets.find((t: any) => t.month === selectedMonth && t.year === selectedYear);
    if (!currentTarget || !currentTarget.target_value) {
      return { percent: "—", trend: "neutral" as const, change: 0 };
    }
    const target = currentTarget.target_value;
    const percent = Math.min((totalVGV / target) * 100, 999).toFixed(0);
    return {
      percent: `${percent}%`,
      trend: Number(percent) >= 100 ? "up" as const : Number(percent) >= 50 ? "neutral" as const : "down" as const,
      change: Number(percent) - 100,
    };
  }, [targets, selectedMonth, selectedYear, totalVGV]);

  return {
    filteredSales,
    kpiData,
    chartData,
    brokerRankings,
    quickStats,
    monthlyGoal
  };
}

const DiretorDashboardPage = () => {
  const { brokers, sales, brokersLoading, salesLoading, brokersError, salesError } = useData();
  const { displayName, subtitle } = useContextualIdentity();
  const { isDiretor, isAdmin } = useAuth();
  const { teams } = useTeams();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [showNegotiationAlert, setShowNegotiationAlert] = useState(true);

  const isDirectorView = isDiretor() || isAdmin();

  useEffect(() => {
    const alertDismissed = sessionStorage.getItem('negotiationAlertDismissed');
    if (alertDismissed) {
      setShowNegotiationAlert(false);
    }
  }, []);

  const handleDismissAlert = () => {
    setShowNegotiationAlert(false);
    sessionStorage.setItem('negotiationAlertDismissed', 'true');
  };

  const {
    filteredSales,
    kpiData,
    chartData,
    brokerRankings,
    quickStats,
    monthlyGoal
  } = useDashboardMetrics(sales, brokers, selectedMonth, selectedYear, isDirectorView ? selectedTeam : null);

  // Per-team breakdown for directors
  const teamBreakdown = useMemo(() => {
    if (!isDirectorView || teams.length === 0) return [];

    return teams.map(team => {
      const teamBrokers = brokers.filter(b => b.team_id === team.id);
      const active = teamBrokers.filter(b => b.status === 'ativo').length;
      const inactive = teamBrokers.filter(b => b.status === 'inativo').length;
      const total = active + inactive;
      const turnover = total > 0 ? (inactive / total) * 100 : 0;
      
      const teamSales = sales.filter(sale => {
        if (sale.status === 'distrato') return false;
        const broker = brokers.find(b => b.id === sale.broker_id);
        if (!broker || broker.team_id !== team.id) return false;
        const rawDate = sale.sale_date || sale.created_at;
        if (!rawDate) return false;
        const saleDate = new Date(rawDate);
        if (isNaN(saleDate.getTime())) return false;
        if (selectedYear > 0 && saleDate.getFullYear() !== selectedYear) return false;
        if (selectedMonth > 0 && saleDate.getMonth() + 1 !== selectedMonth) return false;
        return true;
      });

      return {
        id: team.id,
        name: team.name,
        activeBrokers: active,
        totalSales: teamSales.length,
        turnoverRate: turnover.toFixed(1),
      };
    }).filter(t => t.activeBrokers > 0 || t.totalSales > 0);
  }, [isDirectorView, teams, brokers, sales, selectedMonth, selectedYear]);

  const isInitialLoading = (brokersLoading || salesLoading) && brokers.length === 0 && sales.length === 0;
  const hasError = brokersError || salesError;

  if (hasError && !isInitialLoading) {
    const errorMessage = brokersError?.message || salesError?.message || 'Erro ao carregar dados';
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Target className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Erro ao carregar dashboard</h2>
            <p className="text-sm text-muted-foreground max-w-md">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6 min-h-screen">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground/95 tracking-tight">
            {displayName}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Alerta de Negociações */}
        {showNegotiationAlert && (
          <div className="mb-6">
            <NegotiationAlert onClose={handleDismissAlert} />
          </div>
        )}

        {/* Filtros de Período + Team Filter for Directors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <PeriodFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
          {isDirectorView && teams.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-[200px] bg-card border-border/50">
                  <SelectValue placeholder="Filtrar por equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Equipes</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-8">
          {kpiData.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} className="animate-fade-in" />
          ))}
        </div>

        {/* Charts and Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-8">
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            <LazyComponentLoader fallback={<ChartSkeleton height={350} />}>
              <DashboardChart
                data={chartData}
                type="line"
                title="VGV & VGC Mensal"
                height={350}
              />
            </LazyComponentLoader>
            <LazyComponentLoader fallback={<ChartSkeleton height={250} />}>
              <TicketMedioChart
                sales={filteredSales}
                title="Ticket Médio das Vendas"
                height={250}
              />
            </LazyComponentLoader>
          </div>
          
          <div className="space-y-5 md:space-y-6">
            <RankingPodium brokers={brokerRankings} />
            <VGCPercentageCard sales={filteredSales} />
            <KPICard
              title="Meta do Mês"
              value={monthlyGoal.percent}
              change={monthlyGoal.change}
              trend={monthlyGoal.trend}
              icon={<BarChart3 className="w-6 h-6 text-primary" />}
            />
          </div>
        </div>

        {/* Charts Adicionais + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 mb-8">
          <LazyComponentLoader fallback={<ChartSkeleton height={300} />}>
            <PropertyTypeChart
              sales={filteredSales}
              title="Tipos de Imóveis Vendidos"
              height={300}
            />
          </LazyComponentLoader>
          
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Estatísticas Rápidas</h3>
              {isDirectorView && selectedTeam !== 'all' && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {teams.find(t => t.id === selectedTeam)?.name}
                </Badge>
              )}
            </div>
            
            {/* Main quick stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Corretores Ativos</span>
                </div>
                <span className="text-xl font-bold text-foreground tabular-nums">{quickStats.activeBrokers}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total de Vendas</span>
                </div>
                <span className="text-xl font-bold text-foreground tabular-nums">{quickStats.totalSales}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <UserMinus className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Turnover</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold tabular-nums ${Number(quickStats.turnoverRate) > 20 ? 'text-destructive' : Number(quickStats.turnoverRate) > 10 ? 'text-warning' : 'text-success'}`}>
                    {quickStats.turnoverRate}%
                  </span>
                  <span className="text-xs text-muted-foreground">({quickStats.inactiveBrokers} inativos)</span>
                </div>
              </div>
            </div>

            {/* Per-team breakdown for directors */}
            {isDirectorView && selectedTeam === 'all' && teamBreakdown.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Por Equipe</h4>
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                  {teamBreakdown.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team.id)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {team.name}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{team.activeBrokers} <span className="hidden sm:inline">ativos</span></span>
                        <span className="text-primary font-semibold">{team.totalSales} vendas</span>
                        <span className={`${Number(team.turnoverRate) > 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {team.turnoverRate}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// Dashboard principal - sempre renderiza o dashboard analítico com KPIs, gráficos e ranking
const Index = () => {
  return <DiretorDashboardPage />;
};

export default Index;