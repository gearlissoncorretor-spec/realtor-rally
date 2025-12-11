import Navigation from "@/components/Navigation";
import KPICard from "@/components/KPICard";
import PeriodFilter from "@/components/PeriodFilter";
import RankingPodium from "@/components/RankingPodium";
import VGCPercentageCard from "@/components/VGCPercentageCard";
import { LazyComponentLoader, ChartSkeleton } from "@/components/LazyComponentLoader";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import React, { useState, useMemo } from "react";

const DashboardChart = React.lazy(() => import("@/components/DashboardChart"));
const PropertyTypeChart = React.lazy(() => import("@/components/PropertyTypeChart"));
const TicketMedioChart = React.lazy(() => import("@/components/TicketMedioChart"));

import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { Home, TrendingUp, DollarSign, Users, Target, BarChart3 } from "lucide-react";
import heroImage from "@/assets/dashboard-hero.jpg";

/**
 * Hook para centralizar cálculos de métricas do dashboard
 */
function useDashboardMetrics(sales: any[], brokers: any[], selectedMonth: number, selectedYear: number) {
  // Filtro de vendas baseado no período
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
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
  const { brokers, sales, brokersLoading, salesLoading } = useData();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);

  const {
    filteredSales,
    kpiData,
    chartData,
    brokerRankings,
    quickStats,
    monthlyGoal
  } = useDashboardMetrics(sales, brokers, selectedMonth, selectedYear);

  const isInitialLoading = (brokersLoading || salesLoading) && brokers.length === 0 && sales.length === 0;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6 min-h-screen">
        
        {/* Hero Section - Premium Header */}
        <div className="relative h-[200px] sm:h-[220px] md:h-[240px] rounded-b-[40px] mb-6 md:mb-8 overflow-hidden bg-gradient-to-br from-[#0A84FF] via-[#0066FF] to-[#0048D9] flex items-center justify-center">
          
          {/* Skyline Background */}
          <div 
            className="absolute inset-x-0 bottom-0 h-24 opacity-10 blur-[1px] pointer-events-none"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "bottom center"
            }}
          />
          
          {/* Glow Effect */}
          <div className="absolute w-[200px] h-[200px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          
          {/* Glassmorphism Card */}
          <div className="relative z-10 backdrop-blur-sm bg-white/5 rounded-2xl px-6 sm:px-8 py-4 sm:py-6 text-center border border-white/10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1 sm:mb-2 animate-fade-in">
              Dashboard Imobiliário
            </h1>
            <p className="text-base sm:text-lg text-white/80 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Gestão completa de vendas e performance
            </p>
          </div>
          
          {/* Bottom gradient fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Filtros de Período */}
        <PeriodFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {kpiData.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} className="animate-fade-in" />
          ))}
        </div>

        {/* Charts and Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
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
          
          <div className="space-y-4 md:space-y-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <LazyComponentLoader fallback={<ChartSkeleton height={300} />}>
            <PropertyTypeChart
              sales={filteredSales}
              title="Tipos de Imóveis Vendidos"
              height={300}
            />
          </LazyComponentLoader>
          
          <div className="bg-gradient-card rounded-xl p-6 border border-border animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Estatísticas Rápidas</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Corretores Ativos</span>
                <span className="text-2xl font-bold text-foreground">{quickStats.activeBrokers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Imóveis Pendentes</span>
                <span className="text-2xl font-bold text-foreground">{quickStats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Vendas</span>
                <span className="text-2xl font-bold text-foreground">{quickStats.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
