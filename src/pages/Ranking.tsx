import Navigation from "@/components/Navigation";
import RankingPodium from "@/components/RankingPodium";
import VictoryEffects from "@/components/VictoryEffects";
import PeriodFilter from "@/components/PeriodFilter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { calculateGrowth } from "@/utils/calculations";
import { useState, useMemo } from "react";

const Ranking = () => {
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

  // Generate broker ranking data from filtered data
  const brokerRankings = brokers.map(broker => {
    const brokerSales = filteredSales.filter(sale => sale.broker_id === broker.id);
    const totalRevenue = brokerSales.reduce((sum, sale) => sum + Number(sale.property_value), 0);
    const salesCount = brokerSales.length;
    
    return {
      id: broker.id,
      name: broker.name,
      avatar: broker.avatar_url || '',
      sales: salesCount,
      revenue: totalRevenue,
      position: 0, // Will be set after sorting
      growth: calculateGrowth(broker.id, sales),
      email: broker.email
    };
  })
  .filter(broker => broker.revenue > 0)
  .sort((a, b) => b.revenue - a.revenue)
  .map((broker, index) => ({ ...broker, position: index + 1 }));

  if (brokersLoading || salesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Carregando ranking...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Ranking de Corretores</h1>
            <p className="text-muted-foreground">Performance e classificação da equipe</p>
          </div>
        </div>

        {/* Filtros de Período */}
        <PeriodFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {/* Podium Section */}
        <div className="mb-8 animate-fade-in">
          <RankingPodium brokers={brokerRankings.slice(0, 3)} />
        </div>

        {/* Detailed Ranking */}
        <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-warning" />
            <h2 className="text-xl font-semibold">Classificação Completa</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Posição</th>
                  <th className="text-left py-3 px-4">Corretor</th>
                  <th className="text-left py-3 px-4">Vendas</th>
                  <th className="text-left py-3 px-4">Receita</th>
                  <th className="text-left py-3 px-4">Crescimento</th>
                </tr>
              </thead>
              <tbody>
                {brokerRankings.map((broker, index) => (
                  <tr 
                    key={broker.id} 
                    className="border-b hover:bg-muted/50 transition-colors animate-fade-in relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="py-4 px-4 relative">
                      {broker.position === 1 && (
                        <VictoryEffects isFirstPlace={true} brokerName={broker.name} />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">#{broker.position}</span>
                        {broker.position <= 3 && (
                          <Trophy 
                            className={`w-4 h-4 ${
                              broker.position === 1 ? 'text-warning' : 
                              broker.position === 2 ? 'text-muted-foreground' : 
                              'text-orange-600'
                            }`} 
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={broker.avatar} />
                            <AvatarFallback>{broker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                        <div>
                          <p className="font-medium">{broker.name}</p>
                          <p className="text-sm text-muted-foreground">{broker.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-center">
                        <p className="font-bold text-2xl">{broker.sales}</p>
                        <p className="text-xs text-muted-foreground">vendas</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium">
                        {formatCurrency(broker.revenue)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {broker.growth !== null ? (
                        <div className="flex items-center gap-1">
                          {broker.growth > 0 ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <span className={`text-sm font-medium ${
                            broker.growth > 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {broker.growth > 0 ? '+' : ''}{broker.growth.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {brokerRankings.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum corretor encontrado</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Ranking;