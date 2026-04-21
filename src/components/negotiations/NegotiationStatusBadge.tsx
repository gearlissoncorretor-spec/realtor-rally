import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NegotiationStatusBadgeProps {
  status: string;
  label?: string;
  color?: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  stage?: {
    id: string;
    title: string;
    color: string;
  };
}

// Fallback colors for statuses not found in the custom list
const FALLBACK_COLORS: Record<string, string> = {
  em_contato: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  em_aprovacao: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  cliente_reprovado: 'bg-red-500/10 text-red-500 border-red-500/20',
  cliente_aprovado: 'bg-green-500/10 text-green-500 border-green-500/20',
  proposta_enviada: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  em_analise: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  aprovado: 'bg-green-500/10 text-green-500 border-green-500/20',
  perdida: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  venda_concluida: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

const FALLBACK_LABELS: Record<string, string> = {
  em_contato: 'Em Contato',
  em_aprovacao: 'Em Aprovação',
  cliente_reprovado: 'Cliente Reprovado',
  cliente_aprovado: 'Cliente Aprovado',
  proposta_enviada: 'Proposta Enviada',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  perdida: 'Perdida',
  venda_concluida: 'Venda Concluída',
};

const FALLBACK_ICONS: Record<string, string> = {
  em_contato: '📞',
  em_aprovacao: '🟡',
  cliente_reprovado: '🔴',
  cliente_aprovado: '🟢',
  proposta_enviada: '📨',
  em_analise: '🔍',
  aprovado: '✅',
  perdida: '❌',
  venda_concluida: '💰',
};

export function NegotiationStatusBadge({ 
  status, 
  label, 
  color, 
  icon,
  size = 'md',
  showIcon = true,
  stage,
}: NegotiationStatusBadgeProps) {
  const displayLabel = stage?.title || label || FALLBACK_LABELS[status] || status;
  const displayColor = stage ? `border-transparent` : (color || FALLBACK_COLORS[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20');
  const displayIcon = icon || FALLBACK_ICONS[status];
  
  const customStyles = stage ? {
    backgroundColor: `${stage.color}15`, // 15 is ~8% opacity in hex
    color: stage.color,
    borderColor: `${stage.color}30`
  } : {};
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        displayColor,
        sizeClasses[size],
        "font-medium whitespace-nowrap"
      )}
      style={customStyles}
    >
      {showIcon && displayIcon && (
        <span className="mr-1">{displayIcon}</span>
      )}
      {displayLabel}
    </Badge>
  );
}
