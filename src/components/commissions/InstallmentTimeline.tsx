import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, XCircle, Calendar, CreditCard } from 'lucide-react';
import { useCommissionInstallments, CommissionInstallment } from '@/hooks/useCommissionInstallments';
import { formatCurrency } from '@/utils/formatting';
import { cn } from '@/lib/utils';

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  atrasado: { label: 'Atrasado', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

interface Props {
  commissionId: string;
  commissionValue: number;
  installmentCount: number;
  canManage: boolean;
}

const InstallmentTimeline = ({ commissionId, commissionValue, installmentCount, canManage }: Props) => {
  const { installments, loading, generateInstallments, updateInstallment } = useCommissionInstallments(commissionId);
  const [generating, setGenerating] = useState(false);
  const [firstDueDate, setFirstDueDate] = useState('');

  const handleGenerate = async () => {
    if (!firstDueDate || installmentCount < 1) return;
    setGenerating(true);
    try {
      await generateInstallments({
        commissionId,
        totalValue: commissionValue,
        count: installmentCount,
        firstDueDate,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (inst: CommissionInstallment, newStatus: string) => {
    await updateInstallment({
      id: inst.id,
      status: newStatus,
      payment_date: newStatus === 'pago' ? new Date().toISOString().split('T')[0] : null,
    });
  };

  const isOverdue = (inst: CommissionInstallment) => {
    if (inst.status === 'pago') return false;
    if (!inst.due_date) return false;
    return new Date(inst.due_date) < new Date(new Date().toDateString());
  };

  const paidCount = installments.filter(i => i.status === 'pago').length;
  const paidValue = installments.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.value), 0);

  if (loading) return <div className="text-xs text-muted-foreground py-2">Carregando parcelas...</div>;

  if (installments.length === 0 && installmentCount > 1) {
    return (
      <div className="space-y-3 border border-border/50 rounded-lg p-3">
        <p className="text-xs font-medium text-muted-foreground">Gerar parcelas detalhadas</p>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-muted-foreground">Data 1ª parcela</label>
            <Input type="date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} className="h-8 text-xs" />
          </div>
          <Button size="sm" onClick={handleGenerate} disabled={generating || !firstDueDate} className="h-8 text-xs">
            {generating ? 'Gerando...' : `Gerar ${installmentCount}x`}
          </Button>
        </div>
      </div>
    );
  }

  if (installments.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{paidCount}/{installments.length} parcelas pagas</span>
          <span>{formatCurrency(paidValue)} / {formatCurrency(commissionValue)}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${(paidCount / installments.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1.5">
        {installments.map((inst) => {
          const overdue = isOverdue(inst);
          const effectiveStatus = overdue ? 'atrasado' : inst.status;
          const config = statusMap[effectiveStatus] || statusMap.pendente;
          const StatusIcon = config.icon;

          return (
            <div key={inst.id} className={cn(
              "flex items-center gap-2 p-2 rounded-md border text-xs",
              overdue ? "border-destructive/30 bg-destructive/5" : "border-border/50"
            )}>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", config.color.split(' ')[0])}>
                <StatusIcon className={cn("w-3 h-3", config.color.split(' ')[1])} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{inst.installment_number}ª parcela</span>
                {inst.due_date && (
                  <span className={cn("ml-2 text-muted-foreground", overdue && "text-destructive font-medium")}>
                    <Calendar className="w-3 h-3 inline mr-0.5" />
                    {new Date(inst.due_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <span className="font-bold shrink-0">{formatCurrency(Number(inst.value))}</span>
              {canManage && inst.status !== 'pago' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-success hover:text-success"
                  onClick={() => handleStatusChange(inst, 'pago')}
                >
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Pagar
                </Button>
              )}
              {inst.status === 'pago' && inst.payment_date && (
                <span className="text-[10px] text-success">
                  Pago {new Date(inst.payment_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstallmentTimeline;
