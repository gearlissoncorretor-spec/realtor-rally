import Navigation from "@/components/Navigation";
import KPICard from "@/components/KPICard";
import DashboardChart from "@/components/DashboardChart";
import PropertyTypeChart from "@/components/PropertyTypeChart";
import TicketMedioChart from "@/components/TicketMedioChart";
import VGCPercentageCard from "@/components/VGCPercentageCard";
import PeriodFilter from "@/components/PeriodFilter";
import RankingPodium from "@/components/RankingPodium";

import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatCurrencyCompact } from "@/utils/formatting";
import { 
  Home, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  BarChart3 
} from "lucide-react";
import { useState, useMemo } from "react";
import heroImage from "@/assets/dashboard-hero.jpg";

const Index = () => {
  const { brokers, sales, brokersLoading, salesLoading } = useData();
  
  // Estado para filtros de período
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = todos os meses
  const [selectedYear, setSelectedYear] = useState(0); // 0 = todos os anos

  // Filtrar vendas baseado no período selecionado
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      
      // Filtro de ano
      if (selectedYear > 0 && saleDate.getFullYear() !== selectedYear) {
        return false;
      }
      
      // Filtro de mês (1-12, onde 0 = todos os meses)
      if (selectedMonth > 0 && saleDate.getMonth() + 1 !== selectedMonth) {
        return false;
      }
      
      return true;
    });
  }, [sales, selectedMonth, selectedYear]);

  // Calculate KPIs from filtered data
  const totalVGV = filteredSales.reduce((sum, sale) => sum + Number(sale.vgv), 0);
  const totalVGC = filteredSales.reduce((sum, sale) => sum + Number(sale.vgc), 0);
  const totalSales = filteredSales.length;
  const activeBrokers = brokers.filter(b => b.status === 'ativo').length;
  
  // Calculate this month's data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date || sale.created_at || '');
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  
  const thisMonthVGC = thisMonthSales.reduce((sum, sale) => sum + Number(sale.vgc), 0);
  const conversionRate = totalSales > 0 ? ((filteredSales.filter(s => s.status === 'confirmada').length / totalSales) * 100) : 0;

  const kpiData = [
    {
      title: "VGV Total",
      value: formatCurrency(totalVGV),
      change: 12.5, // This would need to be calculated vs previous period
      trend: "up" as const,
      icon: <DollarSign className="w-6 h-6 text-primary" />
    },
    {
      title: "VGC do Mês",
      value: formatCurrency(thisMonthVGC),
      change: 8.2,
      trend: "up" as const,
      icon: <TrendingUp className="w-6 h-6 text-success" />
    },
    {
      title: "Vendas Realizadas",
      value: totalSales.toString(),
      change: -3.1,
      trend: (totalSales > 20 ? "up" : "down"),
      icon: <Home className="w-6 h-6 text-warning" />
    },
    {
      title: "Percentual VGC", 
      value: `${totalVGV > 0 ? ((totalVGC / totalVGV) * 100).toFixed(2).replace('.', ',') : '0,00'}%`,
      change: 2.8,
      trend: "up" as const,
      icon: <Target className="w-6 h-6 text-info" />
    }
  ] as const;

  // Generate chart data from filtered sales
  const generateChartData = () => {
    const monthlyData: { [key: string]: { vgv: number, vgc: number, sales: number } } = {};
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      monthlyData[monthKey] = { vgv: 0, vgc: 0, sales: 0 };
    }
    
    // Aggregate filtered sales data
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].vgv += Number(sale.vgv);
        monthlyData[monthKey].vgc += Number(sale.vgc);
        monthlyData[monthKey].sales += 1;
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  };

  const chartData = generateChartData();

  // Generate broker ranking data
  const brokerRankings = brokers.map(broker => {
    const brokerSales = sales.filter(sale => sale.broker_id === broker.id);
    const totalRevenue = brokerSales.reduce((sum, sale) => sum + Number(sale.property_value), 0);
    const salesCount = brokerSales.length;
    
    return {
      id: broker.id,
      name: broker.name,
      avatar: broker.avatar_url || '',
      sales: salesCount,
      revenue: totalRevenue,
      position: 0, // Will be set after sorting
      growth: Math.random() * 20 - 10 // Mock growth - would need historical data
    };
  })
  .sort((a, b) => b.revenue - a.revenue)
  .map((broker, index) => ({ ...broker, position: index + 1 }))
  .slice(0, 7); // Top 7 for ranking

  if (brokersLoading || salesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        
        {/* Hero Section */}
        <div 
          className="relative h-48 rounded-xl mb-8 overflow-hidden bg-gradient-hero flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.9)), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="text-center text-primary-foreground">
            <h1 className="text-4xl font-bold mb-2 animate-fade-in">
              Dashboard Imobiliário
            </h1>
            <p className="text-xl opacity-90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Gestão completa de vendas e performance
            </p>
          </div>
        </div>

        {/* Filtros de Período */}
        <PeriodFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={kpi.title}
              {...kpi}
              className={`animate-fade-in`}
            />
          ))}
        </div>

        {/* Charts and Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <DashboardChart
              data={chartData}
              type="line"
              title="VGV & VGC Mensal"
              height={350}
            />
            <TicketMedioChart
              sales={filteredSales}
              title="Ticket Médio das Vendas"
              height={250}
            />
          </div>
          
          <div className="space-y-6">
            <RankingPodium brokers={brokerRankings} />
            
            <VGCPercentageCard sales={filteredSales} />
            
            <KPICard
              title="Meta do Mês"
              value="78%"
              change={5.2}
              trend="up"
              icon={<BarChart3 className="w-6 h-6 text-primary" />}
            />
          </div>
        </div>

        {/* Charts Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PropertyTypeChart
            sales={filteredSales}
            title="Tipos de Imóveis Vendidos"
            height={300}
          />
          
          <div className="bg-gradient-card rounded-xl p-6 border border-border animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Estatísticas Rápidas</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Corretores Ativos</span>
                <span className="text-2xl font-bold text-foreground">{activeBrokers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Imóveis Pendentes</span>
                <span className="text-2xl font-bold text-foreground">{sales.filter(s => s.status === 'pendente').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Vendas</span>
                <span className="text-2xl font-bold text-foreground">{sales.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
