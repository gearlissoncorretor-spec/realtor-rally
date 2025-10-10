import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Building, Calendar, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import DashboardFilters, { DashboardFiltersState } from '@/components/DashboardFilters';
import DashboardChart from '@/components/DashboardChart';
import Navigation from '@/components/Navigation';
import { calculateMonthlyData } from '@/utils/calculations';

const DashboardEquipes = () => {
  const { profile } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { teams, teamMembers } = useTeams();
  
  const [filters, setFilters] = useState<DashboardFiltersState>({
    teamId: 'all',
    brokerId: 'all',
    month: 'all',
    year: 'all'
  });

  // Filter data based on all selected filters
  const filteredData = useMemo(() => {
    let filteredSales = sales || [];
    let filteredBrokers = brokers || [];

    // Apply team filter
    if (filters.teamId !== 'all') {
      const teamMemberIds = teamMembers
        .filter(member => member.team_id === filters.teamId)
        .map(member => member.id);

      filteredBrokers = filteredBrokers.filter(broker => 
        teamMemberIds.includes(broker.user_id || '')
      );

      filteredSales = filteredSales.filter(sale => 
        filteredBrokers.some(broker => broker.id === sale.broker_id)
      );
    }

    // Apply broker filter
    if (filters.brokerId !== 'all') {
      filteredSales = filteredSales.filter(sale => 
        sale.broker_id === filters.brokerId
      );
      
      filteredBrokers = filteredBrokers.filter(broker => 
        broker.id === filters.brokerId
      );
    }

    // Apply month filter
    if (filters.month !== 'all') {
      filteredSales = filteredSales.filter(sale => {
        if (!sale.sale_date) return false;
        const saleMonth = new Date(sale.sale_date).getMonth() + 1;
        return saleMonth.toString() === filters.month;
      });
    }

    // Apply year filter
    if (filters.year !== 'all') {
      filteredSales = filteredSales.filter(sale => {
        if (!sale.sale_date) return false;
        const saleYear = new Date(sale.sale_date).getFullYear();
        return saleYear.toString() === filters.year;
      });
    }

    return { sales: filteredSales, brokers: filteredBrokers };
  }, [sales, brokers, teamMembers, filters]);

  // Calculate metrics
  const totalSales = filteredData.sales.length;
  const totalVGV = filteredData.sales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
  const totalBrokers = filteredData.brokers.length;
  const activeBrokers = filteredData.brokers.filter(broker => broker.status === 'ativo').length;

  // Calculate team stats
  const teamStats = useMemo(() => {
    let teamsToShow = teams;
    
    if (filters.teamId !== 'all') {
      teamsToShow = teams.filter(team => team.id === filters.teamId);
    }

    return teamsToShow.map(team => {
      const teamMemberIds = teamMembers
        .filter(member => member.team_id === team.id)
        .map(member => member.id);

      const teamBrokers = (brokers || []).filter(broker => 
        teamMemberIds.includes(broker.user_id || '')
      );

      let teamSales = (sales || []).filter(sale => 
        teamBrokers.some(broker => broker.id === sale.broker_id)
      );

      if (filters.brokerId !== 'all') {
        teamSales = teamSales.filter(sale => sale.broker_id === filters.brokerId);
      }

      if (filters.month !== 'all') {
        teamSales = teamSales.filter(sale => {
          if (!sale.sale_date) return false;
          const saleMonth = new Date(sale.sale_date).getMonth() + 1;
          return saleMonth.toString() === filters.month;
        });
      }

      if (filters.year !== 'all') {
        teamSales = teamSales.filter(sale => {
          if (!sale.sale_date) return false;
          const saleYear = new Date(sale.sale_date).getFullYear();
          return saleYear.toString() === filters.year;
        });
      }

      const confirmedSales = teamSales.filter(sale => sale.status === 'confirmada');
      const teamVGV = confirmedSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
      const teamVGC = confirmedSales.reduce((sum, sale) => sum + (sale.vgc || 0), 0);

      return {
        id: team.id,
        name: team.name,
        sales: confirmedSales.length,
        vgv: teamVGV,
        vgc: teamVGC,
        brokers: teamBrokers.length,
        activeBrokers: teamBrokers.filter(b => b.status === 'ativo').length
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [teams, teamMembers, brokers, sales, filters]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return calculateMonthlyData(filteredData.sales);
  }, [filteredData.sales]);

  return (
    <>
      <Navigation />
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Equipes</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo, {profile?.full_name}. Análise completa do desempenho das equipes.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Dashboard Filters */}
        <DashboardFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-muted-foreground">
                Vendas confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VGV Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                }).format(totalVGV)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total de vendas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corretores Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBrokers}</div>
              <p className="text-xs text-muted-foreground">
                de {totalBrokers} corretores totais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                }).format(totalSales > 0 ? totalVGV / totalSales : 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Média por venda
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardChart 
            data={chartData}
            type="bar"
            title="Desempenho Mensal - VGV"
            height={300}
          />
          <DashboardChart 
            data={chartData}
            type="line"
            title="Evolução de Vendas"
            height={300}
          />
        </div>

        {/* Team Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Ranking de Equipes
            </CardTitle>
            <CardDescription>
              Desempenho detalhado de cada equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamStats.length > 0 ? (
                teamStats.map((team, index) => (
                  <div 
                    key={team.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.activeBrokers} corretores ativos de {team.brokers} total
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Vendas</p>
                          <p className="font-bold text-lg">{team.sales}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">VGV</p>
                          <p className="font-bold text-lg">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                              notation: 'compact'
                            }).format(team.vgv)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">VGC</p>
                          <p className="font-bold text-lg">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                              notation: 'compact'
                            }).format(team.vgc)}
                          </p>
                        </div>
                      </div>
                      <div className="w-64 bg-secondary rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ 
                            width: `${teamStats[0]?.vgv > 0 ? Math.min((team.vgv / teamStats[0].vgv) * 100, 100) : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma equipe encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
};

export default DashboardEquipes;
