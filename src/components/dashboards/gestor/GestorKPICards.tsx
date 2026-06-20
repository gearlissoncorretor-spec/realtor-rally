import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Flame, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting';
import { cn } from '@/lib/utils';
import AutoFitText from '@/components/AutoFitText';

interface KPICardData {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tone: 'success' | 'primary' | 'warning' | 'info';
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

const TONE: Record<KPICardData['tone'], { icon: string; ring: string }> = {
  success: { icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', ring: 'border-emerald-100 dark:border-emerald-500/20' },
  primary: { icon: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', ring: 'border-blue-100 dark:border-blue-500/20' },
  warning: { icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', ring: 'border-amber-100 dark:border-amber-500/20' },
  info: { icon: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10', ring: 'border-sky-100 dark:border-sky-500/20' },
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
      label: 'VGV do Mês',
      value: formatCurrency(monthVGV),
      sub: `${monthSalesCount} ${monthSalesCount === 1 ? 'venda' : 'vendas'}`,
      icon: DollarSign,
      tone: 'success',
    },
    {
      label: 'Corretores Ativos',
      value: activeBrokersCount.toString(),
      sub: `de ${totalBrokersCount} na equipe`,
      icon: Users,
      tone: 'primary',
    },
    {
      label: 'Negociações Ativas',
      value: activeNegotiationsCount.toString(),
      sub: `${hotNegotiationsCount} quentes`,
      icon: Flame,
      tone: 'warning',
    },
    {
      label: 'Follow-ups',
      value: pendingFollowUpsCount.toString(),
      sub: `${totalFollowUpsCount} total`,
      icon: RotateCcw,
      tone: 'info',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {kpiCards.map((card, idx) => {
        const tone = TONE[card.tone];
        return (
          <motion.div
            key={card.label}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={idx}
            className={cn(
              'group relative overflow-hidden rounded-[20px] border bg-card p-5 min-h-[120px] flex flex-col justify-between',
              'shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]',
              tone.ring
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {card.label}
              </p>
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', tone.icon)}>
                <card.icon className="w-[18px] h-[18px]" />
              </div>
            </div>

            <div className="mt-3 min-w-0">
              <AutoFitText
                max={38}
                min={20}
                className="font-display font-bold text-foreground tracking-tight tabular-nums"
              >
                {card.value}
              </AutoFitText>
              <p className="mt-1 text-xs text-muted-foreground truncate">{card.sub}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default GestorKPICards;
