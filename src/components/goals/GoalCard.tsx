import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  canEdit: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick, canEdit }) => {
  const progress = (goal.current_value / goal.target_value) * 100;
  const isOverdue = new Date(goal.end_date) < new Date() && goal.status === 'active';
  const daysLeft = Math.ceil(
    (new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

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
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return isOverdue ? 'bg-red-500' : 'bg-blue-500';
    }
  };

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
      className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {goal.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {getTypeLabel()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getPeriodLabel()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatValue(goal.current_value)} de {formatValue(goal.target_value)}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>{Math.abs(goal.target_value - goal.current_value) > 0 ? formatValue(goal.target_value - goal.current_value) : '0'} restante</span>
            </div>
          </div>
        </div>

        {/* Date Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(goal.start_date), 'dd/MM', { locale: ptBR })} - {format(new Date(goal.end_date), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          {goal.status === 'active' && (
            <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : daysLeft <= 7 ? 'text-yellow-500' : 'text-green-500'}`}>
              {isOverdue ? 'Vencida' : `${daysLeft} dias restantes`}
            </span>
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