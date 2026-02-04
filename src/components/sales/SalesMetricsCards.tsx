import { Card } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { formatCurrency, formatCurrencyCompact } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import type { Sale } from "@/contexts/DataContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SalesMetricsCardsProps {
  sales: Sale[];
  previousPeriodSales?: Sale[];
}

export const SalesMetricsCards = ({ sales, previousPeriodSales = [] }: SalesMetricsCardsProps) => {
  // Exclude distratos from financial calculations
  const activeSales = sales.filter(s => s.status !== 'distrato');
  const previousActiveSales = previousPeriodSales.filter(s => s.status !== 'distrato');
  
  // Layer 1 - Financial Impact
  const totalVGV = activeSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
  const totalVGC = activeSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
  const previousVGV = previousActiveSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
  const previousVGC = previousActiveSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
  
  // Commission average per sale
  const avgCommission = activeSales.length > 0 ? totalVGC / activeSales.length : 0;
  
  // Layer 2 - Sales Quality
  const confirmedSales = sales.filter(s => s.status === 'confirmada');
  const canceledSales = sales.filter(s => s.status === 'cancelada');
  const pendingSales = sales.filter(s => s.status === 'pendente');
  const distratoSales = sales.filter(s => s.status === 'distrato');
  
  // Conversion rate
  const conversionRate = sales.length > 0 
    ? (confirmedSales.length / sales.length) * 100 
    : 0;
  
  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  const vgvChange = calculateChange(totalVGV, previousVGV);
  const vgcChange = calculateChange(totalVGC, previousVGC);

  return (
    <div className="space-y-4">
      {/* Layer 1 - Financial Impact (larger cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VGV Total */}
        <Card className="p-6 bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">VGV Total</p>
              <p className="text-3xl md:text-4xl font-bold text-success">
                {formatCurrencyCompact(totalVGV)}
              </p>
              <div className="flex items-center gap-2">
                {vgvChange !== 0 && (
                  <span className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    vgvChange > 0 ? "text-success" : "text-destructive"
                  )}>
                    {vgvChange > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(vgvChange).toFixed(1)}%
                  </span>
                )}
                <span className="text-xs text-muted-foreground">vs período anterior</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-success/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-success" />
            </div>
          </div>
        </Card>

        {/* VGC Total (Commission) */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Comissão Total (VGC)</p>
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {formatCurrencyCompact(totalVGC)}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Média por venda: <span className="font-semibold text-primary">{formatCurrency(avgCommission)}</span>
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Layer 2 & 3 - Quality and Volume */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Sales */}
        <Card className="p-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-bold text-foreground">{sales.length}</p>
              <p className="text-xs text-muted-foreground">no período</p>
            </div>
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Card>

        {/* Confirmed Sales */}
        <Card className="p-4 hover:shadow-md transition-all duration-300 border-success/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Confirmadas</p>
              <p className="text-2xl font-bold text-success">{confirmedSales.length}</p>
              <p className="text-xs text-success font-medium">{conversionRate.toFixed(1)}% taxa</p>
            </div>
            <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </div>
        </Card>

        {/* Canceled Sales */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-4 hover:shadow-md transition-all duration-300 border-destructive/20 cursor-help">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Canceladas</p>
                    <p className="text-2xl font-bold text-destructive">{canceledSales.length}</p>
                    <p className="text-xs text-muted-foreground">+ {distratoSales.length} distratos</p>
                  </div>
                  <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Vendas não concluídas:</p>
                <p>• {canceledSales.length} canceladas</p>
                <p>• {distratoSales.length} distratos</p>
                <p className="text-muted-foreground text-xs mt-2">
                  Distratos não contam nos totais financeiros
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Pending Sales */}
        <Card className="p-4 hover:shadow-md transition-all duration-300 border-warning/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-warning">{pendingSales.length}</p>
              <p className="text-xs text-warning font-medium">aguardando</p>
            </div>
            <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-warning border-t-transparent animate-spin" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SalesMetricsCards;
