import { useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useActivities } from "@/hooks/useActivities";
import { useGoals } from "@/hooks/useGoals";
import { formatCurrency, parseDateSafe } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Broker } from "@/contexts/DataContext";

interface Props {
  broker: Broker;
  month: number;
  year: number;
  onComplete: () => void;
  onError: () => void;
}

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export const BrokerReportRenderer = ({ broker, month, year, onComplete, onError }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { negotiations } = useNegotiations();
  const { activities } = useActivities();
  const { goals } = useGoals();

  const brokerSales = useMemo(() => {
    return sales.filter(s => {
      if (s.broker_id !== broker.id) return false;
      const p = parseDateSafe(s.sale_date);
      return p.month === month && p.year === year;
    });
  }, [sales, broker.id, month, year]);

  const brokerNegotiations = useMemo(() => {
    return negotiations.filter(n => {
      if (n.broker_id !== broker.id) return false;
      const p = parseDateSafe(n.start_date);
      return p.month === month && p.year === year;
    });
  }, [negotiations, broker.id, month, year]);

  const brokerActivities = useMemo(() => {
    return activities.filter(a => {
      if (a.broker_id !== broker.id) return false;
      const p = parseDateSafe(a.activity_date);
      return p.month === month && p.year === year;
    });
  }, [activities, broker.id, month, year]);

  const brokerGoals = useMemo(() => {
    return goals.filter(g => g.broker_id === broker.id || g.assigned_to === broker.user_id);
  }, [goals, broker.id, broker.user_id]);

  // KPIs
  const totalVGV = brokerSales.reduce((s, sale) => s + Number(sale.vgv || 0), 0);
  const totalVGC = brokerSales.reduce((s, sale) => s + Number(sale.vgc || 0), 0);
  const totalSales = brokerSales.filter(s => s.tipo === 'venda').length;
  const totalCaptacoes = brokerSales.filter(s => s.tipo === 'captacao').length;
  const totalNegotiations = brokerNegotiations.length;
  const totalActivities = brokerActivities.length;
  const conversionRate = totalNegotiations > 0 ? ((totalSales / totalNegotiations) * 100) : 0;

  // Ranking position
  const rankingData = useMemo(() => {
    const allBrokerSales = brokers
      .filter(b => b.status === 'ativo')
      .map(b => {
        const bSales = sales.filter(s => {
          if (s.broker_id !== b.id) return false;
          const p = parseDateSafe(s.sale_date);
          return p.month === month && p.year === year;
        });
        const vgc = bSales.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
        return { id: b.id, name: b.name, vgc };
      })
      .sort((a, b) => b.vgc - a.vgc);
    
    const position = allBrokerSales.findIndex(b => b.id === broker.id) + 1;
    const total = allBrokerSales.length;
    const avgVGC = allBrokerSales.length > 0 ? allBrokerSales.reduce((s, b) => s + b.vgc, 0) / allBrokerSales.length : 0;
    return { position, total, avgVGC };
  }, [brokers, sales, broker.id, month, year]);

  // Weekly sales chart data
  const weeklyData = useMemo(() => {
    const weeks: { label: string; count: number; vgv: number }[] = [];
    for (let w = 1; w <= 4; w++) {
      const startDay = (w - 1) * 7 + 1;
      const endDay = w === 4 ? 31 : w * 7;
      const weekSales = brokerSales.filter(s => {
        const p = parseDateSafe(s.sale_date);
        return p.day >= startDay && p.day <= endDay;
      });
      weeks.push({
        label: `Sem ${w}`,
        count: weekSales.length,
        vgv: weekSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0),
      });
    }
    return weeks;
  }, [brokerSales]);

  // Insights
  const insights = useMemo(() => {
    const msgs: string[] = [];
    if (totalVGC > rankingData.avgVGC) {
      msgs.push(`🔥 Performance acima da média da equipe em ${((totalVGC / (rankingData.avgVGC || 1) - 1) * 100).toFixed(0)}%`);
    } else if (rankingData.avgVGC > 0) {
      msgs.push(`📊 Performance ${((1 - totalVGC / rankingData.avgVGC) * 100).toFixed(0)}% abaixo da média da equipe`);
    }
    if (rankingData.position === 1) msgs.push("🏆 Líder do ranking no período!");
    if (rankingData.position <= 3 && rankingData.position > 1) msgs.push(`🥇 Top ${rankingData.position} do ranking!`);
    if (conversionRate > 30) msgs.push(`✅ Excelente taxa de conversão: ${conversionRate.toFixed(1)}%`);
    if (totalActivities > 20) msgs.push(`💪 Alta produtividade: ${totalActivities} atividades no período`);
    if (msgs.length === 0) msgs.push("📈 Continue acompanhando para gerar insights mais precisos.");
    return msgs;
  }, [totalVGC, rankingData, conversionRate, totalActivities]);

  // Generate PDF after render
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const el = containerRef.current;
        if (!el) { onError(); return; }

        const sections = Array.from(el.querySelectorAll('[data-pdf-section]')) as HTMLElement[];
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const A4_W = 210, A4_H = 297, M = 12;
        const CW = A4_W - M * 2;
        let curY = M;

        for (const section of sections) {
          const canvas = await html2canvas(section, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          });
          const sf = CW / canvas.width;
          const hMM = canvas.height * sf;
          
          if (hMM > (A4_H - M - curY) && curY > M) {
            pdf.addPage();
            curY = M;
          }
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', M, curY, CW, hMM);
          curY += hMM + 4;
        }

        const monthName = MONTHS[month - 1] || '';
        const safeName = broker.name.replace(/\s+/g, '-').toLowerCase();
        pdf.save(`relatorio-corretor-${safeName}-${monthName.toLowerCase()}-${year}.pdf`);
        onComplete();
      } catch (e) {
        console.error('PDF generation error:', e);
        onError();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const periodLabel = `${MONTHS[month - 1]} ${year}`;
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const maxWeeklyVGV = Math.max(...weeklyData.map(w => w.vgv), 1);

  return createPortal(
    <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
      <div ref={containerRef} style={{ width: '794px', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#f8fafc' }}>
        
        {/* HEADER */}
        <div data-pdf-section style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', padding: '32px', borderRadius: '12px', margin: '8px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Relatório Individual</h1>
              <p style={{ fontSize: '14px', opacity: 0.85, margin: '4px 0 0' }}>{periodLabel} • Gerado em {generatedAt}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {broker.avatar_url && (
                <img src={broker.avatar_url} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', objectFit: 'cover' }} crossOrigin="anonymous" />
              )}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{broker.name}</p>
                <p style={{ fontSize: '13px', opacity: 0.8, margin: '2px 0 0' }}>{broker.email}</p>
                {broker.phone && <p style={{ fontSize: '13px', opacity: 0.8, margin: '2px 0 0' }}>{broker.phone}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div data-pdf-section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '0 8px', margin: '8px 0' }}>
          {[
            { label: 'VGV Total', value: formatCurrency(totalVGV), color: '#2563eb', bg: '#eff6ff' },
            { label: 'VGC Total', value: formatCurrency(totalVGC), color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Vendas', value: String(totalSales), color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Negociações', value: String(totalNegotiations), color: '#ea580c', bg: '#fff7ed' },
            { label: 'Atividades', value: String(totalActivities), color: '#0891b2', bg: '#ecfeff' },
            { label: 'Conversão', value: `${conversionRate.toFixed(1)}%`, color: '#be185d', bg: '#fdf2f8' },
          ].map((kpi, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 500 }}>{kpi.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 800, color: kpi.color, margin: '6px 0 0' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* RANKING + INSIGHTS */}
        <div data-pdf-section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 8px', margin: '8px 0' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>🏆 Ranking na Equipe</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: rankingData.position <= 3 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: rankingData.position <= 3 ? '#fff' : '#64748b' }}>{rankingData.position}º</span>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>de {rankingData.total} corretores</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Média equipe: {formatCurrency(rankingData.avgVGC)}</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>💡 Insights</h3>
            {insights.map((msg, i) => (
              <p key={i} style={{ fontSize: '12px', color: '#475569', margin: '6px 0', lineHeight: '1.5' }}>{msg}</p>
            ))}
          </div>
        </div>

        {/* WEEKLY CHART */}
        <div data-pdf-section style={{ background: '#fff', borderRadius: '10px', padding: '20px', margin: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px', color: '#1e293b' }}>📊 Vendas por Semana</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', height: '120px' }}>
            {weeklyData.map((w, i) => {
              const barH = Math.max((w.vgv / maxWeeklyVGV) * 100, 4);
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px' }}>{formatCurrency(w.vgv)}</p>
                  <div style={{ height: `${barH}px`, background: 'linear-gradient(180deg, #3b82f6, #2563eb)', borderRadius: '6px 6px 0 0', margin: '0 auto', width: '60%' }} />
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0', fontWeight: 600 }}>{w.label}</p>
                  <p style={{ fontSize: '10px', color: '#cbd5e1', margin: '2px 0 0' }}>{w.count} venda{w.count !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SALES TABLE */}
        {brokerSales.length > 0 && (
          <div data-pdf-section style={{ background: '#fff', borderRadius: '10px', padding: '20px', margin: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>📋 Vendas no Período</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Data', 'Cliente', 'Empreendimento', 'Tipo', 'VGV', 'VGC'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokerSales.slice(0, 15).map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>{format(new Date(s.sale_date + 'T12:00:00'), 'dd/MM/yy')}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>{s.client_name}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>{s.property_address}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: s.tipo === 'captacao' ? '#fef3c7' : '#dbeafe', color: s.tipo === 'captacao' ? '#92400e' : '#1e40af' }}>
                        {s.tipo === 'captacao' ? 'Captação' : 'Venda'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(Number(s.vgv || 0))}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{formatCurrency(Number(s.vgc || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {brokerSales.length > 15 && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '8px 0 0' }}>+{brokerSales.length - 15} vendas adicionais</p>}
          </div>
        )}

        {/* ACTIVITIES TABLE */}
        {brokerActivities.length > 0 && (
          <div data-pdf-section style={{ background: '#fff', borderRadius: '10px', padding: '20px', margin: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>📌 Atividades no Período</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Data', 'Tipo', 'Cliente', 'Referência', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokerActivities.slice(0, 15).map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>{format(new Date(a.activity_date + 'T12:00:00'), 'dd/MM/yy')}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>{a.activity_type}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>{a.client_name || '-'}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>{a.property_reference || '-'}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: a.status === 'concluido' ? '#dcfce7' : '#fef9c3', color: a.status === 'concluido' ? '#166534' : '#854d0e' }}>
                        {a.status === 'concluido' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {brokerActivities.length > 15 && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '8px 0 0' }}>+{brokerActivities.length - 15} atividades adicionais</p>}
          </div>
        )}

        {/* GOALS */}
        {brokerGoals.length > 0 && (
          <div data-pdf-section style={{ background: '#fff', borderRadius: '10px', padding: '20px', margin: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>🎯 Metas</h3>
            {brokerGoals.slice(0, 5).map(g => {
              const pct = g.target_value > 0 ? Math.min((g.current_value / g.target_value) * 100, 100) : 0;
              const barColor = pct >= 100 ? '#16a34a' : pct >= 50 ? '#2563eb' : '#f59e0b';
              return (
                <div key={g.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{g.title}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Atual: {formatCurrency(g.current_value)}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Meta: {formatCurrency(g.target_value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div data-pdf-section style={{ textAlign: 'center', padding: '16px 8px', margin: '0 8px' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8' }}>Relatório gerado automaticamente • {periodLabel} • Confidencial</p>
        </div>
      </div>
    </div>,
    document.body
  );
};
