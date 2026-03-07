import { Card } from "@/components/ui/card";
import { 
  Target, 
  Wallet, 
  Trophy, 
  Clock, 
  TrendingUp,
  Sparkles,
  Percent
} from "lucide-react";
import { formatCurrency } from "@/utils/formatting";
import type { Sale } from "@/contexts/DataContext";
import type { Database } from "@/integrations/supabase/types";

type Broker = Database['public']['Tables']['brokers']['Row'];

interface SalesInsightsPanelProps {
  sales: Sale[];
  brokers: Broker[];
}

export const SalesInsightsPanel = ({ sales, brokers }: SalesInsightsPanelProps) => {
  const activeSales = sales.filter(s => s.status !== 'distrato');
  const confirmedSales = sales.filter(s => s.status === 'confirmada');
  
  const ticketMedio = activeSales.length > 0 
    ? activeSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0) / activeSales.length 
    : 0;
  
  const avgCommission = activeSales.length > 0 
    ? activeSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0) / activeSales.length 
    : 0;
  
  const brokerSales = brokers.map(broker => {
    const brokerConfirmedSales = confirmedSales.filter(s => s.broker_id === broker.id);
    const totalVGV = brokerConfirmedSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    return { broker, salesCount: brokerConfirmedSales.length, totalVGV };
  }).sort((a, b) => b.totalVGV - a.totalVGV);
  
  const topBroker = brokerSales[0];
  
  const salesWithDates = confirmedSales.filter(s => s.sale_date && s.created_at);
  const avgClosingDays = salesWithDates.length > 0 
    ? salesWithDates.reduce((sum, sale) => {
        const created = new Date(sale.created_at!);
        const closed = new Date(sale.sale_date!);
        const diffDays = Math.ceil(Math.abs(closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / salesWithDates.length 
    : 0;
  
  const conversionRate = sales.length > 0 
    ? (confirmedSales.length / sales.length) * 100 
    : 0;

  const insights = [
    {
      icon: Target,
      label: "Ticket Médio",
      value: formatCurrency(ticketMedio),
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      icon: Wallet,
      label: "Comissão Média",
      value: formatCurrency(avgCommission),
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
    },
    {
      icon: Trophy,
      label: "Top Corretor",
      value: topBroker?.broker.name.split(' ')[0] || "—",
      subValue: topBroker ? `${topBroker.salesCount} vendas` : undefined,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
    },
    {
      icon: Clock,
      label: "Tempo de Fechamento",
      value: avgClosingDays > 0 ? `${Math.round(avgClosingDays)} dias` : "—",
      color: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/20",
    },
    {
      icon: Percent,
      label: "Conversão",
      value: `${conversionRate.toFixed(1)}%`,
      color: conversionRate >= 50 ? "text-success" : "text-warning",
      bgColor: conversionRate >= 50 ? "bg-success/10" : "bg-warning/10",
      borderColor: conversionRate >= 50 ? "border-success/20" : "border-warning/20",
    },
  ];

  return (
    <Card className="p-5 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Insights de Performance</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`flex flex-col gap-2 p-3.5 rounded-xl border ${insight.borderColor} bg-background/50 hover:bg-background transition-all duration-200`}
          >
            <div className={`w-8 h-8 rounded-lg ${insight.bgColor} flex items-center justify-center`}>
              <insight.icon className={`w-4 h-4 ${insight.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {insight.label}
              </p>
              <p className={`text-sm font-bold ${insight.color} truncate mt-0.5`}>
                {insight.value}
              </p>
              {insight.subValue && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {insight.subValue}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SalesInsightsPanel;
