import { Card } from "@/components/ui/card";
import { 
  Target, 
  Wallet, 
  Trophy, 
  Clock, 
  TrendingUp,
  Sparkles
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
  // Exclude distratos from calculations
  const activeSales = sales.filter(s => s.status !== 'distrato');
  const confirmedSales = sales.filter(s => s.status === 'confirmada');
  
  // Calculate ticket médio
  const ticketMedio = activeSales.length > 0 
    ? activeSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0) / activeSales.length 
    : 0;
  
  // Calculate average commission
  const avgCommission = activeSales.length > 0 
    ? activeSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0) / activeSales.length 
    : 0;
  
  // Find top broker
  const brokerSales = brokers.map(broker => {
    const brokerConfirmedSales = confirmedSales.filter(s => s.broker_id === broker.id);
    const totalVGV = brokerConfirmedSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    return {
      broker,
      salesCount: brokerConfirmedSales.length,
      totalVGV,
    };
  }).sort((a, b) => b.totalVGV - a.totalVGV);
  
  const topBroker = brokerSales[0];
  
  // Calculate average closing time (days between created_at and sale_date)
  const salesWithDates = confirmedSales.filter(s => s.sale_date && s.created_at);
  const avgClosingDays = salesWithDates.length > 0 
    ? salesWithDates.reduce((sum, sale) => {
        const created = new Date(sale.created_at!);
        const closed = new Date(sale.sale_date!);
        const diffTime = Math.abs(closed.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / salesWithDates.length 
    : 0;
  
  // Conversion rate
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
    },
    {
      icon: Wallet,
      label: "Comissão Média",
      value: formatCurrency(avgCommission),
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Trophy,
      label: "Top Corretor",
      value: topBroker?.broker.name.split(' ')[0] || "—",
      subValue: topBroker ? `${topBroker.salesCount} vendas` : undefined,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Clock,
      label: "Tempo Médio",
      value: avgClosingDays > 0 ? `${Math.round(avgClosingDays)} dias` : "—",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: TrendingUp,
      label: "Taxa de Conversão",
      value: `${conversionRate.toFixed(1)}%`,
      color: conversionRate >= 50 ? "text-success" : "text-warning",
      bgColor: conversionRate >= 50 ? "bg-success/10" : "bg-warning/10",
    },
  ];

  return (
    <Card className="p-4 bg-gradient-to-r from-muted/50 to-transparent border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Resumo Inteligente</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
          >
            <div className={`w-9 h-9 rounded-lg ${insight.bgColor} flex items-center justify-center flex-shrink-0`}>
              <insight.icon className={`w-4 h-4 ${insight.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
                {insight.label}
              </p>
              <p className={`text-sm font-bold ${insight.color} truncate`}>
                {insight.value}
              </p>
              {insight.subValue && (
                <p className="text-[10px] text-muted-foreground">
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
