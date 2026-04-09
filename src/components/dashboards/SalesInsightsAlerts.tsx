import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, TrendingUp, Lightbulb, Phone, UserX, CalendarClock } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Broker {
  id: string;
  name: string;
  status?: string | null;
}

interface Sale {
  id: string;
  broker_id: string;
  sale_date?: string;
  created_at?: string;
}

interface FollowUp {
  id: string;
  broker_id: string;
  next_contact_date?: string | null;
  status?: string;
}

interface InsightAlert {
  type: 'warning' | 'danger' | 'info' | 'success';
  icon: React.ElementType;
  title: string;
  description: string;
}

interface SalesInsightsAlertsProps {
  brokers: Broker[];
  sales: Sale[];
  followUps?: FollowUp[];
  daysWithoutSaleThreshold?: number;
}

export const SalesInsightsAlerts = ({
  brokers,
  sales,
  followUps = [],
  daysWithoutSaleThreshold = 15,
}: SalesInsightsAlertsProps) => {
  const alerts = useMemo(() => {
    const result: InsightAlert[] = [];
    const activeBrokers = brokers.filter(b => b.status === 'ativo');
    const now = new Date();

    // Brokers without sales in X days
    const brokersWithoutSales: string[] = [];
    activeBrokers.forEach(broker => {
      const brokerSales = sales.filter(s => s.broker_id === broker.id);
      if (brokerSales.length === 0) {
        brokersWithoutSales.push(broker.name);
        return;
      }
      const lastSale = brokerSales.reduce((latest, s) => {
        const d = new Date(s.sale_date || s.created_at || 0);
        return d > latest ? d : latest;
      }, new Date(0));
      const daysSince = differenceInDays(now, lastSale);
      if (daysSince >= daysWithoutSaleThreshold) {
        brokersWithoutSales.push(`${broker.name} (${daysSince}d)`);
      }
    });

    if (brokersWithoutSales.length > 0) {
      result.push({
        type: 'danger',
        icon: UserX,
        title: `${brokersWithoutSales.length} corretor(es) sem vendas há ${daysWithoutSaleThreshold}+ dias`,
        description: brokersWithoutSales.slice(0, 5).join(', ') + (brokersWithoutSales.length > 5 ? ` e mais ${brokersWithoutSales.length - 5}` : ''),
      });
    }

    // Overdue follow-ups
    const overdueFollowUps = followUps.filter(f => {
      if (!f.next_contact_date || f.status === 'convertido' || f.status === 'perdido') return false;
      return new Date(f.next_contact_date) < now;
    });

    if (overdueFollowUps.length > 0) {
      result.push({
        type: 'warning',
        icon: CalendarClock,
        title: `${overdueFollowUps.length} follow-up(s) com contato atrasado`,
        description: 'Existem leads aguardando contato que já passaram da data prevista.',
      });
    }

    // Sales trend (last 30d vs previous 30d)
    const last30 = sales.filter(s => {
      const d = new Date(s.sale_date || s.created_at || 0);
      return differenceInDays(now, d) <= 30;
    }).length;
    const prev30 = sales.filter(s => {
      const d = new Date(s.sale_date || s.created_at || 0);
      const diff = differenceInDays(now, d);
      return diff > 30 && diff <= 60;
    }).length;

    if (prev30 > 0) {
      const change = ((last30 - prev30) / prev30) * 100;
      if (change < -20) {
        result.push({
          type: 'danger',
          icon: TrendingDown,
          title: `Vendas caíram ${Math.abs(Math.round(change))}% no último mês`,
          description: `${last30} vendas nos últimos 30 dias vs ${prev30} no período anterior.`,
        });
      } else if (change > 20) {
        result.push({
          type: 'success',
          icon: TrendingUp,
          title: `Vendas cresceram ${Math.round(change)}% no último mês`,
          description: `${last30} vendas nos últimos 30 dias vs ${prev30} no período anterior.`,
        });
      }
    }

    // Suggestion: brokers with many follow-ups but no conversions
    activeBrokers.forEach(broker => {
      const brokerFollowUps = followUps.filter(f => f.broker_id === broker.id && f.status !== 'convertido' && f.status !== 'perdido');
      if (brokerFollowUps.length >= 10) {
        result.push({
          type: 'info',
          icon: Lightbulb,
          title: `${broker.name} tem ${brokerFollowUps.length} leads ativos sem conversão`,
          description: 'Sugestão: revisar a qualificação dos leads ou agendar mentoria.',
        });
      }
    });

    return result;
  }, [brokers, sales, followUps, daysWithoutSaleThreshold]);

  if (alerts.length === 0) return null;

  const colorMap = {
    danger: 'border-destructive/30 bg-destructive/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    info: 'border-primary/30 bg-primary/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
  };

  const iconColorMap = {
    danger: 'text-destructive',
    warning: 'text-yellow-600',
    info: 'text-primary',
    success: 'text-emerald-600',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Insights & Alertas
          <Badge variant="secondary" className="ml-auto">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border",
              colorMap[alert.type]
            )}
          >
            <alert.icon className={cn("w-5 h-5 mt-0.5 shrink-0", iconColorMap[alert.type])} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
