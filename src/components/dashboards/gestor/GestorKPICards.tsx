import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Flame, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting';
import { cn } from '@/lib/utils';

interface KPICardData {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  gradient: string;
  border: string;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

interface GestorKPICardsProps {
  monthSalesCount: number;
  monthVGV: number;
  activeBrokersCount: number;
  totalBrokersCount: number;
  activeNegotiationsCount: number;
  hotNegotiationsCount: number;
  pendingFollowUpsCount: number;
  totalFollowUpsCount: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'neutral' }) => {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-success" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-destructive" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const GestorKPICards: React.FC<GestorKPICardsProps> = ({
  monthSalesCount,
  monthVGV,
  activeBrokersCount,
  totalBrokersCount,
  activeNegotiationsCount,
  hotNegotiationsCount,
  pendingFollowUpsCount,
  totalFollowUpsCount,
}) => {
  const kpiCards: KPICardData[] = [
    {
      label: 'Vendas do Mês',
      value: monthSalesCount.toString(),
      sub: `VGV: ${formatCurrency(monthVGV)}`,
      icon: DollarSign,
      gradient: 'from-success/15 to-success/5',
      border: 'border-success/30',
      iconColor: 'text-success',
    },
    {
      label: 'Corretores Ativos',
      value: activeBrokersCount.toString(),
      sub: `de ${totalBrokersCount} na equipe`,
      icon: Users,
      gradient: 'from-primary/15 to-primary/5',
      border: 'border-primary/30',
      iconColor: 'text-primary',
    },
    {
      label: 'Negociações Ativas',
      value: activeNegotiationsCount.toString(),
      sub: `${hotNegotiationsCount} quentes`,
      icon: Flame,
      gradient: 'from-warning/15 to-warning/5',
      border: 'border-warning/30',
      iconColor: 'text-warning',
    },
    {
      label: 'Follow-ups',
      value: pendingFollowUpsCount.toString(),
      sub: `${totalFollowUpsCount} total`,
      icon: RotateCcw,
      gradient: 'from-info/15 to-info/5',
      border: 'border-info/30',
      iconColor: 'text-info',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      {kpiCards.map((card, idx) => (
        <motion.div
          key={card.label}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={idx}
          className={cn(
            "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-3.5 lg:p-4 transition-all hover:scale-[1.02] hover:shadow-lg",
            card.border,
            card.gradient
          )}
        >
          {/* Decorative shimmer */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-background/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -skew-x-12 translate-x-full group-hover:translate-x-0" />

          <div className="relative flex items-start justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] lg:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                {card.label}
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground tabular-nums leading-none">
                {card.value}
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground truncate">
                {card.sub}
              </p>
            </div>
            <div className={cn(
              "h-10 w-10 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-sm",
              card.iconColor
            )}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default GestorKPICards;
