import { Card } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Home
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
  const activeSales = sales.filter(s => s.status !== 'distrato');
  
  const totalVGV = activeSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
  const totalVGVCaptacao = activeSales.reduce((sum, s) => {
    const isOnlyCaptacao = s.tipo === 'captacao' || (s.tipo === 'venda' && s.parceria_tipo === 'Agência');
    return isOnlyCaptacao ? sum + Number(s.property_value || 0) : sum;
  }, 0);
  const totalVGC = activeSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
  const vgcPercentage = totalVGV > 0 ? (totalVGC / totalVGV) * 100 : 0;
  
  const confirmedSales = sales.filter(s => s.status === 'confirmada');
  const canceledSales = sales.filter(s => s.status === 'cancelada');
  const pendingSales = sales.filter(s => s.status === 'pendente');
  const distratoSales = sales.filter(s => s.status === 'distrato');
  
  const conversionRate = sales.length > 0 
    ? (confirmedSales.length / sales.length) * 100 
    : 0;

  const ticketMedio = activeSales.length > 0 ? totalVGV / activeSales.length : 0;

  return (
    <div className="space-y-4">
      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* VGV Vendas */}
        <Card className="relative overflow-hidden p-5 border-border/50 group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">VGV Vendas</p>
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-4.5 h-4.5 text-success" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {formatCurrencyCompact(totalVGV)}
            </p>
            <p className="text-xs text-muted-foreground">
              Ticket médio: <span className="font-semibold text-foreground">{formatCurrencyCompact(ticketMedio)}</span>
            </p>
          </div>
        </Card>

        {/* VGV Captação */}
        <Card className="relative overflow-hidden p-5 border-border/50 group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">VGV Captação</p>
              <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
                <Home className="w-4.5 h-4.5 text-info" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {formatCurrencyCompact(totalVGVCaptacao)}
            </p>
            <p className="text-xs text-muted-foreground">
              Volume captado no período
            </p>
          </div>
        </Card>

        {/* VGC Total */}
        <Card className="relative overflow-hidden p-5 border-border/50 group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comissão (VGC)</p>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-primary" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-primary tracking-tight">
              {formatCurrencyCompact(totalVGC)}
            </p>
            <p className="text-xs text-muted-foreground">
              Expectativa de recebimento
            </p>
          </div>
        </Card>

        {/* Total + Confirmadas */}
        <Card className="relative overflow-hidden p-5 border-border/50 group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendas</p>
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <ShoppingCart className="w-4.5 h-4.5 text-warning" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{sales.filter(s => s.tipo === 'venda').length}</p>
              <span className="text-sm font-semibold text-success">
                {confirmedSales.filter(s => s.tipo === 'venda').length} ✓
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de conversão: <span className="font-semibold text-foreground">{conversionRate.toFixed(0)}%</span>
            </p>
          </div>
        </Card>

        {/* Status Summary */}
        <Card className="relative overflow-hidden p-5 border-border/50 group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
              <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-info" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs text-muted-foreground">Pendentes</span>
                <span className="text-xs font-bold text-foreground ml-auto">{pendingSales.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">Confirmadas</span>
                <span className="text-xs font-bold text-foreground ml-auto">{confirmedSales.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">Canceladas</span>
                <span className="text-xs font-bold text-foreground ml-auto">{canceledSales.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs text-muted-foreground">Distratos</span>
                <span className="text-xs font-bold text-foreground ml-auto">{distratoSales.length}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SalesMetricsCards;
