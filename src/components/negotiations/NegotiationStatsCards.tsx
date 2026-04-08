import { Card, CardContent } from "@/components/ui/card";
import { Handshake, Clock, CheckCircle2, Ban, XCircle, Star, Percent, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatting";
import { ResponsiveStatCard } from "./ResponsiveStatCard";

interface NegotiationStats {
  total: number;
  emContato: number;
  emAprovacao: number;
  clienteAprovado: number;
  clienteReprovado: number;
  valorTotal: number;
  perdidas: number;
  valorPerdido: number;
  taxaConversao: string;
  vendasConvertidas: number;
}

interface NegotiationStatsCardsProps {
  stats: NegotiationStats;
  onClickTotal?: () => void;
}

export const NegotiationStatsCards = ({ stats, onClickTotal }: NegotiationStatsCardsProps) => (
  <>
    {/* Hero Card */}
    <Card 
      className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 cursor-pointer hover:shadow-lg transition-all duration-300 group"
      onClick={onClickTotal}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-info opacity-80" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <Handshake className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                Total de Negociações Ativas
              </p>
              <p className="text-3xl lg:text-4xl font-black text-foreground tabular-nums">
                {stats.total}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-muted-foreground">Valor em negociação</p>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(stats.valorTotal)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3">
      <ResponsiveStatCard icon={Handshake} iconColor="text-primary" bgColor="bg-primary/10" value={stats.total} label="Total Ativas" />
      <ResponsiveStatCard icon={Clock} iconColor="text-warning" bgColor="bg-warning/10" value={stats.emAprovacao} label="Em Aprovação" />
      <ResponsiveStatCard icon={CheckCircle2} iconColor="text-success" bgColor="bg-success/10" value={stats.clienteAprovado} label="Aprovados" sublabel="(não é venda)" />
      <ResponsiveStatCard icon={Ban} iconColor="text-destructive" bgColor="bg-destructive/10" value={stats.clienteReprovado} label="Reprovados" />
      <ResponsiveStatCard icon={XCircle} iconColor="text-muted-foreground" bgColor="bg-muted/50" value={stats.perdidas} label="Perdidas" />
      <ResponsiveStatCard icon={Star} iconColor="text-success" bgColor="bg-success/10" value={stats.vendasConvertidas} label="Vendas" sublabel="convertidas" />
      <ResponsiveStatCard icon={Percent} iconColor="text-warning" bgColor="bg-warning/10" value={`${stats.taxaConversao}%`} label="Conversão" />
      <ResponsiveStatCard icon={DollarSign} iconColor="text-success" bgColor="bg-success/10" value={formatCurrency(stats.valorTotal)} label="Valor Ativo" />
    </div>
  </>
);
