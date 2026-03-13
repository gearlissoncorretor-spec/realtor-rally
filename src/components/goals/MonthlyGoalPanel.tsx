import { useMemo, useState, useEffect } from 'react';
import { Target, TrendingUp, PartyPopper, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatting';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MonthlyGoalPanelProps {
  targetValue: number;
  achievedValue: number;
  monthLabel?: string;
  compact?: boolean;
  showNavigate?: boolean;
}

const MonthlyGoalPanel = ({ targetValue, achievedValue, monthLabel, compact = false, showNavigate = true }: MonthlyGoalPanelProps) => {
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const remaining = Math.max(0, targetValue - achievedValue);
  const progress = targetValue > 0 ? Math.min((achievedValue / targetValue) * 100, 100) : 0;
  const isGoalMet = achievedValue >= targetValue && targetValue > 0;
  const label = monthLabel || format(new Date(), 'MMMM yyyy', { locale: ptBR });

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Show celebration when goal is met
  useEffect(() => {
    if (isGoalMet) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isGoalMet]);

  const getProgressColor = () => {
    if (progress >= 71) return 'from-emerald-500 to-emerald-400';
    if (progress >= 31) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-rose-400';
  };

  const getProgressBg = () => {
    if (progress >= 71) return 'bg-emerald-500/10';
    if (progress >= 31) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  const getAccentColor = () => {
    if (progress >= 71) return 'text-emerald-400';
    if (progress >= 31) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBorderColor = () => {
    if (isGoalMet) return 'border-emerald-500/40 shadow-emerald-500/10';
    if (progress >= 71) return 'border-emerald-500/20';
    if (progress >= 31) return 'border-amber-500/20';
    return 'border-red-500/20';
  };

  if (targetValue <= 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card/50 p-5", compact && "p-4")}>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary" /> Meta Mensal
        </h2>
        <div className="text-center space-y-3 py-4">
          <Target className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma meta definida para {label}.</p>
          {showNavigate && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-primary/30 text-primary" onClick={() => navigate('/meta-gestao')}>
              <Target className="w-3 h-3" /> Cadastrar Meta
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative rounded-xl border bg-gradient-to-br overflow-hidden transition-all duration-500",
      getBorderColor(),
      isGoalMet 
        ? "from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg" 
        : "from-card via-card/95 to-card/90",
      compact ? "p-4" : "p-5"
    )}>
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-[confetti_3s_ease-out_forwards]"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                fontSize: `${10 + Math.random() * 14}px`,
              }}
            >
              {['🎉', '✨', '🏆', '⭐', '🎊', '💰'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn(
          "font-semibold text-foreground uppercase tracking-wider flex items-center gap-2",
          compact ? "text-xs" : "text-sm"
        )}>
          {isGoalMet ? (
            <PartyPopper className="w-4 h-4 text-emerald-400" />
          ) : (
            <Target className="w-4 h-4 text-primary" />
          )}
          🎯 Meta Mensal
        </h2>
        {isGoalMet && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> META ATINGIDA!
          </span>
        )}
      </div>

      {/* Target value */}
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground mb-1 capitalize">{label}</p>
        <p className={cn("font-bold text-foreground", compact ? "text-2xl" : "text-3xl")}>
          {formatCurrency(targetValue)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className={cn("w-full rounded-full overflow-hidden", compact ? "h-4" : "h-5", getProgressBg())}>
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out relative",
              getProgressColor(),
              isGoalMet && "animate-pulse"
            )}
            style={{ width: `${animatedProgress}%` }}
          >
            {animatedProgress > 15 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-sm">
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </div>
        {animatedProgress <= 15 && (
          <span className={cn("text-[10px] font-bold ml-2", getAccentColor())}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className={cn("rounded-lg p-3 text-center", getProgressBg())}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">💰 Atingido</p>
          <p className={cn("font-bold text-foreground", compact ? "text-sm" : "text-base")}>
            {formatCurrency(achievedValue)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">📉 Falta</p>
          <p className={cn("font-bold", compact ? "text-sm" : "text-base", isGoalMet ? "text-emerald-400" : "text-foreground")}>
            {isGoalMet ? '🎉 R$ 0,00' : formatCurrency(remaining)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">📊 Progresso</p>
          <p className={cn("font-bold", compact ? "text-sm" : "text-base", getAccentColor())}>
            {progress.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Celebration message */}
      {isGoalMet && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in">
          <p className="text-sm font-bold text-emerald-400">
            🎉 Meta mensal atingida! Parabéns equipe! 🎉
          </p>
          <p className="text-xs text-emerald-400/70 mt-1">
            Superado em {formatCurrency(achievedValue - targetValue)}
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyGoalPanel;
