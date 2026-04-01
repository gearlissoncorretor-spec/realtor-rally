import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Clock, DollarSign, ChevronDown, ChevronUp, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrokerAlert {
  id: string;
  name: string;
}

interface ConsolidatedAlertsProps {
  brokersWithoutActivity: BrokerAlert[];
  brokersWithoutSales: { id: string; name: string; negotiations: number }[];
  inactiveBrokers: { id: string; name: string; daysSinceLastSale: number | null }[];
}

const ConsolidatedAlerts = ({
  brokersWithoutActivity,
  brokersWithoutSales,
  inactiveBrokers,
}: ConsolidatedAlertsProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const totalAlerts =
    brokersWithoutActivity.length + brokersWithoutSales.length + inactiveBrokers.length;

  if (totalAlerts === 0 || dismissed) return null;

  const alertSections = [
    {
      items: brokersWithoutActivity,
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      borderColor: 'border-destructive/20',
      bgColor: 'bg-destructive/5',
      badgeClass: 'border-destructive/30 text-destructive bg-destructive/10',
      title: 'Sem atividade',
      renderLabel: (b: BrokerAlert) => `${b.name.split(' ')[0]} — 0 vendas, 0 negociações`,
    },
    {
      items: brokersWithoutSales,
      icon: DollarSign,
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
      bgColor: 'bg-warning/5',
      badgeClass: 'border-warning/30 text-warning bg-warning/10',
      title: 'Sem vendas no mês',
      renderLabel: (b: { name: string; negotiations: number }) =>
        `${b.name.split(' ')[0]} — ${b.negotiations} negociação(ões)`,
    },
    {
      items: inactiveBrokers,
      icon: Clock,
      iconColor: 'text-orange-500',
      borderColor: 'border-orange-500/20',
      bgColor: 'bg-orange-500/5',
      badgeClass: 'border-orange-500/30 text-orange-500 bg-orange-500/10',
      title: 'Inativos 5+ dias',
      renderLabel: (b: { name: string; daysSinceLastSale: number | null }) =>
        `${b.name.split(' ')[0]} — ${b.daysSinceLastSale} dias sem venda`,
    },
  ].filter((s) => s.items.length > 0);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="rounded-xl border border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent p-4 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Fechar alertas"
        >
          <X className="w-4 h-4" />
        </button>

        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Alertas da Equipe
              </h2>
              <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10 text-[10px] h-5">
                {totalAlerts} corretor{totalAlerts > 1 ? 'es' : ''}
              </Badge>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Preview when collapsed */}
        {!expanded && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {alertSections.map((section) => (
              <Badge key={section.title} variant="outline" className={cn('text-[10px] py-0.5', section.badgeClass)}>
                <section.icon className={cn('w-3 h-3 mr-1', section.iconColor)} />
                {section.items.length} {section.title.toLowerCase()}
              </Badge>
            ))}
          </div>
        )}

        <CollapsibleContent className="space-y-3 mt-4 animate-fade-in">
          {alertSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <div className="flex items-center gap-2">
                <section.icon className={cn('w-3.5 h-3.5', section.iconColor)} />
                <span className="text-xs font-medium text-foreground">{section.title}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {section.items.map((b: any) => (
                  <Badge key={b.id} variant="outline" className={cn('py-1 px-2.5 text-xs', section.badgeClass)}>
                    {section.renderLabel(b)}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default ConsolidatedAlerts;
