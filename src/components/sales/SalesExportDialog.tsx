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
  Eye, Loader2, CheckCircle2, BarChart3, ListChecks
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Sale } from "@/contexts/DataContext";
import type { Broker } from "@/contexts/DataContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

interface SalesExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  brokers: Broker[];
}

type ExportField = {
  key: string;
  label: string;
  checked: boolean;
  getValue: (sale: Sale, brokers: Broker[]) => string;
};

const INITIAL_FIELDS: ExportField[] = [
  { key: "client_name", label: "Nome do Cliente", checked: true, getValue: (s) => s.client_name || "" },
  { key: "client_phone", label: "Telefone", checked: true, getValue: (s) => s.client_phone || "" },
  { key: "client_email", label: "Email", checked: false, getValue: (s) => s.client_email || "" },
  { key: "broker", label: "Corretor Responsável", checked: true, getValue: (s, b) => b.find(br => br.id === s.broker_id)?.name || "N/A" },
  { key: "property_address", label: "Empreendimento", checked: true, getValue: (s) => s.property_address || "" },
  { key: "property_type", label: "Tipo de Imóvel", checked: true, getValue: (s) => s.property_type || "" },
  { key: "property_value", label: "Valor do Imóvel", checked: true, getValue: (s) => formatCurrency(Number(s.property_value || 0)) },
  { key: "vgv", label: "VGV", checked: true, getValue: (s) => formatCurrency(Number(s.vgv || 0)) },
  { key: "vgc", label: "VGC / Comissão", checked: true, getValue: (s) => formatCurrency(Number(s.vgc || 0)) },
  { key: "sale_date", label: "Data da Venda", checked: true, getValue: (s) => s.sale_date ? format(new Date(s.sale_date), "dd/MM/yyyy", { locale: ptBR }) : "" },
  { key: "status", label: "Status", checked: true, getValue: (s) => s.status || "" },
  { key: "origem", label: "Origem", checked: false, getValue: (s) => s.origem || "" },
  { key: "sale_type", label: "Tipo de Venda", checked: false, getValue: (s) => s.sale_type || "" },
  { key: "captador", label: "Captador", checked: false, getValue: (s) => s.captador || "" },
  { key: "gerente", label: "Gerente", checked: false, getValue: (s) => s.gerente || "" },
  { key: "produto", label: "Produto", checked: false, getValue: (s) => s.produto || "" },
  { key: "commission_value", label: "Valor Comissão", checked: false, getValue: (s) => formatCurrency(Number(s.commission_value || 0)) },
  { key: "notes", label: "Observações", checked: false, getValue: (s) => s.notes || "" },
];

const SalesExportDialog = ({ isOpen, onClose, sales, brokers }: SalesExportDialogProps) => {
  const { toast } = useToast();
  const { settings: orgSettings } = useOrganizationSettings();
  const [step, setStep] = useState<"filters" | "select" | "fields" | "preview">("filters");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterBroker, setFilterBroker] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProperty, setFilterProperty] = useState("");
  const [filterPropertyType, setFilterPropertyType] = useState("all");

  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());
  const [useManualSelection, setUseManualSelection] = useState(false);

  const [fields, setFields] = useState<ExportField[]>(INITIAL_FIELDS);
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("landscape");

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (sale.tipo === 'captacao') return false;
      if (dateFrom) {
        const saleDate = new Date(sale.sale_date || sale.created_at || "");
        if (saleDate < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const saleDate = new Date(sale.sale_date || sale.created_at || "");
        if (saleDate > new Date(dateTo + "T23:59:59")) return false;
      }
      if (filterBroker !== "all" && sale.broker_id !== filterBroker) return false;
      if (filterStatus !== "all" && sale.status !== filterStatus) return false;
      if (filterProperty && !sale.property_address?.toLowerCase().includes(filterProperty.toLowerCase())) return false;
      if (filterPropertyType !== "all" && sale.property_type !== filterPropertyType) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo, filterBroker, filterStatus, filterProperty, filterPropertyType]);

  const salesToExport = useMemo(() => {
    if (useManualSelection && selectedSaleIds.size > 0) {
      return filteredSales.filter(s => selectedSaleIds.has(s.id));
    }
    return filteredSales;
  }, [filteredSales, useManualSelection, selectedSaleIds]);

  const selectedFields = fields.filter(f => f.checked);

  const summary = useMemo(() => {
    const totalVGV = salesToExport.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    const totalVGC = salesToExport.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
    const totalValue = salesToExport.reduce((sum, s) => sum + Number(s.property_value || 0), 0);
    return { count: salesToExport.length, totalVGV, totalVGC, totalValue };
  }, [salesToExport]);

  const toggleField = (key: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, checked: !f.checked } : f));
  };

  const selectAllFields = (checked: boolean) => {
    setFields(prev => prev.map(f => ({ ...f, checked })));
  };

  const toggleSaleSelection = (saleId: string) => {
    setSelectedSaleIds(prev => {
      const next = new Set(prev);
      if (next.has(saleId)) next.delete(saleId);
      else next.add(saleId);
      return next;
    });
  };

  const toggleAllSales = (checked: boolean) => {
    if (checked) {
      setSelectedSaleIds(new Set(filteredSales.map(s => s.id)));
    } else {
      setSelectedSaleIds(new Set());
    }
  };

  const orgName = orgSettings?.organization_name || 'Gestão Imobiliária';

  const getFileName = (ext: string) => {
    const now = new Date();
    const month = format(now, "MMMM", { locale: ptBR });
    const year = now.getFullYear();
    return `vendas_${month}_${year}.${ext}`;
  };

  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      const headers = selectedFields.map(f => f.label);
      const rows = salesToExport.map(sale =>
        selectedFields.map(f => f.getValue(sale, brokers))
      );
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = selectedFields.map(f => ({ wch: Math.max(f.label.length + 4, 16) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vendas");

      const summaryData = [
        [`Relatório de Vendas - ${orgName}`],
        [""],
        ["Data da Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
        ["Total de Vendas", summary.count.toString()],
        ["VGV Total", formatCurrency(summary.totalVGV)],
        ["VGC Total", formatCurrency(summary.totalVGC)],
        ["Valor Total", formatCurrency(summary.totalValue)],
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

      // Try to add company logo
      const logoUrl = orgSettings?.logo_url || orgSettings?.logo_icon_url;
      if (logoUrl) {
        const logoBase64 = await loadImageAsBase64(logoUrl);
        if (logoBase64) {
          try {
            doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
            startY = 18;
          } catch { /* ignore logo errors */ }
        }
      }

      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text(orgName, pageWidth / 2, startY, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text("Relatório de Vendas", pageWidth / 2, startY + 9, { align: "center" });
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, startY + 16, { align: "center" });

      const boxY = startY + 22;
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, boxY, pageWidth - 28, 22, 3, 3, "FD");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const summaryX = 20;
      doc.text(`Vendas: ${summary.count}`, summaryX, boxY + 10);
      doc.text(`VGV: ${formatCurrency(summary.totalVGV)}`, summaryX + 50, boxY + 10);
      doc.text(`VGC: ${formatCurrency(summary.totalVGC)}`, summaryX + 120, boxY + 10);
      doc.text(`Valor Total: ${formatCurrency(summary.totalValue)}`, summaryX + 190, boxY + 10);

      const headers = selectedFields.map(f => f.label);
      const rows = salesToExport.map(sale =>
        selectedFields.map(f => f.getValue(sale, brokers))
      );

      autoTable(doc, {
        startY: boxY + 28,
        head: [headers],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 7, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 8,
            { align: "center" }
          );
        },
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
    setSelectedSaleIds(new Set());
    onClose();
  };

  const uniqueStatuses = [...new Set(sales.map(s => s.status).filter(Boolean))];
  const uniquePropertyTypes = [...new Set(sales.map(s => s.property_type).filter(Boolean))];
  const allFilteredSelected = filteredSales.length > 0 && filteredSales.every(s => selectedSaleIds.has(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-primary" />
            Exportar Vendas
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
              Aplique filtros para refinar os dados ou exporte tudo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {uniqueStatuses.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Imóvel</Label>
                <Select value={filterPropertyType} onValueChange={setFilterPropertyType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {uniquePropertyTypes.map(t => <SelectItem key={t!} value={t!}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Empreendimento</Label>
                <Input
                  placeholder="Filtrar por empreendimento..."
                  value={filterProperty}
                  onChange={e => setFilterProperty(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <Card className="p-3 bg-muted/30 border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="font-medium">{filteredSales.length}</span>
                <span className="text-muted-foreground">vendas encontradas</span>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => {
                setDateFrom(""); setDateTo(""); setFilterBroker("all"); setFilterStatus("all"); setFilterProperty(""); setFilterPropertyType("all");
              }}>
                Limpar filtros
              </Button>
              <Button size="sm" onClick={() => setStep("select")}>
                Próximo →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Sale Selection */}
        {step === "select" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione vendas específicas ou exporte todas as filtradas.
            </p>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={useManualSelection}
                onCheckedChange={(v) => {
                  setUseManualSelection(!!v);
                  if (!v) setSelectedSaleIds(new Set());
                }}
              />
              <span className="text-sm font-medium">Selecionar vendas manualmente</span>
            </label>

            {useManualSelection ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(v) => toggleAllSales(!!v)}
                    />
                    <span className="text-xs text-muted-foreground">Selecionar todas ({filteredSales.length})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{selectedSaleIds.size} selecionadas</Badge>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                  {filteredSales.map(sale => {
                    const broker = brokers.find(b => b.id === sale.broker_id);
                    const isSelected = selectedSaleIds.has(sale.id);
                    return (
                      <label
                        key={sale.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                          isSelected
                            ? "bg-primary/5 border border-primary/20"
                            : "bg-muted/20 border border-transparent hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSaleSelection(sale.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium truncate ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                              {sale.client_name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{sale.property_type}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{sale.property_address}</span>
                            <span>•</span>
                            <span>{broker?.name || "N/A"}</span>
                            <span>•</span>
                            <span>{formatCurrency(Number(sale.vgv || 0))}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="p-4 bg-muted/20 border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Todas as <strong>{filteredSales.length}</strong> vendas filtradas serão exportadas.</span>
                </div>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("filters")}>
                ← Voltar
              </Button>
              <Button size="sm" onClick={() => setStep("fields")} disabled={useManualSelection && selectedSaleIds.size === 0}>
                Próximo →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Field Selection */}
        {step === "fields" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Selecione os campos para exportar.</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => selectAllFields(true)}>Todos</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => selectAllFields(false)}>Nenhum</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {fields.map(field => (
                <label
                  key={field.key}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                    field.checked
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-muted/20 border border-transparent hover:bg-muted/40"
                  }`}
                >
                  <Checkbox checked={field.checked} onCheckedChange={() => toggleField(field.key)} />
                  <span className={field.checked ? "text-foreground font-medium" : "text-muted-foreground"}>{field.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{selectedFields.length}</Badge>
              campos selecionados
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("select")}>← Voltar</Button>
              <Button size="sm" onClick={() => setStep("preview")} disabled={selectedFields.length === 0}>Próximo →</Button>
            </div>
          </div>
        )}

        {/* Step 4: Preview & Export */}
        {step === "preview" && (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/20 border-border/50 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Resumo da Exportação
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-background/60">
                  <p className="text-lg font-bold text-foreground">{summary.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendas</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/60">
                  <p className="text-sm font-bold text-primary">{formatCurrency(summary.totalVGV)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGV Total</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/60">
                  <p className="text-sm font-bold text-success">{formatCurrency(summary.totalVGC)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGC Total</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/60">
                  <p className="text-sm font-bold text-foreground">{selectedFields.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Campos</p>
                </div>
              </div>
            </Card>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Orientação do PDF</Label>
              <div className="flex gap-2">
                <Button variant={pdfOrientation === "portrait" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setPdfOrientation("portrait")}>Retrato</Button>
                <Button variant={pdfOrientation === "landscape" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setPdfOrientation("landscape")}>Paisagem</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={exportExcel} disabled={isExporting || salesToExport.length === 0} className="h-14 gap-3 bg-success hover:bg-success/90 text-success-foreground">
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : exportSuccess ? <CheckCircle2 className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                <div className="text-left">
                  <p className="font-semibold text-sm">Exportar Excel</p>
                  <p className="text-[10px] opacity-80">{getFileName("xlsx")}</p>
                </div>
              </Button>

              <Button onClick={exportPDF} disabled={isExporting || salesToExport.length === 0} className="h-14 gap-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : exportSuccess ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                <div className="text-left">
                  <p className="font-semibold text-sm">Exportar PDF</p>
                  <p className="text-[10px] opacity-80">{getFileName("pdf")}</p>
                </div>
              </Button>
            </div>

            {salesToExport.length === 0 && (
              <p className="text-sm text-center text-muted-foreground">Nenhuma venda para exportar.</p>
            )}

            <div className="flex justify-start">
              <Button variant="ghost" size="sm" onClick={() => setStep("fields")}>← Voltar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SalesExportDialog;
