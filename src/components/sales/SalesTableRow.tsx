import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Edit, 
  MoreVertical,
  Trash2,
  Copy,
  Download
} from "lucide-react";
import { formatCurrency } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import type { Sale } from "@/contexts/DataContext";
import type { Database } from "@/integrations/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Broker = Database['public']['Tables']['brokers']['Row'];

interface SalesTableRowProps {
  sale: Sale;
  broker?: Broker;
  onView: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'confirmada':
      return {
        label: 'Confirmada',
        className: 'bg-success/20 text-success border-success/30',
        tooltip: 'Venda confirmada e finalizada',
      };
    case 'pendente':
      return {
        label: 'Pendente',
        className: 'bg-warning/20 text-warning border-warning/30',
        tooltip: 'Aguardando confirmação ou documentação',
      };
    case 'cancelada':
      return {
        label: 'Cancelada',
        className: 'bg-destructive/20 text-destructive border-destructive/30',
        tooltip: 'Venda cancelada',
      };
    case 'distrato':
      return {
        label: 'Distrato',
        className: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
        tooltip: 'Contrato rescindido após confirmação',
      };
    default:
      return {
        label: status,
        className: 'bg-muted text-muted-foreground',
        tooltip: '',
      };
  }
};

export const SalesTableRow = ({ sale, broker, onView, onEdit, onDelete }: SalesTableRowProps) => {
  const statusConfig = getStatusConfig(sale.status || 'pendente');
  const isConfirmed = sale.status === 'confirmada';
  const isCanceledOrDistrato = sale.status === 'cancelada' || sale.status === 'distrato';

  return (
    <tr className={cn(
      "border-b border-border/50 hover:bg-muted/30 transition-colors",
      isConfirmed && "bg-success/5",
      isCanceledOrDistrato && "opacity-60"
    )}>
      {/* Cliente */}
      <td className="p-4">
        <div className="font-medium text-foreground truncate max-w-[150px]">
          {sale.client_name}
        </div>
      </td>
      
      {/* Imóvel */}
      <td className="p-4">
        <div className="truncate max-w-[180px]">
          <span className="font-medium text-foreground">{sale.property_address}</span>
          <p className="text-xs text-muted-foreground capitalize">{sale.property_type}</p>
        </div>
      </td>
      
      {/* Corretor */}
      <td className="p-4">
        <div className="font-medium text-foreground">
          {broker?.name || 'Sem corretor'}
        </div>
      </td>
      
      {/* Valor + Comissão */}
      <td className="p-4">
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">
            {formatCurrency(Number(sale.vgv || sale.property_value))}
          </div>
          <div className="text-xs text-success font-medium">
            + {formatCurrency(Number(sale.vgc))} VGC
          </div>
        </div>
      </td>
      
      {/* Status */}
      <td className="p-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn("cursor-help", statusConfig.className)}
              >
                {statusConfig.label}
              </Badge>
            </TooltipTrigger>
            {statusConfig.tooltip && (
              <TooltipContent>
                <p>{statusConfig.tooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </td>
      
      {/* Data */}
      <td className="p-4">
        <div className="text-sm text-foreground">
          {sale.sale_date 
            ? new Date(sale.sale_date).toLocaleDateString('pt-BR')
            : 'Sem data'}
        </div>
      </td>
      
      {/* Ações */}
      <td className="p-4">
        <div className="flex items-center gap-1 justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onView(sale)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver detalhes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(sale)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar venda</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(sale)}>
                <Eye className="w-4 h-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(sale)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(sale.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
};

export default SalesTableRow;
