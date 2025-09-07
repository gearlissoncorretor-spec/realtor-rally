import Navigation from "@/components/Navigation";
import KPICard from "@/components/KPICard";
import DashboardChart from "@/components/DashboardChart";
import RankingPodium from "@/components/RankingPodium";
import { 
  Home, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  BarChart3 
} from "lucide-react";
import heroImage from "@/assets/dashboard-hero.jpg";

const Index = () => {
  // Mock data - in a real app, this would come from your API/Supabase
  const kpiData = [
    {
      title: "VGV Total",
      value: "R$ 2.4M",
      change: 12.5,
      trend: "up" as const,
      icon: <DollarSign className="w-6 h-6 text-primary" />
    },
    {
      title: "VGC do Mês",
      value: "R$ 480K",
      change: 8.2,
      trend: "up" as const,
      icon: <TrendingUp className="w-6 h-6 text-success" />
    },
    {
      title: "Vendas Realizadas",
      value: "24",
      change: -3.1,
      trend: "down" as const,
      icon: <Home className="w-6 h-6 text-warning" />
    },
    {
      title: "Taxa de Conversão",
      value: "18.5%",
      change: 2.8,
      trend: "up" as const,
      icon: <Target className="w-6 h-6 text-info" />
    }
  ];

  const chartData = [
    { month: "Jan", vgv: 320000, vgc: 180000, sales: 8 },
    { month: "Fev", vgv: 420000, vgc: 250000, sales: 12 },
    { month: "Mar", vgv: 380000, vgc: 220000, sales: 10 },
    { month: "Abr", vgv: 520000, vgc: 300000, sales: 15 },
    { month: "Mai", vgv: 480000, vgc: 280000, sales: 14 },
    { month: "Jun", vgv: 620000, vgc: 350000, sales: 18 }
  ];

  const brokerRankings = [
    {
      id: "1",
      name: "Ana Silva",
      avatar: "/placeholder.svg",
      sales: 8,
      revenue: 850000,
      position: 1
    },
    {
      id: "2", 
      name: "Carlos Santos",
      avatar: "/placeholder.svg",
      sales: 6,
      revenue: 720000,
      position: 2
    },
    {
      id: "3",
      name: "Maria Oliveira", 
      avatar: "/placeholder.svg",
      sales: 5,
      revenue: 650000,
      position: 3
    },
    {
      id: "4",
      name: "João Costa",
      avatar: "/placeholder.svg", 
      sales: 4,
      revenue: 520000,
      position: 4
    },
    {
      id: "5",
      name: "Paula Lima",
      avatar: "/placeholder.svg",
      sales: 3,
      revenue: 420000,
      position: 5
    }
  ];

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
            <DashboardChart
              data={chartData}
              type="bar"
              title="Vendas por Mês"
              height={250}
            />
          </div>
          
          <div className="space-y-6">
            <RankingPodium brokers={brokerRankings} />
            
            <KPICard
              title="Meta do Mês"
              value="78%"
              change={5.2}
              trend="up"
              icon={<BarChart3 className="w-6 h-6 text-primary" />}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-card rounded-xl p-6 border border-border animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Corretores Ativos</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-sm text-muted-foreground">+2 este mês</p>
          </div>

          <div className="bg-gradient-card rounded-xl p-6 border border-border animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Home className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-foreground">Imóveis em Carteira</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">248</p>
            <p className="text-sm text-muted-foreground">18 novos esta semana</p>
          </div>

          <div className="bg-gradient-card rounded-xl p-6 border border-border animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-foreground">Leads Qualificados</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">67</p>
            <p className="text-sm text-muted-foreground">32% taxa de conversão</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
