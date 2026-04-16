import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, FileSpreadsheet, FileText, Filter, Columns3, 
  Eye, Loader2, CheckCircle2, Handshake, ListChecks
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Negotiation } from "@/hooks/useNegotiations";
import type { Broker } from "@/contexts/DataContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useNegotiationStatuses } from "@/hooks/useNegotiationStatuses";

interface NegotiationsExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  negotiations: Negotiation[];
  brokers: Broker[];
  activeTab?: string;
}

type ExportField = {
  key: string;
  label: string;
  checked: boolean;
  getValue: (negotiation: Negotiation, brokers: Broker[], getStatusLabel: (val: string) => string) => string;
};

const INITIAL_FIELDS: ExportField[] = [
  { key: "client_name", label: "Nome do Cliente", checked: true, getValue: (n) => n.client_name || "" },
  { key: "client_phone", label: "Telefone", checked: true, getValue: (n) => n.client_phone || "" },
  { key: "client_email", label: "Email", checked: false, getValue: (n) => n.client_email || "" },
  { key: "broker", label: "Corretor Responsável", checked: true, getValue: (n, b) => b.find(br => br.id === n.broker_id)?.name || "N/A" },
  { key: "property_address", label: "Empreendimento", checked: true, getValue: (n) => n.property_address || "" },
  { key: "property_type", label: "Tipo de Imóvel", checked: true, getValue: (n) => n.property_type || "" },
  { key: "negotiated_value", label: "Valor Negociado", checked: true, getValue: (n) => formatCurrency(Number(n.negotiated_value || 0)) },
  { key: "status", label: "Status / Etapa", checked: true, getValue: (n, _, getLabel) => getLabel(n.status) },
  { key: "temperature", label: "Termômetro", checked: true, getValue: (n) => n.temperature === 'quente' ? '🔥 Quente' : n.temperature === 'morna' ? '🌤️ Morna' : '❄️ Fria' },
  { key: "start_date", label: "Data de Início", checked: true, getValue: (n) => n.start_date ? format(new Date(n.start_date), "dd/MM/yyyy", { locale: ptBR }) : "" },
  { key: "origem", label: "Origem", checked: false, getValue: (n) => n.origem || "" },
  { key: "loss_reason", label: "Motivo da Perda", checked: false, getValue: (n) => n.loss_reason || "" },
  { key: "observations", label: "Observações", checked: false, getValue: (n) => n.observations || "" },
  { key: "created_at", label: "Data de Cadastro", checked: false, getValue: (n) => format(new Date(n.created_at), "dd/MM/yyyy", { locale: ptBR }) },
];

const NegotiationsExportDialog = ({ isOpen, onClose, negotiations, brokers, activeTab = "active" }: NegotiationsExportDialogProps) => {
  const { toast } = useToast();
  const { settings: orgSettings } = useOrganizationSettings();
  const { getStatusByValue } = useNegotiationStatuses();
  const [step, setStep] = useState<"filters" | "select" | "fields" | "preview">("filters");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterBroker, setFilterBroker] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTemperature, setFilterTemperature] = useState("all");
  const [exportScope, setExportScope] = useState<"tab" | "total">("tab");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [useManualSelection, setUseManualSelection] = useState(false);

  const [fields, setFields] = useState<ExportField[]>(INITIAL_FIELDS);
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("landscape");

  const getStatusLabel = (val: string) => {
    if (val === 'perdida') return 'Perdida';
    if (val === 'venda_concluida') return 'Venda Concluída';
    return getStatusByValue(val)?.label || val;
  };

  const filteredNegotiations = useMemo(() => {
    return negotiations.filter(n => {
      // Filter by scope (active tab or total)
      if (exportScope === "tab") {
        const isLost = n.status === 'perdida';
        if (activeTab === "active" && isLost) return false;
        if (activeTab === "lost" && !isLost) return false;
      }

      if (dateFrom) {
        const date = new Date(n.start_date || n.created_at || "");
        if (date < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const date = new Date(n.start_date || n.created_at || "");
        if (date > new Date(dateTo + "T23:59:59")) return false;
      }
      if (filterBroker !== "all" && n.broker_id !== filterBroker) return false;
      if (filterStatus !== "all" && n.status !== filterStatus) return false;
      if (filterTemperature !== "all" && n.temperature !== filterTemperature) return false;
      
      return true;
    });
  }, [negotiations, exportScope, activeTab, dateFrom, dateTo, filterBroker, filterStatus, filterTemperature]);

  const dataToExport = useMemo(() => {
    if (useManualSelection && selectedIds.size > 0) {
      return filteredNegotiations.filter(n => selectedIds.has(n.id));
    }
    return filteredNegotiations;
  }, [filteredNegotiations, useManualSelection, selectedIds]);

  const selectedFields = fields.filter(f => f.checked);

  const summary = useMemo(() => {
    const totalValue = dataToExport.reduce((sum, n) => sum + Number(n.negotiated_value || 0), 0);
    return { count: dataToExport.length, totalValue };
  }, [dataToExport]);

  const toggleField = (key: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, checked: !f.checked } : f));
  };

  const selectAllFields = (checked: boolean) => {
    setFields(prev => prev.map(f => ({ ...f, checked })));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredNegotiations.map(n => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const orgName = orgSettings?.organization_name || 'Gestão Imobiliária';

  const getFileName = (ext: string) => {
    const now = new Date();
    const month = format(now, "MMMM", { locale: ptBR });
    const year = now.getFullYear();
    const prefix = exportScope === "total" ? "negociacoes_geral" : (activeTab === "lost" ? "negociacoes_perdidas" : "negociacoes_ativas");
    return `${prefix}_${month}_${year}.${ext}`;
  };

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      const headers = selectedFields.map(f => f.label);
      const rows = dataToExport.map(n =>
        selectedFields.map(f => f.getValue(n, brokers, getStatusLabel))
      );
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = selectedFields.map(f => ({ wch: Math.max(f.label.length + 4, 16) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Negociações");

      const summaryData = [
        [`Relatório de Negociações - ${orgName}`],
        [""],
        ["Data da Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
        ["Total de Negociações", summary.count.toString()],
        ["Valor Total Negociado", formatCurrency(summary.totalValue)],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 24 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");
      XLSX.writeFile(wb, getFileName("xlsx"));

      setExportSuccess(true);
      toast({ title: "Exportação concluída!", description: `Arquivo ${getFileName("xlsx")} gerado com sucesso.` });
      setTimeout(() => { setExportSuccess(false); }, 2000);
    } catch (err) {
      toast({ title: "Erro na exportação", description: "Não foi possível gerar o Excel.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      const doc = new jsPDF({ orientation: pdfOrientation });
      const pageWidth = doc.internal.pageSize.width;
      let startY = 18;

      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text(orgName, pageWidth / 2, startY, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text("Relatório de Negociações", pageWidth / 2, startY + 9, { align: "center" });
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, startY + 16, { align: "center" });

      const boxY = startY + 22;
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, boxY, pageWidth - 28, 15, 3, 3, "FD");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`Negociações: ${summary.count}`, 20, boxY + 9);
      doc.text(`Valor Total Negociado: ${formatCurrency(summary.totalValue)}`, 100, boxY + 9);

      const headers = selectedFields.map(f => f.label);
      const rows = dataToExport.map(n =>
        selectedFields.map(f => f.getValue(n, brokers, getStatusLabel))
      );

      autoTable(doc, {
        startY: boxY + 20,
        head: [headers],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 7, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      doc.save(getFileName("pdf"));
      setExportSuccess(true);
      toast({ title: "Exportação concluída!", description: `Arquivo ${getFileName("pdf")} gerado com sucesso.` });
      setTimeout(() => { setExportSuccess(false); }, 2000);
    } catch (err) {
      toast({ title: "Erro na exportação", description: "Não foi possível gerar o PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const resetAndClose = () => {
    setStep("filters");
    setExportSuccess(false);
    setIsExporting(false);
    setUseManualSelection(false);
    setExportScope("tab");
    setSelectedIds(new Set());
    onClose();
  };

  const uniqueStatuses = [...new Set(negotiations.map(n => n.status).filter(Boolean))];

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Handshake className="w-5 h-5 text-primary" />
            Exportar Negociações (Status)
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {[
            { id: "filters", label: "Filtros", icon: Filter },
            { id: "select", label: "Seleção", icon: ListChecks },
            { id: "fields", label: "Campos", icon: Columns3 },
            { id: "preview", label: "Exportar", icon: Eye },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Step 1: Filters */}
        {step === "filters" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aplique filtros para refinar os dados das negociações.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Escopo da Exportação</Label>
                <Select value={exportScope} onValueChange={(v: any) => setExportScope(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione o escopo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tab">Aba Atual ({activeTab === 'active' ? 'Em Andamento' : 'Perdidas'})</SelectItem>
                    <SelectItem value="total">Total (Todas as etapas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data Inicial</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data Final</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Corretor</Label>
                <Select value={filterBroker} onValueChange={setFilterBroker}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os corretores</SelectItem>
                    {brokers.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status / Etapa</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {uniqueStatuses.map(s => <SelectItem key={s!} value={s!}>{getStatusLabel(s!)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Termômetro</Label>
                <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="quente">🔥 Quente</SelectItem>
                    <SelectItem value="morna">🌤️ Morna</SelectItem>
                    <SelectItem value="fria">❄️ Fria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{filteredNegotiations.length}</span> registros encontrados
              </p>
              <Button onClick={() => setStep("select")} className="gap-2" size="sm">
                Avançar <ListChecks className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Selection */}
        {step === "select" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Seleção de Registros</h3>
                <p className="text-xs text-muted-foreground">Escolha registros específicos ou exporte todos os filtrados.</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="manual" className="text-xs cursor-pointer">Seleção manual</Label>
                <Checkbox id="manual" checked={useManualSelection} onCheckedChange={(v: boolean) => setUseManualSelection(v)} />
              </div>
            </div>

            <Card className="border-border/50 overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left w-8">
                        <Checkbox 
                          checked={filteredNegotiations.length > 0 && (useManualSelection ? selectedIds.size === filteredNegotiations.length : true)}
                          onCheckedChange={(v: boolean) => useManualSelection ? toggleAll(v) : null}
                          disabled={!useManualSelection}
                        />
                      </th>
                      <th className="p-2 text-left">Cliente</th>
                      <th className="p-2 text-left">Empreendimento</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNegotiations.map((n) => (
                      <tr key={n.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                        <td className="p-2">
                          <Checkbox 
                            checked={useManualSelection ? selectedIds.has(n.id) : true}
                            onCheckedChange={() => useManualSelection ? toggleSelection(n.id) : null}
                            disabled={!useManualSelection}
                          />
                        </td>
                        <td className="p-2 font-medium">{n.client_name}</td>
                        <td className="p-2 text-muted-foreground">{n.property_address}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-[10px] py-0 h-4">{getStatusLabel(n.status)}</Badge>
                        </td>
                        <td className="p-2 text-right">{formatCurrency(n.negotiated_value)}</td>
                      </tr>
                    ))}
                    {filteredNegotiations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                          Nenhum registro encontrado com os filtros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="pt-4 flex justify-between items-center border-t">
              <Button variant="ghost" onClick={() => setStep("filters")} size="sm">Voltar</Button>
              <Button onClick={() => setStep("fields")} className="gap-2" size="sm" disabled={filteredNegotiations.length === 0}>
                Avançar <Columns3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Fields */}
        {step === "fields" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Configurar Colunas</h3>
                <p className="text-xs text-muted-foreground">Escolha quais informações deseja incluir no arquivo.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectAllFields(true)} className="h-7 text-[10px] px-2">Selecionar Tudo</Button>
                <Button variant="outline" size="sm" onClick={() => selectAllFields(false)} className="h-7 text-[10px] px-2">Limpar</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fields.map((field) => (
                <div 
                  key={field.key} 
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                    field.checked ? "bg-primary/5 border-primary/20" : "bg-card border-border/50 opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => toggleField(field.key)}
                >
                  <Checkbox checked={field.checked} onCheckedChange={() => toggleField(field.key)} />
                  <span className="text-xs font-medium">{field.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center border-t">
              <Button variant="ghost" onClick={() => setStep("select")} size="sm">Voltar</Button>
              <Button onClick={() => setStep("preview")} className="gap-2" size="sm" disabled={selectedFields.length === 0}>
                Avançar <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Preview & Export */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 border-primary/20 bg-primary/5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Resumo da Exportação</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de registros:</span>
                    <span className="font-bold">{summary.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Colunas selecionadas:</span>
                    <span className="font-bold">{selectedFields.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor total negociado:</span>
                    <span className="font-bold text-primary">{formatCurrency(summary.totalValue)}</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Label className="text-xs">Orientação do PDF</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={pdfOrientation === "portrait" ? "default" : "outline"} 
                    className="flex-1 text-xs gap-1.5 h-9" 
                    onClick={() => setPdfOrientation("portrait")}
                  >
                    Vertical
                  </Button>
                  <Button 
                    variant={pdfOrientation === "landscape" ? "default" : "outline"} 
                    className="flex-1 text-xs gap-1.5 h-9" 
                    onClick={() => setPdfOrientation("landscape")}
                  >
                    Horizontal
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Horizontal é recomendado para relatórios com muitas colunas.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={exportExcel} 
                disabled={isExporting || summary.count === 0} 
                variant="outline" 
                className="flex-1 h-12 gap-2 border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-600"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
                Exportar Excel
              </Button>
              <Button 
                onClick={exportPDF} 
                disabled={isExporting || summary.count === 0} 
                variant="outline" 
                className="flex-1 h-12 gap-2 border-blue-500/20 hover:bg-blue-500/5 hover:text-blue-600"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-blue-500" />}
                Exportar PDF
              </Button>
            </div>

            {exportSuccess && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Download iniciado com sucesso!</span>
              </div>
            )}

            <div className="pt-4 flex justify-start border-t">
              <Button variant="ghost" onClick={() => setStep("fields")} size="sm">Voltar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NegotiationsExportDialog;
