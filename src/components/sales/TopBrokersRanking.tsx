import { Card } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import { formatCurrencyCompact } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import type { Sale } from "@/contexts/DataContext";
import type { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Broker = Database['public']['Tables']['brokers']['Row'];

interface TopBrokersRankingProps {
  sales: Sale[];
  brokers: Broker[];
}

export const TopBrokersRanking = ({ sales, brokers }: TopBrokersRankingProps) => {
  // Calculate top 3 brokers by confirmed sales VGV
  const confirmedSales = sales.filter(s => s.status === 'confirmada');
  
  const brokerRankings = brokers.map(broker => {
    const brokerSales = confirmedSales.filter(s => s.broker_id === broker.id);
    const totalVGV = brokerSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    return {
      broker,
      salesCount: brokerSales.length,
      totalVGV,
    };
  })
  .filter(b => b.salesCount > 0)
  .sort((a, b) => b.totalVGV - a.totalVGV)
  .slice(0, 3);

  const getRankStyle = (position: number) => {
    switch (position) {
      case 0:
        return { 
          bgColor: 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10',
          borderColor: 'border-yellow-500/30',
          iconColor: 'text-yellow-500',
          icon: Trophy,
        };
      case 1:
        return { 
          bgColor: 'bg-gradient-to-br from-slate-300/20 to-slate-400/10',
          borderColor: 'border-slate-400/30',
          iconColor: 'text-slate-400',
          icon: Medal,
        };
      case 2:
        return { 
          bgColor: 'bg-gradient-to-br from-orange-600/20 to-orange-700/10',
          borderColor: 'border-orange-600/30',
          iconColor: 'text-orange-600',
          icon: Medal,
        };
      default:
        return { 
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted',
          iconColor: 'text-muted-foreground',
          icon: Medal,
        };
    }
  };

  if (brokerRankings.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Top Corretores</h3>
      </div>
      
      <div className="space-y-3">
        {brokerRankings.map((item, index) => {
          const style = getRankStyle(index);
          const Icon = style.icon;
          const initials = item.broker.name
            .split(' ')
            .slice(0, 2)
            .map(n => n[0])
            .join('')
            .toUpperCase();
          
          return (
            <div 
              key={item.broker.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
                style.bgColor,
                style.borderColor
              )}
            >
              <div className="flex-shrink-0">
                <Icon className={cn("w-5 h-5", style.iconColor)} />
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.broker.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.broker.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.salesCount} {item.salesCount === 1 ? 'venda' : 'vendas'}
                </p>
              </div>
              
              <div className="text-right">
                <p className={cn("text-sm font-bold", style.iconColor)}>
                  {formatCurrencyCompact(item.totalVGV)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TopBrokersRanking;
