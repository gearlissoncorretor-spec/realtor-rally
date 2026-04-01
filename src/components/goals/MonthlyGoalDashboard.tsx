import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatting';
import { format, getDaysInMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PartyPopper,
  Sparkles,
} from 'lucide-react';

interface MonthlyGoalDashboardProps {
  targetValue: number;
  achievedValue: number;
  monthDate?: Date;
}

const MonthlyGoalDashboard = ({ targetValue, achievedValue, monthDate }: MonthlyGoalDashboardProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const now = monthDate || new Date();
  const totalDays = getDaysInMonth(now);
  const daysPassed = getDate(now);
  const daysRemaining = totalDays - daysPassed;
  const monthLabel = format(now, 'MMMM yyyy', { locale: ptBR });

  const remaining = Math.max(0, targetValue - achievedValue);
  const progress = targetValue > 0 ? Math.min((achievedValue / targetValue) * 100, 100) : 0;
  const isGoalMet = achievedValue >= targetValue && targetValue > 0;

  // Probability calculation
  const probability = useMemo(() => {
    if (targetValue <= 0 || daysPassed === 0) return 0;
    const dailyAvg = achievedValue / daysPassed;
    const projected = dailyAvg * totalDays;
    return Math.min(100, Math.round((projected / targetValue) * 100));
  }, [targetValue, achievedValue, daysPassed, totalDays]);

  const getProbabilityColor = () => {
    if (probability >= 71) return 'text-success';
    if (probability >= 41) return 'text-warning';
    return 'text-destructive';
  };

  const getProbabilityBg = () => {
    if (probability >= 71) return 'bg-success/10 border-success/20';
    if (probability >= 41) return 'bg-warning/10 border-warning/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  const getProbabilityIcon = () => {
    if (probability >= 71) return <Flame className="w-4 h-4 text-success" />;
    if (probability >= 41) return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  const getProgressColor = () => {
    if (progress >= 71) return 'text-success';
    if (progress >= 31) return 'text-warning';
    return 'text-destructive';
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 150);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    if (isGoalMet) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isGoalMet]);

  if (targetValue <= 0) {
    return (
      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-primary" />
            Meta Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma meta mensal definida para <span className="capitalize">{monthLabel}</span>.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-border/50 bg-card shadow-sm relative overflow-hidden transition-all duration-500",
      isGoalMet && "ring-1 ring-success/30 shadow-success/10"
    )}>
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
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

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {isGoalMet ? (
              <PartyPopper className="w-5 h-5 text-success" />
            ) : (
              <Calendar className="w-5 h-5 text-primary" />
            )}
            Meta Mensal
          </CardTitle>
          {isGoalMet && (
            <span className="flex items-center gap-1 text-xs font-bold text-success animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> META ATINGIDA!
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground capitalize">{monthLabel}</p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Main KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meta</p>
            <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">{formatCurrency(targetValue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-info/5 border border-info/10 text-center">
            <DollarSign className="w-4 h-4 mx-auto mb-1 text-info" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Realizado</p>
            <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">{formatCurrency(achievedValue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Falta</p>
            <p className={cn("text-sm sm:text-base font-bold mt-0.5", isGoalMet ? "text-success" : "text-foreground")}>
              {isGoalMet ? 'R$ 0,00' : formatCurrency(remaining)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
            <CheckCircle2 className={cn("w-4 h-4 mx-auto mb-1", getProgressColor())} />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atingimento</p>
            <p className={cn("text-sm sm:text-base font-bold mt-0.5", getProgressColor())}>
              {progress.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Progresso da Meta</span>
            <Badge variant="outline" className={cn(
              "text-xs",
              progress >= 90 ? "border-success/30 text-success bg-success/10" :
              progress >= 50 ? "border-warning/30 text-warning bg-warning/10" :
              "border-destructive/30 text-destructive bg-destructive/10"
            )}>
              {progress >= 90 ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
               progress >= 50 ? <AlertTriangle className="w-3 h-3 mr-1" /> :
               <Clock className="w-3 h-3 mr-1" />}
              {progress >= 90 ? 'Excelente' : progress >= 50 ? 'Atenção' : 'Acelerar'}
            </Badge>
          </div>
          <div className="relative">
            <div className={cn("w-full rounded-full overflow-hidden h-5",
              progress >= 71 ? "bg-success/10" : progress >= 31 ? "bg-warning/10" : "bg-destructive/10"
            )}>
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out relative",
                  progress >= 71 ? "from-emerald-500 to-emerald-400" :
                  progress >= 31 ? "from-amber-500 to-yellow-400" :
                  "from-red-500 to-rose-400",
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
        </div>

        {/* Days + Probability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Days of month */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Dias do Mês</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalDays}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{daysPassed}</p>
                <p className="text-[10px] text-muted-foreground">Passados</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-warning">{daysRemaining}</p>
                <p className="text-[10px] text-muted-foreground">Restantes</p>
              </div>
            </div>
            <Progress value={(daysPassed / totalDays) * 100} className="h-1.5" />
          </div>

          {/* Probability */}
          <div className={cn("p-4 rounded-xl border space-y-3", getProbabilityBg())}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getProbabilityIcon()}
                <span className="text-sm font-medium text-foreground">📈 Probabilidade</span>
              </div>
            </div>
            <div className="text-center">
              <p className={cn("text-3xl font-bold", getProbabilityColor())}>{probability}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">de atingir a meta</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Média/dia: <strong className="text-foreground">{daysPassed > 0 ? formatCurrency(achievedValue / daysPassed) : 'R$ 0,00'}</strong></p>
              <p>Projeção: <strong className="text-foreground">{daysPassed > 0 ? formatCurrency((achievedValue / daysPassed) * totalDays) : 'R$ 0,00'}</strong></p>
            </div>
          </div>
        </div>

        {/* Celebration message */}
        {isGoalMet && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center animate-fade-in">
            <p className="text-sm font-bold text-success">
              🎉 META MENSAL ATINGIDA! Parabéns equipe! 🎉
            </p>
            <p className="text-xs text-success/70 mt-1">
              Superado em {formatCurrency(achievedValue - targetValue)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyGoalDashboard;
