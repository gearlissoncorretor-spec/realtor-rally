import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Percent, CreditCard } from 'lucide-react';
import { useCommissions, CommissionInsert } from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatting';

interface CommissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    saleId: string;
    brokerId: string;
    brokerName: string;
    clientName: string;
    propertyValue: number;
    vgc: number;
    commissionRate: number;
  } | null;
}

const CommissionDialog = ({ isOpen, onClose, saleData }: CommissionDialogProps) => {
  const { createCommission } = useCommissions();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [percentage, setPercentage] = useState<number>(saleData?.commissionRate || 5);
  const [baseValue, setBaseValue] = useState<number>(saleData?.vgc || saleData?.propertyValue || 0);
  const [commissionType, setCommissionType] = useState<string>('venda');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [observations, setObservations] = useState('');

  // Reset form when saleData changes
  const commissionValue = (baseValue * percentage) / 100;

  const handleSave = async () => {
    if (!saleData) return;
    setSaving(true);
    try {
      const data: CommissionInsert = {
        sale_id: saleData.saleId,
        broker_id: saleData.brokerId,
        commission_percentage: percentage,
        commission_value: commissionValue,
        base_value: baseValue,
        payment_method: paymentMethod || null,
        installments,
        observations: observations || null,
      };
      await createCommission(data);
      toast({ title: 'Comissão registrada', description: 'O comissionamento foi cadastrado com sucesso.' });
      onClose();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível cadastrar a comissão.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!saleData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-success" />
            Cadastrar Comissionamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sale summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Corretor</span>
              <Badge variant="secondary" className="text-xs">{saleData.brokerName}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Cliente</span>
              <span className="text-sm font-medium text-foreground">{saleData.clientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Valor do Imóvel</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(saleData.propertyValue)}</span>
            </div>
          </div>

          {/* Commission config */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                <DollarSign className="w-3 h-3" /> Valor Base (VGC)
              </Label>
              <Input
                type="number"
                value={baseValue}
                onChange={(e) => setBaseValue(Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                <Percent className="w-3 h-3" /> % Comissão
              </Label>
              <Input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Calculated commission */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Valor da Comissão</p>
            <p className="text-2xl font-black text-success">{formatCurrency(commissionValue)}</p>
          </div>

          {/* Payment details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                <CreditCard className="w-3 h-3" /> Forma de Pagamento
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Parcelas</Label>
              <Input
                type="number"
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações sobre o comissionamento..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Pular</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <DollarSign className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Registrar Comissão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommissionDialog;
