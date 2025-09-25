import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import DashboardFilters, { DashboardFiltersState } from '@/components/DashboardFilters';

const GerenteDashboard = () => {
  const { profile, teamHierarchy } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  
  const [filters, setFilters] = useState<DashboardFiltersState>({
    teamId: teamHierarchy?.team_id || 'all',
    brokerId: 'all',
    month: 'all',
    year: 'all'
  });

  // Filter data for manager's team only
  const teamBrokers = brokers?.filter(broker => 
    teamHierarchy?.team_members.includes(broker.user_id || '')
  ) || [];

  // Apply filters to team data
  const filteredData = useMemo(() => {
    let filteredTeamSales = sales?.filter(sale => 
      teamBrokers.some(broker => broker.id === sale.broker_id)
    ) || [];

    let filteredTeamBrokers = teamBrokers;

    // Apply broker filter
    if (filters.brokerId !== 'all') {
      filteredTeamSales = filteredTeamSales.filter(sale => 
        sale.broker_id === filters.brokerId
      );
      
      filteredTeamBrokers = filteredTeamBrokers.filter(broker => 
        broker.id === filters.brokerId
      );
    }

    // Apply month filter
    if (filters.month !== 'all') {
      filteredTeamSales = filteredTeamSales.filter(sale => {
        if (!sale.sale_date) return false;
        const saleMonth = new Date(sale.sale_date).getMonth() + 1;
        return saleMonth.toString() === filters.month;
      });
    }

    // Apply year filter
    if (filters.year !== 'all') {
      filteredTeamSales = filteredTeamSales.filter(sale => {
        if (!sale.sale_date) return false;
        const saleYear = new Date(sale.sale_date).getFullYear();
        return saleYear.toString() === filters.year;
      });
    }

    return { sales: filteredTeamSales, brokers: filteredTeamBrokers };
  }, [sales, teamBrokers, filters]);

  const totalTeamSales = filteredData.sales.length;
  const totalTeamVGV = filteredData.sales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
  const activeTeamBrokers = filteredData.brokers.filter(broker => broker.status === 'ativo').length;

  // Broker performance in team with filters applied
  const brokerPerformance = filteredData.brokers.map(broker => {
    const brokerSales = filteredData.sales.filter(sale => sale.broker_id === broker.id);
    const brokerVGV = brokerSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
    return {
      name: broker.name,
      sales: brokerSales.length,
      vgv: brokerVGV,
      id: broker.id
    };
  }).sort((a, b) => b.vgv - a.vgv);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerente</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo, {profile?.full_name}. Gerencie sua equipe: {teamHierarchy?.team_name || 'Sua Equipe'}.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Dashboard Filters - Hide team filter for managers since they can only see their own team */}
      <DashboardFilters 
        filters={filters}
        onFiltersChange={setFilters}
        hideTeamFilter={true}
      />

      {/* Team KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas da Equipe</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamSales}</div>
            <p className="text-xs text-muted-foreground">
              +15% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VGV da Equipe</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(totalTeamVGV)}
            </div>
            <p className="text-xs text-muted-foreground">
              +10% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corretores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeamBrokers}</div>
            <p className="text-xs text-muted-foreground">
              de {teamBrokers.length} corretores na equipe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta da Equipe</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Meta mensal atingida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Ranking da Equipe
            </CardTitle>
            <CardDescription>
              Performance individual dos corretores da sua equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {brokerPerformance.slice(0, 5).map((broker, index) => (
                <div key={broker.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{broker.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {broker.sales} vendas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                      }).format(broker.vgv)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métricas da Equipe
            </CardTitle>
            <CardDescription>
              Indicadores de performance consolidados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Ticket Médio</span>
                <span className="text-sm font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(totalTeamSales > 0 ? totalTeamVGV / totalTeamSales : 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vendas por Corretor</span>
                <span className="text-sm font-bold">
                  {teamBrokers.length > 0 ? Math.round((totalTeamSales / teamBrokers.length) * 10) / 10 : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Taxa de Conversão</span>
                <span className="text-sm font-bold">24%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Comissões da Equipe</span>
                <span className="text-sm font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(totalTeamVGV * 0.05)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GerenteDashboard;