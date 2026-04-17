import { Card } from "@/components/ui/card";
import { Trophy, Medal, Crown } from "lucide-react";
import { formatCurrencyCompact } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import type { Sale } from "@/contexts/DataContext";
import type { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

type Broker = Database['public']['Tables']['brokers']['Row'];

interface TopBrokersRankingProps {
  sales: Sale[];
  brokers: Broker[];
}

export const TopBrokersRanking = ({ sales, brokers }: TopBrokersRankingProps) => {
  const confirmedSales = sales.filter(s => s.status === 'confirmada');
  
  const brokerRankings = brokers.map(broker => {
    const brokerSales = confirmedSales.filter(s => s.broker_id === broker.id && s.tipo === 'venda' && s.parceria_tipo !== 'Agência');
    const totalVGV = brokerSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    return { broker, salesCount: brokerSales.length, totalVGV };
  })
  .filter(b => b.salesCount > 0)
  .sort((a, b) => b.totalVGV - a.totalVGV)
  .slice(0, 5);

  const maxVGV = brokerRankings[0]?.totalVGV || 1;

  const getRankConfig = (index: number) => {
    if (index === 0) return { 
      gradient: 'from-amber-500/15 to-amber-600/5',
      border: 'border-amber-500/25',
      icon: Crown,
      iconColor: 'text-amber-500',
      badge: 'bg-amber-500 text-white',
    };
    if (index === 1) return { 
      gradient: 'from-slate-400/15 to-slate-500/5',
      border: 'border-slate-400/25',
      icon: Medal,
      iconColor: 'text-slate-400',
      badge: 'bg-slate-400 text-white',
    };
    if (index === 2) return { 
      gradient: 'from-orange-500/15 to-orange-600/5',
      border: 'border-orange-500/25',
      icon: Medal,
      iconColor: 'text-orange-600',
      badge: 'bg-orange-600 text-white',
    };
    return { 
      gradient: 'from-muted/50 to-muted/20',
      border: 'border-border/50',
      icon: Medal,
      iconColor: 'text-muted-foreground',
      badge: 'bg-muted text-muted-foreground',
    };
  };

  if (brokerRankings.length === 0) {
    return (
      <Card className="p-5 border-border/50 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground text-sm">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Sem vendas confirmadas no período</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-border/50 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
          <Trophy className="w-3.5 h-3.5 text-warning" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Top Corretores</h3>
      </div>
      
      <div className="space-y-2.5">
        {brokerRankings.map((item, index) => {
          const config = getRankConfig(index);
          const Icon = config.icon;
          const initials = item.broker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
          const progressPercent = (item.totalVGV / maxVGV) * 100;
          
          return (
            <div 
              key={item.broker.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r transition-all hover:shadow-sm",
                config.gradient,
                config.border,
              )}
            >
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", config.badge)}>
                {index + 1}
              </div>
              
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={item.broker.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-muted font-semibold">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{item.broker.name}</p>
                  <p className="text-xs font-bold text-foreground shrink-0">{formatCurrencyCompact(item.totalVGV)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progressPercent} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.salesCount}v</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TopBrokersRanking;
