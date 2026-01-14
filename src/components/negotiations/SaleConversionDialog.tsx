import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, DollarSign } from 'lucide-react';
import { Negotiation } from '@/hooks/useNegotiations';
import { useBrokers } from '@/hooks/useBrokers';

interface SaleConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: Negotiation | null;
  onConfirm: (data: SaleConversionData) => Promise<void>;
}

export interface SaleConversionData {
  sale_date: string;
  vgv: number;
  vgc: number;
  contract_date?: string;
  vendedor?: string;
  captador?: string;
  gerente?: string;
  origem?: string;
  notes?: string;
}

const ORIGENS = [
  'Indicação',
  'Portal Imobiliário',
  'Redes Sociais',
  'Site',
  'Plantão',
  'Stand de Vendas',
  'Outro'
];

export function SaleConversionDialog({ open, onOpenChange, negotiation, onConfirm }: SaleConversionDialogProps) {
  const { brokers } = useBrokers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SaleConversionData>({
    sale_date: new Date().toISOString().split('T')[0],
    vgv: negotiation?.negotiated_value || 0,
    vgc: (negotiation?.negotiated_value || 0) * 0.06,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiation) return;

    setIsSubmitting(true);
    try {
      await onConfirm(formData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when negotiation changes
  if (negotiation && formData.vgv !== negotiation.negotiated_value) {
    setFormData({
      sale_date: new Date().toISOString().split('T')[0],
      vgv: negotiation.negotiated_value,
      vgc: negotiation.negotiated_value * 0.06,
    });
  }

  if (!negotiation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <DollarSign className="h-5 w-5" />
            Converter em Venda
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Negociação (readonly) */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Dados da Negociação</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>{' '}
                <span className="font-medium">{negotiation.client_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Telefone:</span>{' '}
                <span className="font-medium">{negotiation.client_phone || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{negotiation.client_email || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>{' '}
                <span className="font-medium capitalize">{negotiation.property_type}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Imóvel:</span>{' '}
                <span className="font-medium">{negotiation.property_address}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Negociado:</span>{' '}
                <span className="font-medium text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negotiation.negotiated_value)}
                </span>
              </div>
            </div>
          </div>

          {/* Campos obrigatórios */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_date">Data da Venda *</Label>
              <Input
                id="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract_date">Data do Contrato</Label>
              <Input
                id="contract_date"
                type="date"
                value={formData.contract_date || ''}
                onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vgv">VGV (Valor Geral de Vendas) *</Label>
              <CurrencyInput
                value={formData.vgv}
                onChange={(value) => setFormData({ ...formData, vgv: value })}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vgc">VGC (Comissão) *</Label>
              <CurrencyInput
                value={formData.vgc}
                onChange={(value) => setFormData({ ...formData, vgc: value })}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* Campos opcionais */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor</Label>
              <Select
                value={formData.vendedor || ''}
                onValueChange={(value) => setFormData({ ...formData, vendedor: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.name}>
                      {broker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="captador">Captador</Label>
              <Select
                value={formData.captador || ''}
                onValueChange={(value) => setFormData({ ...formData, captador: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.name}>
                      {broker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gerente">Gerente</Label>
              <Input
                id="gerente"
                value={formData.gerente || ''}
                onChange={(e) => setFormData({ ...formData, gerente: e.target.value })}
                placeholder="Nome do gerente"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origem">Origem da Venda</Label>
            <Select
              value={formData.origem || ''}
              onValueChange={(value) => setFormData({ ...formData, origem: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {ORIGENS.map((origem) => (
                  <SelectItem key={origem} value={origem}>
                    {origem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais sobre a venda..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirmar Venda
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
