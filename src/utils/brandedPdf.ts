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

interface BrandingContext {
  doc: jsPDF;
  pageW: number;
  pageH: number;
  primary: [number, number, number];
  secondary: [number, number, number];
  branding: OrganizationSettings | null;
  logoData: string | null;
  periodLabel: string;
}

async function initBrandingContext(
  branding: OrganizationSettings | null,
  periodLabel: string,
): Promise<BrandingContext> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const primary = hexToRgb(branding?.primary_color || '#3b82f6');
  const secondary = hexToRgb(branding?.secondary_color || '#1e293b');
  const logoUrl = branding?.logo_icon_url || branding?.logo_url || null;
  const logoData = logoUrl ? await loadImageAsDataUrl(logoUrl) : null;
  return { doc, pageW, pageH, primary, secondary, branding, logoData, periodLabel };
}

function drawCover(
  ctx: BrandingContext,
  reportTitle: string,
  kpis: { label: string; value: string }[],
  authorName?: string,
) {
  const { doc, pageW, pageH, primary, secondary, branding, logoData, periodLabel } = ctx;

  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
  doc.rect(0, pageH * 0.55, pageW, pageH * 0.45, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', pageW / 2 - 40, 140, 80, 80, undefined, 'FAST');
    } catch {
      /* ignore */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.text(reportTitle, pageW / 2, 280, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(branding?.organization_name || 'Imobiliária', pageW / 2, 310, { align: 'center' });

  doc.setFontSize(11);
  doc.text(periodLabel, pageW / 2, 340, { align: 'center' });

  // Bottom KPI card
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.95 }));
  doc.roundedRect(60, pageH - 200, pageW - 120, 130, 12, 12, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  const cols = Math.min(kpis.length, 3);
  const colW = (pageW - 120) / cols;
  kpis.slice(0, 3).forEach((kpi, i) => {
    const x = 60 + i * colW;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label.toUpperCase(), x + 30, pageH - 160);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(kpi.value, x + 30, pageH - 138);
  });

  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}${authorName ? ` por ${authorName}` : ''}`,
    pageW / 2,
    pageH - 90,
    { align: 'center' },
  );
}

function makeHeaderFooter(ctx: BrandingContext) {
  const { doc, pageW, pageH, primary, branding, logoData, periodLabel } = ctx;

  const drawHeader = (title: string) => {
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageW, 60, 'F');
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', 30, 14, 32, 32, undefined, 'FAST');
      } catch {
        /* ignore */
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

  return { drawHeader, drawFooter };
}

// =====================================================================
// 1. SALES report (existing)
// =====================================================================
export interface BrandedSalesReportOptions {
  sales: Sale[];
  brokers: Broker[];
  branding: OrganizationSettings | null;
  periodLabel: string;
  authorName?: string;
}

export async function generateBrandedSalesReport(opts: BrandedSalesReportOptions): Promise<jsPDF> {
  const { sales, brokers, branding, periodLabel, authorName } = opts;
  const ctx = await initBrandingContext(branding, periodLabel);
  const { doc, pageW, primary, secondary } = ctx;

  const validSales = sales.filter((s) => s.status !== 'distrato' && s.status !== 'cancelada');
  const totalVGV = validSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
  const totalVGC = validSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
  const ticketMedio = validSales.length > 0 ? totalVGV / validSales.length : 0;

  drawCover(ctx, 'Relatório de Vendas', [
    { label: 'VGV Total', value: formatCurrency(totalVGV) },
    { label: 'VGC Total', value: formatCurrency(totalVGC) },
    { label: 'Vendas', value: String(validSales.length) },
  ], authorName);

  const { drawHeader, drawFooter } = makeHeaderFooter(ctx);

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
    .map(([id, v]) => ({ name: brokers.find((b) => b.id === id)?.name || 'Sem corretor', ...v }))
    .sort((a, b) => b.vgv - a.vgv)
    .slice(0, 10);

  autoTable(doc, {
    startY: y + 5,
    head: [['#', 'Corretor', 'Vendas', 'VGV', 'VGC']],
    body: ranking.map((r, i) => [`${i + 1}º`, r.name, String(r.count), formatCurrency(r.vgv), formatCurrency(r.vgc)]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });
  drawFooter();

  doc.addPage();
  drawHeader('Vendas detalhadas');

  autoTable(doc, {
    startY: 80,
    head: [['Data', 'Cliente', 'Corretor', 'Empreendimento', 'VGV', 'Status']],
    body: validSales
      .slice()
      .sort((a, b) => (b.sale_date || '').localeCompare(a.sale_date || ''))
      .map((s) => [
        s.sale_date ? format(new Date(s.sale_date.substring(0, 10) + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '-',
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
      if (doc.getCurrentPageInfo().pageNumber > 2) drawHeader('Vendas detalhadas');
      drawFooter();
    },
  });

  return doc;
}

// =====================================================================
// 2. NEGOTIATIONS report
// =====================================================================
export interface NegotiationLike {
  client_name: string;
  client_phone?: string | null;
  property_address: string;
  property_type?: string;
  negotiated_value: number;
  temperature?: string;
  origem?: string;
  status?: string;
  start_date?: string;
  broker_id: string;
  stage?: { title?: string; color?: string } | null;
}

export interface BrandedNegotiationsReportOptions {
  negotiations: NegotiationLike[];
  lostNegotiations?: NegotiationLike[];
  brokers: Broker[];
  branding: OrganizationSettings | null;
  periodLabel: string;
  authorName?: string;
}

export async function generateBrandedNegotiationsReport(
  opts: BrandedNegotiationsReportOptions,
): Promise<jsPDF> {
  const { negotiations, lostNegotiations = [], brokers, branding, periodLabel, authorName } = opts;
  const ctx = await initBrandingContext(branding, periodLabel);
  const { doc, pageW, primary, secondary } = ctx;

  const totalValor = negotiations.reduce((s, n) => s + Number(n.negotiated_value || 0), 0);
  const valorPerdido = lostNegotiations.reduce((s, n) => s + Number(n.negotiated_value || 0), 0);

  drawCover(ctx, 'Relatório de Negociações', [
    { label: 'Em Andamento', value: String(negotiations.length) },
    { label: 'Valor em Pipeline', value: formatCurrency(totalValor) },
    { label: 'Perdidas', value: String(lostNegotiations.length) },
  ], authorName);

  const { drawHeader, drawFooter } = makeHeaderFooter(ctx);

  // Stage breakdown
  doc.addPage();
  drawHeader('Pipeline por etapa');

  const byStage = new Map<string, { count: number; valor: number }>();
  negotiations.forEach((n) => {
    const key = n.stage?.title || n.status || 'Sem etapa';
    const cur = byStage.get(key) || { count: 0, valor: 0 };
    cur.count += 1;
    cur.valor += Number(n.negotiated_value || 0);
    byStage.set(key, cur);
  });

  autoTable(doc, {
    startY: 100,
    head: [['Etapa', 'Negociações', 'Valor Total']],
    body: Array.from(byStage.entries())
      .sort((a, b) => b[1].valor - a[1].valor)
      .map(([stage, v]) => [stage, String(v.count), formatCurrency(v.valor)]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });

  // Top brokers
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Top corretores por valor em pipeline', 30, finalY + 30);

  const byBroker = new Map<string, { count: number; valor: number }>();
  negotiations.forEach((n) => {
    const cur = byBroker.get(n.broker_id) || { count: 0, valor: 0 };
    cur.count += 1;
    cur.valor += Number(n.negotiated_value || 0);
    byBroker.set(n.broker_id, cur);
  });

  autoTable(doc, {
    startY: finalY + 40,
    head: [['#', 'Corretor', 'Negociações', 'Pipeline']],
    body: Array.from(byBroker.entries())
      .map(([id, v]) => ({ name: brokers.find((b) => b.id === id)?.name || 'Sem corretor', ...v }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)
      .map((r, i) => [`${i + 1}º`, r.name, String(r.count), formatCurrency(r.valor)]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });
  drawFooter();

  // Detailed
  doc.addPage();
  drawHeader('Negociações em andamento');

  autoTable(doc, {
    startY: 80,
    head: [['Cliente', 'Corretor', 'Etapa', 'Valor', 'Temperatura', 'Origem']],
    body: negotiations
      .slice()
      .sort((a, b) => Number(b.negotiated_value || 0) - Number(a.negotiated_value || 0))
      .map((n) => [
        n.client_name,
        brokers.find((b) => b.id === n.broker_id)?.name || '-',
        n.stage?.title || n.status || '-',
        formatCurrency(Number(n.negotiated_value || 0)),
        n.temperature || '-',
        n.origem || '-',
      ]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 80, bottom: 50, left: 30, right: 30 },
    didDrawPage: () => {
      if (doc.getCurrentPageInfo().pageNumber > 3) drawHeader('Negociações em andamento');
      drawFooter();
    },
  });

  if (lostNegotiations.length > 0) {
    doc.addPage();
    drawHeader('Negociações perdidas');
    autoTable(doc, {
      startY: 80,
      head: [['Cliente', 'Corretor', 'Valor', 'Motivo']],
      body: lostNegotiations.map((n) => [
        n.client_name,
        brokers.find((b) => b.id === n.broker_id)?.name || '-',
        formatCurrency(Number(n.negotiated_value || 0)),
        (n as any).loss_reason || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [180, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
      alternateRowStyles: { fillColor: [253, 246, 246] },
      margin: { top: 80, bottom: 50, left: 30, right: 30 },
      didDrawPage: () => drawFooter(),
    });
  }

  return doc;
}

// =====================================================================
// 3. FOLLOW-UP report
// =====================================================================
export interface FollowUpLike {
  client_name: string;
  client_phone?: string | null;
  property_interest?: string | null;
  estimated_vgv: number;
  next_contact_date?: string | null;
  status: string;
  origem?: string;
  broker_id: string;
}

export interface BrandedFollowUpReportOptions {
  followUps: FollowUpLike[];
  brokers: Broker[];
  branding: OrganizationSettings | null;
  periodLabel: string;
  statusLabel?: (status: string) => string;
  authorName?: string;
}

export async function generateBrandedFollowUpReport(
  opts: BrandedFollowUpReportOptions,
): Promise<jsPDF> {
  const { followUps, brokers, branding, periodLabel, statusLabel, authorName } = opts;
  const ctx = await initBrandingContext(branding, periodLabel);
  const { doc, primary, secondary } = ctx;

  const totalVGV = followUps.reduce((s, f) => s + Number(f.estimated_vgv || 0), 0);
  const ativos = followUps.filter((f) => f.status !== 'perdido' && f.status !== 'convertido').length;

  drawCover(ctx, 'Relatório de Follow-up', [
    { label: 'Total de Clientes', value: String(followUps.length) },
    { label: 'VGV Estimado', value: formatCurrency(totalVGV) },
    { label: 'Em Acompanhamento', value: String(ativos) },
  ], authorName);

  const { drawHeader, drawFooter } = makeHeaderFooter(ctx);

  doc.addPage();
  drawHeader('Distribuição por status');

  const byStatus = new Map<string, { count: number; vgv: number }>();
  followUps.forEach((f) => {
    const k = statusLabel ? statusLabel(f.status) : f.status;
    const cur = byStatus.get(k) || { count: 0, vgv: 0 };
    cur.count += 1;
    cur.vgv += Number(f.estimated_vgv || 0);
    byStatus.set(k, cur);
  });

  autoTable(doc, {
    startY: 100,
    head: [['Status', 'Clientes', 'VGV Estimado']],
    body: Array.from(byStatus.entries())
      .sort((a, b) => b[1].vgv - a[1].vgv)
      .map(([k, v]) => [k, String(v.count), formatCurrency(v.vgv)]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });
  drawFooter();

  doc.addPage();
  drawHeader('Clientes detalhados');

  autoTable(doc, {
    startY: 80,
    head: [['Cliente', 'Telefone', 'Corretor', 'Interesse', 'VGV', 'Status', 'Próx. Contato']],
    body: followUps
      .slice()
      .sort((a, b) => Number(b.estimated_vgv || 0) - Number(a.estimated_vgv || 0))
      .map((f) => [
        f.client_name,
        f.client_phone || '-',
        brokers.find((b) => b.id === f.broker_id)?.name || '-',
        f.property_interest || '-',
        formatCurrency(Number(f.estimated_vgv || 0)),
        statusLabel ? statusLabel(f.status) : f.status,
        f.next_contact_date ? format(new Date(f.next_contact_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      ]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 80, bottom: 50, left: 30, right: 30 },
    didDrawPage: () => {
      if (doc.getCurrentPageInfo().pageNumber > 2) drawHeader('Clientes detalhados');
      drawFooter();
    },
  });

  return doc;
}

// =====================================================================
// 4. COMMISSIONS report
// =====================================================================
export interface CommissionLike {
  broker_id: string | null;
  base_value: number;
  commission_percentage: number;
  commission_value: number;
  commission_type?: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  payment_date?: string | null;
}

export interface BrandedCommissionsReportOptions {
  commissions: CommissionLike[];
  brokers: Broker[];
  branding: OrganizationSettings | null;
  periodLabel: string;
  authorName?: string;
}

export async function generateBrandedCommissionsReport(
  opts: BrandedCommissionsReportOptions,
): Promise<jsPDF> {
  const { commissions, brokers, branding, periodLabel, authorName } = opts;
  const ctx = await initBrandingContext(branding, periodLabel);
  const { doc, primary, secondary } = ctx;

  const totalComissao = commissions.reduce((s, c) => s + Number(c.commission_value || 0), 0);
  const recebidas = commissions.filter((c) => c.status === 'recebida' || c.status === 'paga');
  const totalRecebido = recebidas.reduce((s, c) => s + Number(c.commission_value || 0), 0);
  const pendentes = commissions.filter((c) => c.status === 'pendente');
  const totalPendente = pendentes.reduce((s, c) => s + Number(c.commission_value || 0), 0);

  drawCover(ctx, 'Relatório de Comissões', [
    { label: 'Total Comissão', value: formatCurrency(totalComissao) },
    { label: 'Recebido', value: formatCurrency(totalRecebido) },
    { label: 'Pendente', value: formatCurrency(totalPendente) },
  ], authorName);

  const { drawHeader, drawFooter } = makeHeaderFooter(ctx);

  // Per broker
  doc.addPage();
  drawHeader('Comissões por corretor');

  const byBroker = new Map<string, { count: number; total: number; recebido: number; pendente: number }>();
  commissions.forEach((c) => {
    const k = c.broker_id || '—';
    const cur = byBroker.get(k) || { count: 0, total: 0, recebido: 0, pendente: 0 };
    cur.count += 1;
    cur.total += Number(c.commission_value || 0);
    if (c.status === 'recebida' || c.status === 'paga') cur.recebido += Number(c.commission_value || 0);
    if (c.status === 'pendente') cur.pendente += Number(c.commission_value || 0);
    byBroker.set(k, cur);
  });

  autoTable(doc, {
    startY: 100,
    head: [['Corretor', 'Qtd', 'Total', 'Recebido', 'Pendente']],
    body: Array.from(byBroker.entries())
      .map(([id, v]) => ({ name: brokers.find((b) => b.id === id)?.name || 'Sem corretor', ...v }))
      .sort((a, b) => b.total - a.total)
      .map((r) => [r.name, String(r.count), formatCurrency(r.total), formatCurrency(r.recebido), formatCurrency(r.pendente)]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });
  drawFooter();

  // Detailed
  doc.addPage();
  drawHeader('Comissões detalhadas');

  autoTable(doc, {
    startY: 80,
    head: [['Corretor', 'Descrição', 'Tipo', 'Base', '%', 'Comissão', 'Status', 'Vencimento']],
    body: commissions
      .slice()
      .sort((a, b) => (b.due_date || '').localeCompare(a.due_date || ''))
      .map((c) => [
        brokers.find((b) => b.id === c.broker_id)?.name || '-',
        c.description || '-',
        c.commission_type || '-',
        formatCurrency(Number(c.base_value || 0)),
        `${Number(c.commission_percentage || 0).toFixed(2)}%`,
        formatCurrency(Number(c.commission_value || 0)),
        c.status,
        c.due_date ? format(new Date(c.due_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      ]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 80, bottom: 50, left: 30, right: 30 },
    didDrawPage: () => {
      if (doc.getCurrentPageInfo().pageNumber > 2) drawHeader('Comissões detalhadas');
      drawFooter();
    },
  });

  return doc;
}

// =====================================================================
// 5. PIPELINE / STATUS DE VENDAS report
// =====================================================================
export interface PipelineStageLike {
  id: string;
  title: string;
  color?: string;
}

export interface PipelineCardLike {
  clientName: string;
  propertyType?: string;
  propertyAddress?: string;
  brokerName: string;
  value: number;
  vgc?: number;
  tipo?: string;
  saleDate?: string;
  stageId: string;
  status?: string;
}

export interface BrandedPipelineReportOptions {
  stages: PipelineStageLike[];
  cards: PipelineCardLike[];
  branding: OrganizationSettings | null;
  periodLabel: string;
  authorName?: string;
}

export async function generateBrandedPipelineReport(
  opts: BrandedPipelineReportOptions,
): Promise<jsPDF> {
  const { stages, cards, branding, periodLabel, authorName } = opts;
  const ctx = await initBrandingContext(branding, periodLabel);
  const { doc, pageW, primary, secondary } = ctx;

  const totalVGV = cards.reduce((s, c) => s + Number(c.value || 0), 0);
  const totalVGC = cards.reduce((s, c) => s + Number(c.vgc || 0), 0);
  const ticketMedio = cards.length > 0 ? totalVGV / cards.length : 0;

  drawCover(ctx, 'Status de Vendas', [
    { label: 'Total Pipeline', value: String(cards.length) },
    { label: 'VGV Total', value: formatCurrency(totalVGV) },
    { label: 'VGC Total', value: formatCurrency(totalVGC) },
  ], authorName);

  const { drawHeader, drawFooter } = makeHeaderFooter(ctx);

  // Stage summary
  doc.addPage();
  drawHeader('Resumo por etapa do funil');

  autoTable(doc, {
    startY: 100,
    head: [['Etapa', 'Vendas', 'VGV', 'VGC', '% Pipeline']],
    body: stages.map((stage) => {
      const stageCards = cards.filter((c) => c.stageId === stage.id);
      const vgv = stageCards.reduce((s, c) => s + Number(c.value || 0), 0);
      const vgc = stageCards.reduce((s, c) => s + Number(c.vgc || 0), 0);
      const pct = totalVGV > 0 ? ((vgv / totalVGV) * 100).toFixed(1) + '%' : '0%';
      return [stage.title, String(stageCards.length), formatCurrency(vgv), formatCurrency(vgc), pct];
    }),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Ticket Médio: ${formatCurrency(ticketMedio)}`, 30, finalY + 25);
  drawFooter();

  // Detail per stage
  stages.forEach((stage) => {
    const stageCards = cards.filter((c) => c.stageId === stage.id);
    if (stageCards.length === 0) return;

    doc.addPage();
    drawHeader(`Etapa: ${stage.title}`);

    // colored stage strip
    const stageColor = hexToRgb(stage.color || '#3b82f6');
    doc.setFillColor(stageColor[0], stageColor[1], stageColor[2]);
    doc.rect(0, 60, pageW, 4, 'F');

    autoTable(doc, {
      startY: 85,
      head: [['Data', 'Cliente', 'Corretor', 'Imóvel', 'Tipo', 'VGV', 'Status']],
      body: stageCards
        .slice()
        .sort((a, b) => (b.saleDate || '').localeCompare(a.saleDate || ''))
        .map((c) => [
          c.saleDate ? format(new Date(c.saleDate), 'dd/MM/yyyy', { locale: ptBR }) : '-',
          c.clientName || '-',
          c.brokerName || '-',
          c.propertyAddress || c.propertyType || '-',
          c.tipo || '-',
          formatCurrency(Number(c.value || 0)),
          c.status || '-',
        ]),
      theme: 'striped',
      headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 85, bottom: 50, left: 30, right: 30 },
      didDrawPage: () => {
        if (doc.getCurrentPageInfo().pageNumber > 2) drawHeader(`Etapa: ${stage.title}`);
        drawFooter();
      },
    });
  });

  return doc;
}
