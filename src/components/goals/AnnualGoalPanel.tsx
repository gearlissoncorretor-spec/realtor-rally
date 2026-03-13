import { TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatting';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface AnnualGoalPanelProps {
  targetValue: number;
  achievedValue: number;
  year?: number;
  compact?: boolean;
  showNavigate?: boolean;
}

const AnnualGoalPanel = ({ targetValue, achievedValue, year, compact = false, showNavigate = true }: AnnualGoalPanelProps) => {
  const navigate = useNavigate();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const remaining = Math.max(0, targetValue - achievedValue);
  const progress = targetValue > 0 ? Math.min((achievedValue / targetValue) * 100, 100) : 0;
  const isGoalMet = achievedValue >= targetValue && targetValue > 0;
  const currentYear = year || new Date().getFullYear();

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const getProgressColor = () => {
    if (progress >= 71) return 'from-emerald-500 to-emerald-400';
    if (progress >= 31) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-rose-400';
  };

  const getAccentColor = () => {
    if (progress >= 71) return 'text-emerald-400';
    if (progress >= 31) return 'text-amber-400';
    return 'text-red-400';
  };

  if (targetValue <= 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card/50 p-5", compact && "p-4")}>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Meta Anual
        </h2>
        <div className="text-center space-y-3 py-4">
          <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma meta anual definida para {currentYear}.</p>
          {showNavigate && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-emerald-500/30 text-emerald-400" onClick={() => navigate('/meta-gestao')}>
              <TrendingUp className="w-3 h-3" /> Cadastrar Meta Anual
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative rounded-xl border overflow-hidden transition-all duration-500",
      isGoalMet 
        ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg shadow-emerald-500/10" 
        : "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent",
      compact ? "p-4" : "p-5"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn(
          "font-semibold text-foreground uppercase tracking-wider flex items-center gap-2",
          compact ? "text-xs" : "text-sm"
        )}>
          <TrendingUp className="w-4 h-4 text-emerald-400" /> 📊 Meta Anual — {currentYear}
        </h2>
        {isGoalMet && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> ATINGIDA!
          </span>
        )}
      </div>

      {/* Target value */}
      <div className="text-center mb-4">
        <p className={cn("font-bold text-foreground", compact ? "text-2xl" : "text-3xl")}>
          {formatCurrency(targetValue)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className={cn("w-full rounded-full overflow-hidden bg-emerald-500/10", compact ? "h-4" : "h-5")}>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Vendido</p>
          <p className={cn("font-bold text-foreground", compact ? "text-sm" : "text-base")}>
            {formatCurrency(achievedValue)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Falta</p>
          <p className={cn("font-bold", compact ? "text-sm" : "text-base", isGoalMet ? "text-emerald-400" : "text-foreground")}>
            {isGoalMet ? '✅ Concluída' : formatCurrency(remaining)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Progresso</p>
          <p className={cn("font-bold", compact ? "text-sm" : "text-base", getAccentColor())}>
            {progress.toFixed(1)}%
          </p>
        </div>
      </div>

      {isGoalMet && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in">
          <p className="text-sm font-bold text-emerald-400">
            🎉 Meta anual atingida! Parabéns equipe! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default AnnualGoalPanel;
