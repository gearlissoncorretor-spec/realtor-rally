import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { Negotiation } from '@/hooks/useNegotiations';

interface LossReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: Negotiation | null;
  onConfirm: (lossReason: string) => Promise<void>;
}

const LOSS_REASONS = [
  { value: 'preco_alto', label: 'Preço alto' },
  { value: 'desistiu_imovel', label: 'Desistiu do imóvel' },
  { value: 'comprou_outro', label: 'Comprou em outro lugar' },
  { value: 'problemas_financeiros', label: 'Problemas financeiros' },
  { value: 'documentacao', label: 'Problemas de documentação' },
  { value: 'nao_aprovou_credito', label: 'Não aprovou crédito' },
  { value: 'mudou_cidade', label: 'Mudou de cidade' },
  { value: 'outro', label: 'Outro motivo' },
];

export function LossReasonDialog({ open, onOpenChange, negotiation, onConfirm }: LossReasonDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiation) return;

    const finalReason = selectedReason === 'outro' 
      ? customReason 
      : LOSS_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

    if (!finalReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
      onOpenChange(false);
      setSelectedReason('');
      setCustomReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedReason('');
      setCustomReason('');
    }
    onOpenChange(newOpen);
  };

  if (!negotiation) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Registrar Perda
          </DialogTitle>
          <DialogDescription>
            Registre o motivo da desistência do cliente para análise futura.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Negociação (readonly) */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Esta ação não pode ser desfeita</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Cliente:</span>{' '}
                <span className="font-medium">{negotiation.client_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Imóvel:</span>{' '}
                <span className="font-medium">{negotiation.property_address}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor:</span>{' '}
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negotiation.negotiated_value)}
                </span>
              </div>
            </div>
          </div>

          {/* Motivo da Perda */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Desistência *</Label>
            <Select
              value={selectedReason}
              onValueChange={setSelectedReason}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de texto livre para "Outro" */}
          {selectedReason === 'outro' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Descreva o motivo *</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Descreva o motivo da desistência do cliente..."
                rows={3}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedReason || (selectedReason === 'outro' && !customReason.trim())} 
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirmar Perda
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
