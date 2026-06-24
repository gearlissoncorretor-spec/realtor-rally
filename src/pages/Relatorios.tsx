import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Users, 
  PieChart,
  Target,
  Map as MapIcon,
  Info,
  ArrowUpRight,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useLeads } from "@/hooks/useLeads";
import { useNegotiations } from "@/hooks/useNegotiations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PeriodFilter from "@/components/PeriodFilter";
import { formatCurrency, parseDateSafe } from "@/utils/formatting";
import { matchesPeriod, type DateRange } from "@/utils/periodFilter";
import BrokerReportDialog from "@/components/reports/BrokerReportDialog";
import { OriginAnalyticsDashboard } from "@/components/dashboards/OriginAnalyticsDashboard";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, Line
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for leaflet icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Relatorios = () => {
  const { toast } = useToast();
  const { sales, loading: salesLoading } = useSales();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { leads, loading: leadsLoading } = useLeads();
  const { negotiations } = useNegotiations();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("pdf");

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (!sale.sale_date) return false;
      if (sale.tipo === 'captacao') return false;
      
      const { month: saleMonth, year: saleYear } = parseDateSafe(sale.sale_date);
      
      const matchesMonth = selectedMonth === 0 || saleMonth === selectedMonth;
      const matchesYear = selectedYear === 0 || saleYear === selectedYear;
      
      return matchesMonth && matchesYear;
    });
  }, [sales, selectedMonth, selectedYear]);

  // --- Revenue Forecasting Logic ---
  const forecastData = useMemo(() => {
    if (salesLoading || sales.length === 0) return [];

    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();
    
    // Last 12 months history
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyRevenue[key] = 0;
    }

    sales.forEach(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at);
      const key = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += Number(sale.vgv || 0);
      }
    });

    const history = Object.entries(monthlyRevenue).map(([date, value]) => ({
      date,
      value,
      type: 'Histórico' as const
    }));

    // Simple Forecasting (Moving Average of last 3 months)
    const last3Months = history.slice(-3);
    const avgRevenue = last3Months.reduce((sum, item) => sum + item.value, 0) / (last3Months.length || 1);

    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      forecast.push({
        date: key,
        value: avgRevenue * (1 + (i * 0.05)),
        type: 'Previsão' as const
      });
    }

    return [...history, ...forecast];
  }, [sales, salesLoading]);

  // --- Map Data Logic ---
  const mapPoints = useMemo(() => {
    return sales
      .filter(s => {
        const lat = parseFloat(s.latitude || "");
        const lng = parseFloat(s.longitude || "");
        return !isNaN(lat) && !isNaN(lng);
      })
      .map(s => ({
        id: s.id,
        lat: parseFloat(s.latitude!),
        lng: parseFloat(s.longitude!),
        client: s.client_name,
        value: s.vgv,
        address: s.property_address
      }));
  }, [sales]);

  const mapCenter: [number, number] = mapPoints.length > 0 
    ? [mapPoints[0].lat, mapPoints[0].lng] 
    : [-15.7942, -47.8822];

  // --- PDF Handlers ---
  const generateSalesReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text("Relatório de Vendas", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: "center" });
    
    const totalVGV = filteredSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
    const totalVGC = filteredSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
    const totalSalesCount = filteredSales.length;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumo do Período", 14, 45);
    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${totalSalesCount}`, 14, 52);
    doc.text(`VGV Total: ${formatCurrency(totalVGV)}`, 14, 58);
    doc.text(`VGC Total: ${formatCurrency(totalVGC)}`, 14, 64);
    
    const tableData = filteredSales.map(sale => {
      const broker = brokers.find(b => b.id === sale.broker_id);
      return [
        format(new Date(sale.sale_date || ""), "dd/MM/yyyy", { locale: ptBR }),
        broker?.name || "N/A",
        sale.client_name,
        sale.property_type,
        sale.origem || "Outro",
        formatCurrency(Number(sale.vgv || 0)),
        formatCurrency(Number(sale.vgc || 0)),
        sale.status
      ];
    });
    
    autoTable(doc, {
      startY: 72,
      head: [["Data", "Corretor", "Cliente", "Tipo", "Origem", "VGV", "VGC", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 5: { halign: "right" }, 6: { halign: "right" } }
    });
    
    doc.save(`relatorio-vendas-${selectedMonth}-${selectedYear}.pdf`);
    toast({ title: "PDF Gerado!", description: "Relatório de vendas baixado com sucesso." });
  };

  const generatePerformanceReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text("Relatório de Performance", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: "center" });
    
    const brokerPerformance = brokers.map(broker => {
      const brokerSales = filteredSales.filter(s => s.broker_id === broker.id);
      const totalVGV = brokerSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
      const totalVGC = brokerSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
      const salesCount = brokerSales.length;
      return { name: broker.name, salesCount, totalVGV, totalVGC, avgTicket: salesCount > 0 ? totalVGV / salesCount : 0 };
    }).filter(b => b.salesCount > 0);
    
    const totalSalesCount = filteredSales.length;
    const totalVGV = filteredSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
    const avgTicket = totalSalesCount > 0 ? totalVGV / totalSalesCount : 0;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Indicadores Gerais", 14, 45);
    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${totalSalesCount}`, 14, 52);
    doc.text(`VGV Total: ${formatCurrency(totalVGV)}`, 14, 58);
    doc.text(`Ticket Médio: ${formatCurrency(avgTicket)}`, 14, 70);
    
    const tableData = brokerPerformance.map(bp => [
      bp.name, bp.salesCount.toString(), formatCurrency(bp.totalVGV), formatCurrency(bp.totalVGC), formatCurrency(bp.avgTicket)
    ]);
    
    autoTable(doc, {
      startY: 84,
      head: [["Corretor", "Vendas", "VGV Total", "VGC Total", "Ticket Médio"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } }
    });
    
    doc.save(`relatorio-performance-${selectedMonth}-${selectedYear}.pdf`);
    toast({ title: "PDF Gerado!", description: "Relatório de performance baixado com sucesso." });
  };

  const generateRankingReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(20);
    doc.setTextColor(168, 85, 247);
    doc.text("Ranking de Corretores", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: "center" });
    
    const brokerRankings = brokers.map(broker => {
      const brokerSales = filteredSales.filter(s => s.broker_id === broker.id);
      const totalVGV = brokerSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
      const totalVGC = brokerSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
      return { name: broker.name, salesCount: brokerSales.length, totalVGV, totalVGC };
    }).filter(b => b.salesCount > 0).sort((a, b) => b.totalVGC - a.totalVGC);
    
    const tableData = brokerRankings.map((br, index) => [
      `${index + 1}º`, br.name, br.salesCount.toString(), formatCurrency(br.totalVGV), formatCurrency(br.totalVGC)
    ]);
    
    autoTable(doc, {
      startY: 96,
      head: [["Posição", "Corretor", "Vendas", "VGV Total", "VGC Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [168, 85, 247], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { halign: "center", fontStyle: "bold" }, 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right" } }
    });
    
    doc.save(`ranking-corretores-${selectedMonth}-${selectedYear}.pdf`);
    toast({ title: "PDF Gerado!", description: "Ranking de corretores baixado com sucesso." });
  };

  const generateOriginReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text("Análise por Origem do Lead", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: "center" });
    
    const originsMap = new Map<string, { leads: number, sales: number, vgv: number }>();
    leads.forEach(lead => {
      const { month: leadMonth, year: leadYear } = parseDateSafe(lead.created_at);
      if ((selectedMonth === 0 || leadMonth === selectedMonth) && (selectedYear === 0 || leadYear === selectedYear)) {
        const o = lead.source || "Outro";
        const entry = originsMap.get(o) || { leads: 0, sales: 0, vgv: 0 };
        entry.leads += 1;
        originsMap.set(o, entry);
      }
    });
    filteredSales.forEach(sale => {
      const o = sale.origem || "Outro";
      const entry = originsMap.get(o) || { leads: 0, sales: 0, vgv: 0 };
      entry.sales += 1;
      entry.vgv += Number(sale.vgv || 0);
      originsMap.set(o, entry);
    });
    
    const tableData = Array.from(originsMap.entries()).map(([name, data]) => [
      name, data.leads.toString(), data.sales.toString(), formatCurrency(data.vgv), data.leads > 0 ? `${((data.sales / data.leads) * 100).toFixed(1)}%` : "0%"
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: [["Origem", "Leads", "Vendas", "VGV Total", "Conversão"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    });
    doc.save(`relatorio-origem-${selectedMonth}-${selectedYear}.pdf`);
    toast({ title: "PDF Gerado!", description: "Relatório de origem baixado com sucesso." });
  };

  const reports = [
    { title: "Relatório de Vendas", description: "Vendas por período e corretor", icon: <BarChart3 className="w-8 h-8 text-primary" />, color: "bg-primary/10", handler: generateSalesReport },
    { title: "Performance Mensal", description: "Análise de metas e resultados", icon: <TrendingUp className="w-8 h-8 text-success" />, color: "bg-success/10", handler: generatePerformanceReport },
    { title: "Ranking de Corretores", description: "Classificação por desempenho", icon: <Users className="w-8 h-8 text-info" />, color: "bg-info/10", handler: generateRankingReport },
    { title: "Análise de Origem", description: "Performance por canal de aquisição", icon: <PieChart className="w-8 h-8 text-purple-500" />, color: "bg-purple-100", handler: generateOriginReport }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 animate-fade-in">
              Central de Relatórios
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Gestão de dados, PDFs e BI Avançado
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <PeriodFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
        </div>

        <Tabs defaultValue="pdf" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Exportação PDF
            </TabsTrigger>
            <TabsTrigger value="bi" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> BI Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-6 animate-in fade-in-50 duration-500">
            {salesLoading || brokersLoading || leadsLoading ? (
              <div className="text-center py-12"><p className="text-muted-foreground">Carregando dados...</p></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((report, index) => (
                    <Card key={report.title} className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
                      <div className={`w-16 h-16 ${report.color} rounded-lg flex items-center justify-center mb-4`}>{report.icon}</div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{report.title}</h3>
                      <p className="text-muted-foreground mb-4">{report.description}</p>
                      <Button size="sm" className="w-full" onClick={report.handler}><FileText className="w-4 h-4 mr-2" /> Gerar PDF</Button>
                    </Card>
                  ))}

                  <Card className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in border-2 border-dashed border-primary/20" style={{ animationDelay: '0.6s' }}>
                    <div className="w-16 h-16 bg-warning/10 rounded-lg flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-warning" /></div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Relatório Individual</h3>
                    <p className="text-muted-foreground mb-4">PDF completo por corretor com KPIs e insights</p>
                    <BrokerReportDialog trigger={<Button size="sm" className="w-full"><FileText className="w-4 h-4 mr-2" /> Gerar PDF Individual</Button>} />
                  </Card>
                </div>
                {filteredSales.length === 0 && <div className="text-center py-12 mt-6"><p className="text-muted-foreground">Nenhuma venda encontrada para o período selecionado.</p></div>}
              </>
            )}
          </TabsContent>

          <TabsContent value="bi" className="space-y-8 animate-in fade-in-50 duration-500">
            <OriginAnalyticsDashboard />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Previsão de Receita (VGV)</CardTitle>
                  <CardDescription>Baseado no histórico dos últimos 12 meses e tendência de mercado.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(str) => {
                        const [y, m] = str.split('-');
                        const ms = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                        return `${ms[parseInt(m)-1]} ${y.slice(2)}`;
                      }} />
                      <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Legend /><Area type="monotone" dataKey="value" name="VGV" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeDasharray="5 5" dot={false} activeDot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Tendência Próximos 3 Meses</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatCurrency(forecastData.filter(d => d.type === 'Previsão').reduce((sum, d) => sum + d.value, 0))}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-success" /> Crescimento estimado baseado em médias móveis</p>
                  </CardContent>
                </Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4 text-warning" /> Leads em Negociação</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{negotiations.length} Negociações</div>
                    <p className="text-xs text-muted-foreground mt-1">Potencial de {formatCurrency(negotiations.reduce((sum, n) => sum + Number(n.negotiated_value || 0), 0))}</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Insight Estratégico</CardTitle></CardHeader>
                  <CardContent><p className="text-xs leading-relaxed">Foque nos canais com maior taxa de conversão identificados acima para otimizar o investimento em marketing no próximo trimestre.</p></CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle>Mapa de Vendas Realizadas</CardTitle><CardDescription>Distribuição geográfica das propriedades vendidas.</CardDescription></CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-xl overflow-hidden border border-border">
                  {mapPoints.length > 0 ? (
                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {mapPoints.map(point => (
                        <CircleMarker key={point.id} center={[point.lat, point.lng]} radius={10} pathOptions={{ fillColor: '#3b82f6', color: '#1d4ed8', weight: 2, opacity: 1, fillOpacity: 0.6 }}>
                          <Popup><div className="p-1"><p className="font-bold text-sm mb-1">{point.client}</p><p className="text-xs text-muted-foreground mb-1">{point.address}</p><p className="font-semibold text-primary">{formatCurrency(point.value)}</p></div></Popup>
                        </CircleMarker>
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-muted/30 text-center p-8"><MapIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-20" /><h3 className="text-lg font-medium">Sem dados geográficos</h3><p className="text-sm text-muted-foreground max-w-xs mt-2">Nenhuma venda recente possui coordenadas válidas para exibição no mapa.</p></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Relatorios;