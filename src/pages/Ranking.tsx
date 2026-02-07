import Navigation from "@/components/Navigation";
import RankingPodium from "@/components/RankingPodium";
import { RankingSkeleton } from "@/components/skeletons/RankingSkeleton";
import PeriodFilter from "@/components/PeriodFilter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, TrendingDown, ExternalLink, Sparkles, Flame, Medal, Star } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { calculateGrowth } from "@/utils/calculations";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const Ranking = () => {
  const { brokers, sales, brokersLoading, salesLoading } = useData();
  
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      if (selectedYear > 0 && saleDate.getFullYear() !== selectedYear) return false;
      if (selectedMonth > 0 && saleDate.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });
  }, [sales, selectedMonth, selectedYear]);

  const brokerRankings = useMemo(() => {
    return brokers.map(broker => {
      const brokerSales = filteredSales.filter(sale => sale.broker_id === broker.id);
      const totalRevenue = brokerSales.reduce((sum, sale) => sum + Number(sale.property_value), 0);
      const salesCount = brokerSales.length;
      
      return {
        id: broker.id,
        name: broker.name,
        avatar: broker.avatar_url || '',
        sales: salesCount,
        revenue: totalRevenue,
        position: 0,
        growth: calculateGrowth(broker.id, sales),
        email: broker.email
      };
    })
    .filter(broker => broker.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map((broker, index) => ({ ...broker, position: index + 1 }));
  }, [brokers, filteredSales, sales]);

  const openTVMode = () => {
    const url = window.location.origin + '/ranking?tv=true';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Check if TV mode
  const isTVMode = new URLSearchParams(window.location.search).get('tv') === 'true';

  if (brokersLoading || salesLoading) {
    return (
      <div className="min-h-screen bg-background">
        {!isTVMode && <Navigation />}
        <div className={cn(!isTVMode && "lg:ml-64 pt-16 lg:pt-0", "p-4 lg:p-6")}>
          <RankingSkeleton />
        </div>
      </div>
    );
  }

  // TV MODE - Full screen gamified view
  if (isTVMode) {
    return <RankingTVMode brokerRankings={brokerRankings} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-3 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-warning" />
              Ranking de Corretores
            </h1>
            <p className="text-sm text-muted-foreground">Performance e classificação da equipe</p>
          </div>
          <Button onClick={openTVMode} variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Abrir para TV
          </Button>
        </div>

        <PeriodFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {/* Gamified Podium */}
        <div className="mb-6">
          <RankingPodium brokers={brokerRankings.slice(0, 3)} />
        </div>

        {/* Detailed Ranking Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Flame className="w-5 h-5 text-warning" />
            <h2 className="font-semibold text-foreground">Classificação Completa</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Corretor</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Vendas</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Receita</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Crescimento</th>
                </tr>
              </thead>
              <tbody>
                {brokerRankings.map((broker) => (
                  <tr 
                    key={broker.id} 
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-muted/30",
                      broker.position === 1 && "bg-warning/5",
                      broker.position === 2 && "bg-muted/20",
                      broker.position === 3 && "bg-orange-500/5",
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <PositionBadge position={broker.position} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={broker.avatar} />
                          <AvatarFallback className="text-xs">{broker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{broker.name}</p>
                          <p className="text-xs text-muted-foreground">{broker.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-lg font-bold text-foreground">{broker.sales}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm">{formatCurrency(broker.revenue)}</p>
                    </td>
                    <td className="py-3 px-4">
                      {broker.growth !== null ? (
                        <div className="flex items-center gap-1">
                          {broker.growth > 0 ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <span className={cn(
                            "text-sm font-medium",
                            broker.growth > 0 ? 'text-success' : 'text-destructive'
                          )}>
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
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum corretor encontrado no período</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Position badge with medal styling
const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
        <Trophy className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (position === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md">
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (position === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
      <span className="text-xs font-bold text-muted-foreground">{position}</span>
    </div>
  );
};

// TV Mode Component - Fullscreen gamified ranking
const RankingTVMode = ({ brokerRankings }: { brokerRankings: any[] }) => {
  const top3 = brokerRankings.slice(0, 3);
  const rest = brokerRankings.slice(3, 10);
  
  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [
    top3.find(b => b.position === 2),
    top3.find(b => b.position === 1),
    top3.find(b => b.position === 3),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 lg:p-10 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-warning/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-warning animate-pulse" />
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              RANKING DE CORRETORES
            </h1>
            <Sparkles className="w-8 h-8 text-warning animate-pulse" />
          </div>
          <p className="text-blue-300/60 text-sm">Performance em tempo real</p>
        </div>

        {/* TV Podium */}
        <div className="flex items-end justify-center gap-6 lg:gap-10 mb-10">
          {podiumOrder.map((broker: any, index) => {
            const isFirst = broker.position === 1;
            const heights = ['h-40', 'h-52', 'h-36'];
            const avatarSizes = ['w-20 h-20', 'w-28 h-28', 'w-18 h-18'];
            const colors = [
              'from-slate-400/30 to-slate-500/20 border-slate-400/40',
              'from-yellow-500/30 to-amber-500/20 border-yellow-400/50',
              'from-orange-500/30 to-orange-600/20 border-orange-400/40',
            ];
            
            return (
              <div key={broker.id} className="flex flex-col items-center animate-float-up" style={{ animationDelay: `${index * 0.2}s` }}>
                {/* Avatar */}
                <div className="relative mb-4">
                  {isFirst && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
                  )}
                  <Avatar className={cn(
                    avatarSizes[index],
                    "ring-4 shadow-2xl",
                    isFirst ? "ring-yellow-400/60 shadow-yellow-500/30" : 
                    broker.position === 2 ? "ring-slate-400/60" : "ring-orange-400/60"
                  )}>
                    <AvatarImage src={broker.avatar} alt={broker.name} />
                    <AvatarFallback className="text-2xl font-bold bg-slate-700">
                      {broker.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Name & Stats */}
                <p className={cn(
                  "font-bold text-center mb-1",
                  isFirst ? "text-xl text-white" : "text-base text-white/80"
                )}>
                  {broker.name.split(' ').slice(0, 2).join(' ')}
                </p>
                <p className="text-sm text-blue-300/80 mb-1">{broker.sales} vendas</p>
                <p className={cn(
                  "font-bold mb-3",
                  isFirst ? "text-xl text-yellow-400" : "text-base text-blue-300"
                )}>
                  {formatCurrency(broker.revenue)}
                </p>
                
                {/* Podium Base */}
                <div className={cn(
                  "w-32 lg:w-40 rounded-t-xl border-2 border-b-0 bg-gradient-to-t flex items-center justify-center",
                  heights[index],
                  colors[index],
                  isFirst && "animate-glow-border"
                )}>
                  <span className={cn(
                    "font-black",
                    isFirst ? "text-6xl text-yellow-400" : "text-4xl text-white/50"
                  )}>
                    {broker.position}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of ranking */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {rest.map((broker: any) => (
              <div
                key={broker.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white/60">#{broker.position}</span>
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={broker.avatar} />
                  <AvatarFallback className="text-xs bg-slate-700">
                    {broker.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{broker.name}</p>
                  <p className="text-xs text-blue-300/60">{broker.sales} vendas</p>
                </div>
                <p className="font-bold text-sm text-blue-300">{formatCurrency(broker.revenue)}</p>
              </div>
            ))}
          </div>
        )}

        {brokerRankings.length === 0 && (
          <div className="text-center py-20">
            <Star className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg">Nenhum dado para exibir</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;