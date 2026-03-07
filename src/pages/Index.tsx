import Navigation from "@/components/Navigation";
import KPICard from "@/components/KPICard";
import PeriodFilter from "@/components/PeriodFilter";
import RankingPodium from "@/components/RankingPodium";
import VGCPercentageCard from "@/components/VGCPercentageCard";
import NegotiationAlert from "@/components/NegotiationAlert";
import { LazyComponentLoader, ChartSkeleton } from "@/components/LazyComponentLoader";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import React, { useState, useMemo, useEffect } from "react";

const DashboardChart = React.lazy(() => import("@/components/DashboardChart"));
const PropertyTypeChart = React.lazy(() => import("@/components/PropertyTypeChart"));
const TicketMedioChart = React.lazy(() => import("@/components/TicketMedioChart"));

import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { Home, TrendingUp, DollarSign, Users, Target, BarChart3 } from "lucide-react";
import heroImage from "@/assets/dashboard-hero.jpg";
import { useContextualIdentity } from "@/hooks/useContextualIdentity";

/**
 * Hook para centralizar cálculos de métricas do dashboard
 */
function useDashboardMetrics(sales: any[], brokers: any[], selectedMonth: number, selectedYear: number) {
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

      return true;
    });
  }, [sales, selectedMonth, selectedYear]);

  // Métricas principais
  const totalVGV = filteredSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
  const totalVGC = filteredSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
  const totalSales = filteredSales.length;
  const activeBrokers = brokers.filter(b => b.status === "ativo").length;
  const vgcPercentage = totalVGV > 0 ? (totalVGC / totalVGV) * 100 : 0;

  // Taxa de conversão
  const conversionRate = totalSales > 0
    ? ((filteredSales.filter(s => s.status === "confirmada").length / totalSales) * 100)
    : 0;

  // Cálculo do mês anterior para comparação
  const previousPeriodMetrics = useMemo(() => {
    let prevMonth = selectedMonth > 0 ? selectedMonth - 1 : 0;
    let prevYear = selectedYear > 0 ? selectedYear : new Date().getFullYear();
    
    // Se o mês anterior for 0 (estava em janeiro), volta para dezembro do ano anterior
    if (selectedMonth === 1) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    } else if (selectedMonth === 0) {
      // Se não há filtro de mês, usa o mês anterior ao atual
      const now = new Date();
      prevMonth = now.getMonth(); // getMonth retorna 0-11
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

      return true;
    });

    const prevVGV = previousSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    const prevVGC = previousSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
    const prevSalesCount = previousSales.length;
    const prevVGCPercentage = prevVGV > 0 ? (prevVGC / prevVGV) * 100 : 0;

    return { prevVGV, prevVGC, prevSalesCount, prevVGCPercentage };
  }, [sales, selectedMonth, selectedYear]);

  // Função auxiliar para calcular mudança percentual
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Função auxiliar para determinar trend
  const getTrend = (change: number): "up" | "down" | "neutral" => {
    if (change > 0) return "up";
    if (change < 0) return "down";
    return "neutral";
  };

  // Gerar dados de gráfico (últimos 12 meses)
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { vgv: number, vgc: number, sales: number }> = {};
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    // Inicializa últimos 12 meses
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
    return brokers.map(broker => {
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
  }, [filteredSales, brokers]);

  // KPIs principais com comparação do mês anterior
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
    pending: filteredSales.filter(s => s.status === "pendente").length,
    total: sales.length
  };

  // Meta do mês (mock, mas pode vir do banco)
  const monthlyGoal = {
    percent: "78%",
    trend: "up" as const,
    change: 5.2
  };

  return {
    filteredSales,
    kpiData,
    chartData,
    brokerRankings,
    quickStats,
    monthlyGoal
  };
}

const Index = () => {
  const { brokers, sales, brokersLoading, salesLoading, brokersError, salesError } = useData();
  const { displayName, subtitle } = useContextualIdentity();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [showNegotiationAlert, setShowNegotiationAlert] = useState(true);

  // Mostrar alerta apenas uma vez por sessão
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
  } = useDashboardMetrics(sales, brokers, selectedMonth, selectedYear);

  const isInitialLoading = (brokersLoading || salesLoading) && brokers.length === 0 && sales.length === 0;
  const hasError = brokersError || salesError;

  // Mostrar erro se houver problema ao carregar dados
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
      
      {/* Main Content */}
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6 min-h-screen">
        
        {/* Hero Section - Axis Branding (Compact & Clean) */}
        <div className="relative h-[100px] sm:h-[120px] rounded-2xl mb-8 overflow-hidden bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60 flex items-center justify-center">
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          <div className="relative z-10 px-8 sm:px-10 text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-white/50 font-medium tracking-wide mt-0.5">
              {subtitle || 'A evolução da gestão imobiliária'}
            </p>
          </div>
        </div>

        {/* Alerta de Negociações */}
        {showNegotiationAlert && (
          <div className="mb-6">
            <NegotiationAlert onClose={handleDismissAlert} />
          </div>
        )}

        {/* Filtros de Período */}
        <PeriodFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

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

        {/* Charts Adicionais */}
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
            </div>
            <div className="space-y-5">
              {[
                { label: "Corretores Ativos", value: quickStats.activeBrokers },
                { label: "Imóveis Pendentes", value: quickStats.pending },
                { label: "Total de Vendas", value: quickStats.total },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-xl font-bold text-foreground tabular-nums">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
