import { Card } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatting";
import { BrokerRanking } from "./types";

const StatsHeader = ({ brokers, activeBrokerCount }: { brokers: BrokerRanking[]; activeBrokerCount?: number }) => {
  const totalSales = brokers.reduce((sum, b) => sum + b.sales, 0);
  const totalVGV = brokers.reduce((sum, b) => sum + b.revenue, 0);
  const avgTicket = totalSales > 0 ? totalVGV / totalSales : 0;
  const activeCount = activeBrokerCount ?? brokers.length;

  const stats = [
    { icon: Users, label: "Corretores Ativos", value: activeCount.toString(), color: "text-primary", bg: "bg-primary/10", glow: "shadow-primary/5" },
    { icon: TrendingUp, label: "Vendas Totais", value: totalSales.toString(), color: "text-info", bg: "bg-info/10", glow: "shadow-info/5" },
    { icon: DollarSign, label: "VGV Total", value: formatCurrency(totalVGV), color: "text-success", bg: "bg-success/10", glow: "shadow-success/5" },
    { icon: Target, label: "Ticket Médio", value: formatCurrency(avgTicket), color: "text-warning", bg: "bg-warning/10", glow: "shadow-warning/5" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className={cn(
            "p-3 md:p-4 border-border/50 hover:border-primary/30 transition-all relative overflow-hidden group",
            `shadow-lg ${stat.glow}`
          )}>
            <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity", 
              i === 0 ? "from-primary/60 to-primary/20" : 
              i === 1 ? "from-success/60 to-success/20" : 
              i === 2 ? "from-info/60 to-info/20" : 
              "from-warning/60 to-warning/20"
            )} />
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                <Icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsHeader;
