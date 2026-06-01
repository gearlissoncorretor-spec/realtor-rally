import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useAuth } from '@/contexts/AuthContext';
import { generateBrandedFollowUpReport, type FollowUpLike } from '@/utils/brandedPdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Broker } from '@/contexts/DataContext';

interface Props {
  followUps: FollowUpLike[];
  brokers: Broker[];
  getStatusLabel?: (status: string) => string;
  trigger?: React.ReactNode;
  filteredCount?: number;
}

export const BrandedFollowUpReportDialog = ({ followUps, brokers, getStatusLabel, trigger, filteredCount }: Props) => {
  const { toast } = useToast();
  const { settings } = useOrganizationSettings();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (followUps.length === 0) {
        toast({ title: 'Sem dados', description: 'Nenhum follow-up para exportar.', variant: 'destructive' });
        setGenerating(false);
        return;
      }
      const periodLabel = `Snapshot em ${format(new Date(), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
      const doc = await generateBrandedFollowUpReport({
        followUps,
        brokers,
        branding: settings,
        periodLabel,
        statusLabel: getStatusLabel,
        authorName: profile?.full_name,
      });
      doc.save(`relatorio-followup-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'Relatório gerado!', description: `${followUps.length} cliente(s) incluído(s).` });
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
          <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Relatório de Follow-up</DialogTitle>
          <DialogDescription>PDF profissional com capa, branding e distribuição por status.</DialogDescription>
        </DialogHeader>
        <div className="py-3 text-sm text-muted-foreground">
          {filteredCount ?? followUps.length} cliente(s) serão incluído(s) no relatório.
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
