import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBrokers } from "@/hooks/useBrokers";
import PeriodFilter from "@/components/PeriodFilter";
import { BrokerReportRenderer } from "./BrokerReportRenderer";
import type { Broker } from "@/contexts/DataContext";

interface BrokerReportDialogProps {
  preSelectedBrokerId?: string;
  trigger?: React.ReactNode;
}

const BrokerReportDialog = ({ preSelectedBrokerId, trigger }: BrokerReportDialogProps) => {
  const { toast } = useToast();
  const { brokers } = useBrokers();
  const [open, setOpen] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>(preSelectedBrokerId || "");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [showRenderer, setShowRenderer] = useState(false);

  const activeBrokers = brokers.filter(b => b.status === "ativo");
  const selectedBroker = brokers.find(b => b.id === selectedBrokerId);

  const handleGenerate = useCallback(() => {
    if (!selectedBrokerId) {
      toast({ title: "Selecione um corretor", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setShowRenderer(true);
  }, [selectedBrokerId, toast]);

  const handlePdfReady = useCallback(() => {
    setGenerating(false);
    setShowRenderer(false);
    toast({ title: "PDF Gerado!", description: "Relatório individual baixado com sucesso." });
  }, [toast]);

  const handlePdfError = useCallback(() => {
    setGenerating(false);
    setShowRenderer(false);
    toast({ title: "Erro ao gerar PDF", variant: "destructive" });
  }, [toast]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Relatório Individual
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Relatório Individual</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Corretor</label>
              <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o corretor" />
                </SelectTrigger>
                <SelectContent>
                  {activeBrokers.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Período</label>
              <PeriodFilter
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={generating || !selectedBrokerId}
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando PDF...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" />Gerar PDF</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showRenderer && selectedBroker && (
        <BrokerReportRenderer
          broker={selectedBroker}
          month={selectedMonth}
          year={selectedYear}
          onComplete={handlePdfReady}
          onError={handlePdfError}
        />
      )}
    </>
  );
};

export default BrokerReportDialog;
