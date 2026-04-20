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
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3">
    <ResponsiveStatCard 
      icon={Handshake} 
      iconColor="text-primary" 
      bgColor="bg-primary/10" 
      value={stats.total} 
      label="Total Ativas" 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClickTotal}
    />
    <ResponsiveStatCard icon={Clock} iconColor="text-warning" bgColor="bg-warning/10" value={stats.emAprovacao} label="Em Aprovação" />
    <ResponsiveStatCard icon={CheckCircle2} iconColor="text-success" bgColor="bg-success/10" value={stats.clienteAprovado} label="Aprovados" sublabel="(não é venda)" />
    <ResponsiveStatCard icon={Ban} iconColor="text-destructive" bgColor="bg-destructive/10" value={stats.clienteReprovado} label="Reprovados" />
    <ResponsiveStatCard icon={XCircle} iconColor="text-muted-foreground" bgColor="bg-muted/50" value={stats.perdidas} label="Perdidas" />
    <ResponsiveStatCard icon={Star} iconColor="text-success" bgColor="bg-success/10" value={stats.vendasConvertidas} label="Vendas" sublabel="convertidas" />
    <ResponsiveStatCard icon={Percent} iconColor="text-warning" bgColor="bg-warning/10" value={`${stats.taxaConversao}%`} label="Conversão" />
    <ResponsiveStatCard icon={DollarSign} iconColor="text-success" bgColor="bg-success/10" value={formatCurrency(stats.valorTotal)} label="Valor Ativo" />
  </div>
);
