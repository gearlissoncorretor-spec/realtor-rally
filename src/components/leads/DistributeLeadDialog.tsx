import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBrokers } from '@/hooks/useBrokers';
import type { Lead } from '@/hooks/useLeads';
import { Users } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onConfirm: (brokerUserId: string) => Promise<void>;
}

export const DistributeLeadDialog = ({ open, onOpenChange, lead, onConfirm }: Props) => {
  const { brokers } = useBrokers();
  const [selected, setSelected] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const eligibleBrokers = brokers.filter((b: any) => b.status === 'ativo' && b.user_id);

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onConfirm(selected);
      onOpenChange(false);
      setSelected('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Distribuir Lead
          </DialogTitle>
          <DialogDescription>
            {lead ? `Atribua "${lead.name}" a um corretor da equipe.` : 'Selecione um lead.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>Corretor responsável</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um corretor" />
            </SelectTrigger>
            <SelectContent>
              {eligibleBrokers.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">Nenhum corretor ativo disponível</div>
              ) : (
                eligibleBrokers.map((b: any) => (
                  <SelectItem key={b.id} value={b.user_id}>
                    {b.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || submitting}>
            {submitting ? 'Distribuindo...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
