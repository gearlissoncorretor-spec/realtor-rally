import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FollowUp } from "@/hooks/useFollowUps";
import { formatCurrency } from "@/utils/formatting";

interface ConvertToNegotiationDialogProps {
  followUp: FollowUp | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConvertToNegotiationDialog({
  followUp,
  open,
  onOpenChange,
  onConfirm,
}: ConvertToNegotiationDialogProps) {
  if (!followUp) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Converter em Negociação</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a converter este Follow Up em uma Negociação ativa.
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
              <p><strong>Cliente:</strong> {followUp.client_name}</p>
              <p><strong>Telefone:</strong> {followUp.client_phone || 'Não informado'}</p>
              <p><strong>Imóvel:</strong> {followUp.property_interest || 'Não definido'}</p>
              <p><strong>VGV Estimado:</strong> {formatCurrency(followUp.estimated_vgv)}</p>
            </div>
            <p className="text-amber-600 dark:text-amber-400">
              Esta ação irá remover o cliente da tela de Follow Up e criar uma nova negociação com status "Em Contato".
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-primary hover:bg-primary/90">
            Converter em Negociação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
