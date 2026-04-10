import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trophy, Award, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BrokerPerformance {
  id: string;
  name: string;
  salesCount: number;
  vgv: number;
  negotiations: number;
  followUps: number;
  avatar_url: string | null;
  daysSinceLastSale: number | null;
}

interface GestorTeamRankingProps {
  brokerPerformance: BrokerPerformance[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

const podiumGradients = [
  'from-amber-400 to-yellow-600',
  'from-slate-300 to-slate-500',
  'from-orange-400 to-amber-700',
];

const podiumRings = [
  'ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20',
  'ring-2 ring-slate-300/50 shadow-md',
  'ring-2 ring-orange-400/50 shadow-md',
];

const podiumBg = [
  'bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20',
  'bg-gradient-to-br from-slate-400/10 to-slate-300/5 border-slate-400/20',
  'bg-gradient-to-br from-orange-400/10 to-amber-400/5 border-orange-400/20',
];

const GestorTeamRanking: React.FC<GestorTeamRankingProps> = ({ brokerPerformance }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const top3 = brokerPerformance.slice(0, 3);
  const rest = brokerPerformance.slice(3);
  const maxVGV = brokerPerformance[0]?.vgv || 1;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0]?.substring(0, 2) || '?';
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={0}
      className="rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/5 via-transparent to-transparent overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-5 py-3.5 border-b border-border/40 bg-muted/20">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4.5 h-4.5 text-warning" />
          Ranking da Equipe
        </h2>
        <Button variant="ghost" size="sm" className="text-xs text-warning hover:text-warning" onClick={() => navigate('/ranking')}>
          Ver completo <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {brokerPerformance.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Nenhum corretor na equipe</p>
        </div>
      ) : (
        <div className="p-4 lg:p-5">
          {/* Podium-style Top 3 */}
          <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4">
            {top3.map((broker, idx) => {
              const MedalIcon = idx === 0 ? Trophy : Award;
              return (
                <motion.div
                  key={broker.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2, duration: 0.4 }}
                  className={cn(
                    "relative flex flex-col items-center text-center p-3 lg:p-4 rounded-xl border transition-all hover:scale-[1.03]",
                    podiumBg[idx],
                    idx === 0 && "lg:order-2 order-1"
                  )}
                >
                  {/* Medal badge */}
                  <div className={cn(
                    "absolute -top-2 -right-1 w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center shadow-md z-10",
                    podiumGradients[idx]
                  )}>
                    <span className="text-[10px] font-bold text-white">{idx + 1}º</span>
                  </div>

                  {/* Avatar */}
                  <div className={cn("relative mb-2", idx === 0 && "lg:mb-3")}>
                    {broker.avatar_url ? (
                      <img
                        src={broker.avatar_url}
                        alt={broker.name}
                        className={cn(
                          "rounded-full object-cover",
                          podiumRings[idx],
                          idx === 0 ? "w-14 h-14 lg:w-16 lg:h-16" : "w-11 h-11 lg:w-13 lg:h-13"
                        )}
                      />
                    ) : (
                      <div className={cn(
                        "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white",
                        podiumGradients[idx],
                        podiumRings[idx],
                        idx === 0 ? "w-14 h-14 lg:w-16 lg:h-16 text-lg" : "w-11 h-11 lg:w-13 lg:h-13 text-sm"
                      )}>
                        {getInitials(broker.name)}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p className={cn(
                    "font-semibold text-foreground truncate w-full",
                    idx === 0 ? "text-sm lg:text-base" : "text-xs lg:text-sm"
                  )}>
                    {broker.name.split(' ')[0]}
                  </p>

                  {/* Stats */}
                  <p className={cn(
                    "font-bold tabular-nums mt-1",
                    idx === 0 ? "text-base lg:text-lg text-warning" : "text-sm text-foreground"
                  )}>
                    {formatCurrency(broker.vgv)}
                  </p>
                  <Badge variant="secondary" className="text-[9px] mt-1 px-1.5 py-0">
                    {broker.salesCount} venda{broker.salesCount !== 1 ? 's' : ''}
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          {/* 4+ List */}
          {rest.length > 0 && (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <div className="border-t border-border/30 pt-3">
                <CollapsibleContent className="space-y-1.5 animate-fade-in">
                  {rest.map((broker, idx) => {
                    const position = idx + 4;
                    const barWidth = Math.max((broker.vgv / maxVGV) * 100, 5);
                    return (
                      <div key={broker.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-all">
                        <span className="text-sm w-7 text-center shrink-0 text-muted-foreground tabular-nums font-medium">
                          {position}º
                        </span>
                        {broker.avatar_url ? (
                          <img src={broker.avatar_url} alt={broker.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {getInitials(broker.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground truncate">{broker.name}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span>{broker.salesCount}v</span>
                              <span className="font-semibold text-foreground tabular-nums">{formatCurrency(broker.vgv)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-primary/40 transition-all duration-700" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground">
                    {expanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                    {expanded ? 'Ver menos' : `Ver todos (+${rest.length})`}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </Collapsible>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default GestorTeamRanking;
