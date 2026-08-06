import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Upload, FileSpreadsheet, FileText, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead, CreateLeadInput } from '@/hooks/useLeads';

interface Props {
  leads: Lead[];
  onImport: (input: CreateLeadInput) => Promise<unknown>;
}

const HEADERS = ['Nome', 'Telefone', 'E-mail', 'Origem', 'Campanha', 'Status', 'Responsável', 'Entrada', 'Observações'];

const toRow = (l: Lead) => [
  l.name ?? '',
  l.phone ?? '',
  l.email ?? '',
  l.source ?? '',
  l.campaign ?? '',
  l.status ?? '',
  l.responsible?.full_name ?? '',
  l.created_at ? format(new Date(l.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
  l.notes ?? '',
];

const norm = (s: string) =>
  s.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const pick = (row: Record<string, unknown>, keys: string[]) => {
  for (const k of Object.keys(row)) {
    if (keys.includes(norm(k))) {
      const v = row[k];
      if (v === null || v === undefined || v === '') continue;
      return String(v).trim();
    }
  }
  return '';
};

export const LeadsImportExport = ({ leads, onImport }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const exportExcel = () => {
    if (!leads.length) return toast.error('Nenhum lead para exportar');
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...leads.map(toRow)]);
    ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 26 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `leads-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success(`${leads.length} leads exportados em Excel`);
  };

  const exportPdf = () => {
    if (!leads.length) return toast.error('Nenhum lead para exportar');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Relatório de Leads', 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `${leads.length} registros · gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      40,
      58,
    );
    autoTable(doc, {
      startY: 74,
      head: [HEADERS.filter((h) => h !== 'Observações')],
      body: leads.map((l) => toRow(l).slice(0, 8)),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [2, 65, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [244, 247, 252] },
    });
    doc.save(`leads-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success(`${leads.length} leads exportados em PDF`);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nome', 'Telefone', 'E-mail', 'Origem', 'Campanha', 'Observações'],
      ['João da Silva', '5551999999999', 'joao@email.com', 'site', 'Campanha Verão', 'Interessado em 2 dormitórios'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo-importacao-leads.xlsx');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' });

      if (!rows.length) throw new Error('A planilha está vazia.');

      let ok = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = pick(row, ['nome', 'name', 'cliente', 'lead']);
        if (!name) {
          errors.push(`Linha ${i + 2}: nome não informado`);
          continue;
        }
        const source = norm(pick(row, ['origem', 'source', 'fonte'])) || 'manual';
        try {
          await onImport({
            name: name.slice(0, 200),
            phone: pick(row, ['telefone', 'phone', 'celular', 'whatsapp', 'fone']) || null,
            email: pick(row, ['email', 'e-mail']) || null,
            source: ['facebook', 'instagram', 'site', 'manual', 'whatsapp'].includes(source) ? source : 'manual',
            campaign: pick(row, ['campanha', 'campaign']) || null,
            notes: pick(row, ['observacoes', 'observacao', 'notes', 'obs']) || null,
          });
          ok++;
        } catch (err) {
          errors.push(`Linha ${i + 2}: ${(err as Error).message}`);
        }
      }

      if (ok) toast.success(`${ok} lead(s) importado(s) com sucesso`);
      if (errors.length) {
        console.error('Erros na importação de leads:', errors);
        toast.error(`${errors.length} linha(s) com erro: ${errors.slice(0, 3).join(' | ')}`);
      }
    } catch (err) {
      toast.error(`Erro ao importar: ${(err as Error).message}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        className="gap-2 flex-1 sm:flex-none"
        disabled={importing}
        onClick={() => fileRef.current?.click()}
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Importar
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          <DropdownMenuLabel>Exportar leads filtrados</DropdownMenuLabel>
          <DropdownMenuItem onClick={exportExcel} className="gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportPdf} className="gap-2">
            <FileText className="w-4 h-4 text-red-600" />
            PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={downloadTemplate} className="gap-2">
            <FileDown className="w-4 h-4" />
            Baixar modelo de importação
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
