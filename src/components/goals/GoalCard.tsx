import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle, Award, Flame } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  canEdit: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick, canEdit }) => {
  const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
  const isOverdue = new Date(goal.end_date) < new Date() && goal.status === 'active';
  const daysLeft = Math.ceil(
    (new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const isNearlyComplete = progress >= 90;
  const isHalfway = progress >= 50 && progress < 90;
  const isBehind = progress < 50;

  const getStatusIcon = () => {
    switch (goal.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'paused':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (goal.status) {
      case 'completed':
        return 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30';
      case 'paused':
        return 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30';
      case 'cancelled':
        return 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30';
      default:
        if (isOverdue) return 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30';
        if (isNearlyComplete) return 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30';
        if (isHalfway) return 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30';
        return 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30';
    }
  };
  
  const getProgressBadge = () => {
    if (goal.status === 'completed') return { icon: Award, text: 'Concluída', color: 'bg-green-500/10 text-green-700 border-green-500/20' };
    if (isNearlyComplete) return { icon: Award, text: 'Quase lá!', color: 'bg-green-500/10 text-green-700 border-green-500/20' };
    if (isHalfway) return { icon: Flame, text: 'Progredindo', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' };
    return { icon: Target, text: 'Em andamento', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
  };
  
  const progressBadge = getProgressBadge();

  const formatValue = (value: number) => {
    switch (goal.target_type) {
      case 'revenue':
      case 'vgv':
      case 'commission':
        return formatCurrency(value);
      case 'sales_count':
        return formatNumber(value);
      default:
        return value.toString();
    }
  };

  const getTypeLabel = () => {
    switch (goal.target_type) {
      case 'sales_count':
        return 'Vendas';
      case 'revenue':
        return 'Receita';
      case 'vgv':
        return 'VGV';
      case 'commission':
        return 'Comissão';
      default:
        return goal.target_type;
    }
  };

  const getPeriodLabel = () => {
    switch (goal.period_type) {
      case 'monthly':
        return 'Mensal';
      case 'quarterly':
        return 'Trimestral';
      case 'yearly':
        return 'Anual';
      default:
        return goal.period_type;
    }
  };

  return (
    <Card 
      className={cn(
        "bg-gradient-to-br from-card via-card to-accent/5 border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:-translate-y-1",
        isNearlyComplete && "hover:border-green-500/50",
        isHalfway && "hover:border-yellow-500/50",
        isBehind && "hover:border-blue-500/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110", getStatusColor())}>
              {getStatusIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {goal.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-xs font-semibold">
                  {getTypeLabel()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getPeriodLabel()}
                </Badge>
                <Badge className={cn("text-xs font-medium border", progressBadge.color)}>
                  <progressBadge.icon className="w-3 h-3 mr-1" />
                  {progressBadge.text}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Progresso</span>
            <span className={cn(
              "text-lg font-bold transition-colors",
              isNearlyComplete && "text-green-600",
              isHalfway && "text-yellow-600",
              isBehind && "text-red-600"
            )}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <Progress value={progress} className="h-3 shadow-md" />
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Realizado</p>
              <p className="text-base font-bold text-foreground">
                {formatValue(goal.current_value)}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta</p>
              <p className="text-base font-bold text-foreground">
                {formatValue(goal.target_value)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/30">
            <TrendingUp className={cn(
              "w-4 h-4",
              isNearlyComplete && "text-green-600",
              isHalfway && "text-yellow-600",
              isBehind && "text-red-600"
            )} />
            <span className="text-sm font-semibold text-muted-foreground">
              {goal.target_value - goal.current_value > 0 
                ? `Faltam ${formatValue(goal.target_value - goal.current_value)}` 
                : 'Meta atingida!'}
            </span>
          </div>
        </div>

        {/* Date Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {format(new Date(goal.start_date), 'dd/MM', { locale: ptBR })} - {format(new Date(goal.end_date), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          {goal.status === 'active' && (
            <Badge 
              variant={isOverdue ? 'destructive' : daysLeft <= 7 ? 'default' : 'secondary'}
              className={cn(
                "text-xs font-bold",
                !isOverdue && daysLeft <= 7 && "bg-yellow-500 hover:bg-yellow-600 text-white",
                !isOverdue && daysLeft > 7 && "bg-green-500 hover:bg-green-600 text-white"
              )}
            >
              {isOverdue ? '⚠️ Vencida' : daysLeft <= 7 ? `🔥 ${daysLeft}d` : `✓ ${daysLeft}d`}
            </Badge>
          )}
        </div>

        {/* Description */}
        {goal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {goal.description}
          </p>
        )}

        {/* Tasks Summary */}
        {goal.tasks && goal.tasks.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {goal.tasks.filter(t => t.status === 'completed').length} de {goal.tasks.length} tarefas concluídas
            </span>
            <div className="flex gap-1">
              {goal.tasks.filter(t => t.priority === 'urgent').length > 0 && (
                <Badge variant="destructive" className="text-xs px-1">
                  {goal.tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length} urgentes
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};