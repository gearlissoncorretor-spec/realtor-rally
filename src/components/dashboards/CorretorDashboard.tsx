import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Target, TrendingUp, Calendar, Award, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';

const CorretorDashboard = () => {
  const { profile, user } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();

  // Find current broker data
  const currentBroker = brokers?.find(broker => broker.user_id === user?.id);
  
  // Filter sales for current broker only
  const brokerSales = sales?.filter(sale => sale.broker_id === currentBroker?.id) || [];
  
  const totalSales = brokerSales.length;
  const totalVGV = brokerSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
  const totalCommission = brokerSales.reduce((sum, sale) => sum + (sale.commission_value || 0), 0);
  
  // Current month data
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthSales = brokerSales.filter(sale => {
    const saleDate = new Date(sale.sale_date || '');
    return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear;
  });
  
  const monthVGV = monthSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);

  // Mock goals data (in real app, this would come from targets table)
  const goals = {
    metaPiso: 500000,
    metaAlvo: 1000000,
    realizado: monthVGV
  };

  const metaPercentage = goals.metaAlvo > 0 ? (goals.realizado / goals.metaAlvo) * 100 : 0;

  // Recent sales for the broker
  const recentSales = brokerSales
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Corretor</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo, {profile?.full_name}. Acompanhe seu desempenho individual.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Personal KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthSales.length}</div>
            <p className="text-xs text-muted-foreground">
              de {totalSales} vendas totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VGV do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(monthVGV)}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(goals.metaAlvo)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              Comissões acumuladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Atingida</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metaPercentage)}%</div>
            <p className="text-xs text-muted-foreground">
              da meta alvo mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress and Recent Sales */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas Pessoais
            </CardTitle>
            <CardDescription>
              Acompanhe seu progresso em relação às metas estabelecidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Meta Piso */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Meta Piso</span>
                  <span className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                    }).format(goals.metaPiso)}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${goals.realizado >= goals.metaPiso ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${Math.min((goals.realizado / goals.metaPiso) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {goals.realizado >= goals.metaPiso ? 'Meta atingida!' : 
                   `Faltam ${new Intl.NumberFormat('pt-BR', {
                     style: 'currency',
                     currency: 'BRL',
                     minimumFractionDigits: 0,
                   }).format(goals.metaPiso - goals.realizado)}`}
                </p>
              </div>

              {/* Meta Alvo */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Meta Alvo</span>
                  <span className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                    }).format(goals.metaAlvo)}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${goals.realizado >= goals.metaAlvo ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min((goals.realizado / goals.metaAlvo) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {goals.realizado >= goals.metaAlvo ? 'Meta superada!' : 
                   `${Math.round(metaPercentage)}% concluído`}
                </p>
              </div>

              {/* Realizado */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Realizado</span>
                  <span className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                    }).format(goals.realizado)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Vendas Recentes
            </CardTitle>
            <CardDescription>
              Suas últimas vendas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.length > 0 ? recentSales.map((sale, index) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sale.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.property_type} • {new Date(sale.sale_date || '').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                      }).format(sale.vgv || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.status}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma venda realizada ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorretorDashboard;