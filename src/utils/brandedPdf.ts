import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatting';
import type { Sale, Broker } from '@/contexts/DataContext';
import type { OrganizationSettings } from '@/hooks/useOrganizationSettings';

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = (hex || '#3b82f6').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export interface BrandedSalesReportOptions {
  sales: Sale[];
  brokers: Broker[];
  branding: OrganizationSettings | null;
  periodLabel: string;
  authorName?: string;
}

export async function generateBrandedSalesReport(opts: BrandedSalesReportOptions): Promise<jsPDF> {
  const { sales, brokers, branding, periodLabel, authorName } = opts;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const primary = hexToRgb(branding?.primary_color || '#3b82f6');
  const secondary = hexToRgb(branding?.secondary_color || '#1e293b');

  const logoUrl = branding?.logo_icon_url || branding?.logo_url || null;
  const logoData = logoUrl ? await loadImageAsDataUrl(logoUrl) : null;

  // ===== COVER PAGE =====
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Subtle overlay
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
  doc.rect(0, pageH * 0.55, pageW, pageH * 0.45, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', pageW / 2 - 40, 140, 80, 80, undefined, 'FAST');
    } catch {
      // ignore image errors
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.text('Relatório de Vendas', pageW / 2, 280, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(branding?.organization_name || 'Imobiliária', pageW / 2, 310, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(periodLabel, pageW / 2, 340, { align: 'center' });

  // Bottom info card
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.95 }));
  doc.roundedRect(60, pageH - 200, pageW - 120, 130, 12, 12, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  const validSales = sales.filter((s) => s.status !== 'distrato' && s.status !== 'cancelada');
  const totalVGV = validSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
  const totalVGC = validSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
  const ticketMedio = validSales.length > 0 ? totalVGV / validSales.length : 0;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('VGV TOTAL', 90, pageH - 160);
  doc.text('VGC TOTAL', pageW / 2 - 40, pageH - 160);
  doc.text('VENDAS', pageW - 160, pageH - 160);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(formatCurrency(totalVGV), 90, pageH - 138);
  doc.text(formatCurrency(totalVGC), pageW / 2 - 40, pageH - 138);
  doc.text(String(validSales.length), pageW - 160, pageH - 138);

  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}${authorName ? ` por ${authorName}` : ''}`,
    pageW / 2,
    pageH - 90,
    { align: 'center' }
  );

  // ===== HEADER/FOOTER for content pages =====
  const drawHeader = (title: string) => {
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageW, 60, 'F');
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', 30, 14, 32, 32, undefined, 'FAST');
      } catch {
        // ignore
      }
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(branding?.organization_name || 'Relatório', logoData ? 72 : 30, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(title, logoData ? 72 : 30, 48);
    doc.setFontSize(9);
    doc.text(periodLabel, pageW - 30, 32, { align: 'right' });
  };

  const drawFooter = () => {
    const pageNum = doc.getCurrentPageInfo().pageNumber;
    doc.setDrawColor(220, 220, 220);
    doc.line(30, pageH - 30, pageW - 30, pageH - 30);
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(branding?.organization_name || '', 30, pageH - 16);
    doc.text(`Página ${pageNum}`, pageW - 30, pageH - 16, { align: 'right' });
  };

  // ===== PAGE 2: METRICS SUMMARY =====
  doc.addPage();
  drawHeader('Resumo Executivo');

  let y = 100;
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Métricas do período', 30, y);
  y += 25;

  const kpis = [
    { label: 'VGV Total', value: formatCurrency(totalVGV) },
    { label: 'VGC / Comissão', value: formatCurrency(totalVGC) },
    { label: 'Vendas Realizadas', value: String(validSales.length) },
    { label: 'Ticket Médio', value: formatCurrency(ticketMedio) },
    { label: 'Distratos', value: String(sales.filter((s) => s.status === 'distrato').length) },
    { label: 'Captações', value: String(sales.filter((s) => s.tipo === 'captacao').length) },
  ];

  const cardW = (pageW - 80) / 3;
  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 30 + col * (cardW + 10);
    const cardY = y + row * 80;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardW, 70, 8, 8, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label.toUpperCase(), x + 12, cardY + 20);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(kpi.value, x + 12, cardY + 45);
  });
  y += 175;

  // Top brokers ranking
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Top corretores do período', 30, y);
  y += 10;

  const byBroker = new Map<string, { vgv: number; vgc: number; count: number }>();
  validSales.forEach((s) => {
    if (!s.broker_id) return;
    const cur = byBroker.get(s.broker_id) || { vgv: 0, vgc: 0, count: 0 };
    cur.vgv += Number(s.vgv || 0);
    cur.vgc += Number(s.vgc || 0);
    cur.count += 1;
    byBroker.set(s.broker_id, cur);
  });
  const ranking = Array.from(byBroker.entries())
    .map(([id, v]) => ({
      name: brokers.find((b) => b.id === id)?.name || 'Sem corretor',
      ...v,
    }))
    .sort((a, b) => b.vgv - a.vgv)
    .slice(0, 10);

  autoTable(doc, {
    startY: y + 5,
    head: [['#', 'Corretor', 'Vendas', 'VGV', 'VGC']],
    body: ranking.map((r, i) => [
      `${i + 1}º`,
      r.name,
      String(r.count),
      formatCurrency(r.vgv),
      formatCurrency(r.vgc),
    ]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });
  drawFooter();

  // ===== PAGE 3+: DETAILED SALES LIST =====
  doc.addPage();
  drawHeader('Vendas detalhadas');

  autoTable(doc, {
    startY: 80,
    head: [['Data', 'Cliente', 'Corretor', 'Empreendimento', 'VGV', 'Status']],
    body: validSales
      .slice()
      .sort((a, b) => (b.sale_date || '').localeCompare(a.sale_date || ''))
      .map((s) => [
        s.sale_date ? format(new Date(s.sale_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        s.client_name || '-',
        brokers.find((b) => b.id === s.broker_id)?.name || '-',
        s.property_address || '-',
        formatCurrency(Number(s.vgv || 0)),
        s.status || '-',
      ]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 80, bottom: 50, left: 30, right: 30 },
    didDrawPage: () => {
      if (doc.getCurrentPageInfo().pageNumber > 2) {
        drawHeader('Vendas detalhadas');
      }
      drawFooter();
    },
  });

  return doc;
}
