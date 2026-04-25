import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  novo: { label: 'Novo', className: 'bg-primary/15 text-primary border-primary/30' },
  atendimento: { label: 'Em Atendimento', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400' },
  convertido: { label: 'Convertido', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' },
  perdido: { label: 'Perdido', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export const LeadStatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={cn('font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  );
};

export const LEAD_STATUSES = Object.keys(STATUS_CONFIG);
