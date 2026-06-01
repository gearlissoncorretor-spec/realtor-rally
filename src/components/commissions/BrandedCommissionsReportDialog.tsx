import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useAuth } from '@/contexts/AuthContext';
import { generateBrandedCommissionsReport, type CommissionLike } from '@/utils/brandedPdf';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Broker } from '@/contexts/DataContext';

interface Props {
  commissions: CommissionLike[];
  brokers: Broker[];
  trigger?: React.ReactNode;
}

export const BrandedCommissionsReportDialog = ({ commissions, brokers, trigger }: Props) => {
  const { toast } = useToast();
  const { settings } = useOrganizationSettings();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const filtered = commissions.filter((c) => {
        const d = c.due_date || c.payment_date;
        if (!d) return true;
        return d >= from && d <= to;
      });
      if (filtered.length === 0) {
        toast({ title: 'Sem dados', description: 'Nenhuma comissão no período.', variant: 'destructive' });
        setGenerating(false);
        return;
      }
      const periodLabel = `${format(new Date(from), "dd 'de' MMM", { locale: ptBR })} a ${format(new Date(to), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
      const doc = await generateBrandedCommissionsReport({
        commissions: filtered,
        brokers,
        branding: settings,
        periodLabel,
        authorName: profile?.full_name,
      });
      doc.save(`relatorio-comissoes-${from}-a-${to}.pdf`);
      toast({ title: 'Relatório gerado!', description: `${filtered.length} comissão(ões) incluída(s).` });
      setOpen(false);
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" /> PDF Premium
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Relatório de Comissões</DialogTitle>
          <DialogDescription>PDF profissional com capa, branding e quebra por corretor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="com-from" className="text-xs">De</Label>
              <Input id="com-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-to" className="text-xs">Até</Label>
              <Input id="com-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generating}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><FileText className="w-4 h-4 mr-2" />Gerar PDF</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
