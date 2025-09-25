import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Target, TrendingUp, Building, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import TeamFilter from '@/components/TeamFilter';

const DiretorDashboard = () => {
  const { profile } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { teams, teamMembers } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  // Filter data based on selected team
  const filteredData = useMemo(() => {
    if (selectedTeamId === 'all') {
      return { sales: sales || [], brokers: brokers || [] };
    }

    // Get team member IDs for selected team
    const teamMemberIds = teamMembers
      .filter(member => member.team_id === selectedTeamId)
      .map(member => member.id);

    // Filter brokers by team
    const filteredBrokers = (brokers || []).filter(broker => 
      teamMemberIds.includes(broker.user_id || '')
    );

    // Filter sales by team brokers
    const filteredSales = (sales || []).filter(sale => 
      filteredBrokers.some(broker => broker.id === sale.broker_id)
    );

    return { sales: filteredSales, brokers: filteredBrokers };
  }, [sales, brokers, teamMembers, selectedTeamId]);

  // Calculate metrics for director view (filtered)
  const totalSales = filteredData.sales.length;
  const totalVGV = filteredData.sales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
  const totalBrokers = filteredData.brokers.length;
  const activeBrokers = filteredData.brokers.filter(broker => broker.status === 'ativo').length;

  // Calculate real team stats based on data
  const teamStats = useMemo(() => {
    return teams.map(team => {
      // Get team member IDs
      const teamMemberIds = teamMembers
        .filter(member => member.team_id === team.id)
        .map(member => member.id);

      // Get team brokers
      const teamBrokers = (brokers || []).filter(broker => 
        teamMemberIds.includes(broker.user_id || '')
      );

      // Get team sales
      const teamSales = (sales || []).filter(sale => 
        teamBrokers.some(broker => broker.id === sale.broker_id)
      );

      const confirmedSales = teamSales.filter(sale => sale.status === 'confirmada');
      const teamVGV = confirmedSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);

      return {
        id: team.id,
        name: team.name,
        sales: confirmedSales.length,
        vgv: teamVGV,
        brokers: teamBrokers.length
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [teams, teamMembers, brokers, sales]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Diretor</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo, {profile?.full_name}. Visão geral de todas as equipes e operações.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Team Filter */}
      <div className="mb-6">
        <div className="max-w-xs">
          <TeamFilter 
            selectedTeamId={selectedTeamId}
            onTeamChange={(teamId) => setSelectedTeamId(teamId)}
          />
        </div>
      </div>

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
              +12% em relação ao mês anterior
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
              +8% em relação ao mês anterior
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
            <CardTitle className="text-sm font-medium">Meta Global</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Meta anual atingida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Performance por Equipe
            </CardTitle>
            <CardDescription>
              Comparativo de vendas entre as equipes no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamStats.map((team, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.sales} vendas • {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                      }).format(team.vgv)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min((team.sales / 20) * 100, 100)}%` }}
                      />
                    </div>
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
              Resumo Financeiro
            </CardTitle>
            <CardDescription>
              Indicadores financeiros consolidados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Receita Bruta</span>
                <span className="text-sm font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(totalVGV)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Comissões Pagas</span>
                <span className="text-sm font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(totalVGV * 0.05)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Ticket Médio</span>
                <span className="text-sm font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(totalSales > 0 ? totalVGV / totalSales : 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiretorDashboard;