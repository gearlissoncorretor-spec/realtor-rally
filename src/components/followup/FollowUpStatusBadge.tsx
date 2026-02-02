import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FollowUpStatusBadgeProps {
  status: string;
  label?: string;
  color?: string;
  icon?: string | null;
  className?: string;
}

// Default status configs
const DEFAULT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  novo_lead: { label: 'Novo Lead', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '🆕' },
  primeiro_contato: { label: 'Primeiro Contato', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: '📞' },
  aguardando_retorno: { label: 'Aguardando Retorno', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: '⏳' },
  cliente_frio: { label: 'Cliente Frio', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: '❄️' },
  cliente_quente: { label: 'Cliente Quente', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: '🔥' },
  agendado_atendimento: { label: 'Agendado Atendimento', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: '📅' },
};

export function FollowUpStatusBadge({ 
  status, 
  label: providedLabel, 
  color: providedColor,
  icon: providedIcon,
  className 
}: FollowUpStatusBadgeProps) {
  const config = DEFAULT_STATUS_CONFIG[status] || { 
    label: status, 
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: '📋'
  };

  const displayLabel = providedLabel || config.label;
  const displayColor = providedColor || config.color;
  const displayIcon = providedIcon !== undefined ? providedIcon : config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border text-xs whitespace-nowrap",
        displayColor,
        className
      )}
    >
      {displayIcon && <span className="mr-1">{displayIcon}</span>}
      {displayLabel}
    </Badge>
  );
}
