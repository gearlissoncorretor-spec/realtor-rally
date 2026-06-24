import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useAuth } from '@/contexts/AuthContext';
import { generateBrandedSalesReport } from '@/utils/brandedPdf';
import { format, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Sale, Broker } from '@/contexts/DataContext';

interface BrandedReportDialogProps {
  sales: Sale[];
  brokers: Broker[];
  trigger?: React.ReactNode;
}

export const BrandedReportDialog = ({ sales, brokers, trigger }: BrandedReportDialogProps) => {
  const { toast } = useToast();
  const { settings } = useOrganizationSettings();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [from, setFrom] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Auto-corrige se o usuário inverter as datas
      const [startDate, endDate] = from <= to ? [from, to] : [to, from];
      const filtered = sales.filter((s) => {
        if (!s.sale_date) return false;
        const d = s.sale_date.substring(0, 10);
        return d >= startDate && d <= endDate;
      });

      if (filtered.length === 0) {
        toast({
          title: 'Sem dados no período',
          description: 'Não há vendas registradas entre as datas selecionadas.',
          variant: 'destructive',
        });
        setGenerating(false);
        return;
      }

      const periodLabel = `${format(new Date(startDate + 'T00:00:00'), "dd 'de' MMM", { locale: ptBR })} a ${format(new Date(endDate + 'T00:00:00'), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;

      const doc = await generateBrandedSalesReport({
        sales: filtered,
        brokers,
        branding: settings,
        periodLabel,
        authorName: profile?.full_name,
      });

      const fileName = `relatorio-vendas-${startDate}-a-${endDate}.pdf`;
      doc.save(fileName);

      toast({
        title: 'Relatório gerado!',
        description: `${filtered.length} venda(s) incluída(s) no PDF.`,
      });
      setOpen(false);
    } catch (err) {
      console.error('PDF error:', err);
      toast({
        title: 'Erro ao gerar PDF',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Relatório Premium
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Relatório de Vendas com Branding
          </DialogTitle>
          <DialogDescription>
            PDF profissional com capa, logo e cores da sua imobiliária — pronto para enviar a sócios e diretores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from" className="text-xs">De</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to" className="text-xs">Até</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Imobiliária:</span>
              <span className="font-medium">{settings?.organization_name || '(sem nome)'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cor principal:</span>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded border"
                  style={{ backgroundColor: settings?.primary_color || '#3b82f6' }}
                />
                <span className="font-mono">{settings?.primary_color || '#3b82f6'}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Logo:</span>
              <span className="font-medium">
                {settings?.logo_icon_url || settings?.logo_url ? '✓ Configurado' : '⚠ Não configurado'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
