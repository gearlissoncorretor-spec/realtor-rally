import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PeriodFilter from "@/components/PeriodFilter";
import { formatCurrency } from "@/utils/formatting";

const Relatorios = () => {
  const { toast } = useToast();
  const { sales, loading: salesLoading } = useSales();
  const { brokers, loading: brokersLoading } = useBrokers();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const saleMonth = saleDate.getMonth() + 1;
      const saleYear = saleDate.getFullYear();
      
      return saleMonth === selectedMonth && saleYear === selectedYear;
    });
  }, [sales, selectedMonth, selectedYear]);

  const generateSalesReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text("Relatório de Vendas", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: "center" });
    
    // Summary
    const totalVGV = filteredSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
    const totalVGC = filteredSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
    const totalSales = filteredSales.length;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumo do Período", 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${totalSales}`, 14, 52);
    doc.text(`VGV Total: ${formatCurrency(totalVGV)}`, 14, 58);
    doc.text(`VGC Total: ${formatCurrency(totalVGC)}`, 14, 64);
    
    // Sales table
    const tableData = filteredSales.map(sale => {
      const broker = brokers.find(b => b.id === sale.broker_id);
      return [
        format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR }),
        broker?.name || "N/A",
        sale.client_name,
        sale.property_type,
        formatCurrency(Number(sale.vgv || 0)),
        formatCurrency(Number(sale.vgc || 0)),
        sale.status
      ];
    });
    
    autoTable(doc, {
      startY: 72,
      head: [["Data", "Corretor", "Cliente", "Tipo", "VGV", "VGC", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" }
      }
    });
    
    doc.save(`relatorio-vendas-${selectedMonth}-${selectedYear}.pdf`);
    
    toast({
      title: "PDF Gerado!",
      description: "Relatório de vendas baixado com sucesso.",
    });
  };

  const generatePerformanceReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text("Relatório de Performance", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: "center" });
    
    // Performance by broker
    const brokerPerformance = brokers.map(broker => {
      const brokerSales = filteredSales.filter(s => s.broker_id === broker.id);
      const totalVGV = brokerSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
      const totalVGC = brokerSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
      const salesCount = brokerSales.length;
      
      return {
        name: broker.name,
        salesCount,
        totalVGV,
        totalVGC,
        avgTicket: salesCount > 0 ? totalVGV / salesCount : 0
      };
    }).filter(b => b.salesCount > 0);
    
    // Summary
    const totalSales = filteredSales.length;
    const totalVGV = filteredSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
    const totalVGC = filteredSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
    const avgTicket = totalSales > 0 ? totalVGV / totalSales : 0;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Indicadores Gerais", 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${totalSales}`, 14, 52);
    doc.text(`VGV Total: ${formatCurrency(totalVGV)}`, 14, 58);
    doc.text(`VGC Total: ${formatCurrency(totalVGC)}`, 14, 64);
    doc.text(`Ticket Médio: ${formatCurrency(avgTicket)}`, 14, 70);
    doc.text(`Percentual VGC: ${totalVGV > 0 ? ((totalVGC / totalVGV) * 100).toFixed(2) : 0}%`, 14, 76);
    
    // Broker performance table
    const tableData = brokerPerformance.map(bp => [
      bp.name,
      bp.salesCount.toString(),
      formatCurrency(bp.totalVGV),
      formatCurrency(bp.totalVGC),
      formatCurrency(bp.avgTicket)
    ]);
    
    autoTable(doc, {
      startY: 84,
      head: [["Corretor", "Vendas", "VGV Total", "VGC Total", "Ticket Médio"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" }
      }
    });
    
    doc.save(`relatorio-performance-${selectedMonth}-${selectedYear}.pdf`);
    
    toast({
      title: "PDF Gerado!",
      description: "Relatório de performance baixado com sucesso.",
    });
  };

  const generateRankingReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(168, 85, 247);
    doc.text("Ranking de Corretores", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: "center" });
    
    // Calculate rankings
    const brokerRankings = brokers.map(broker => {
      const brokerSales = filteredSales.filter(s => s.broker_id === broker.id);
      const totalVGV = brokerSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
      const totalVGC = brokerSales.reduce((sum, sale) => sum + Number(sale.vgc || 0), 0);
      const salesCount = brokerSales.length;
      
      return {
        name: broker.name,
        salesCount,
        totalVGV,
        totalVGC
      };
    }).filter(b => b.salesCount > 0)
      .sort((a, b) => b.totalVGC - a.totalVGC);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Classificação por VGC", 14, 45);
    
    // Podium (top 3)
    if (brokerRankings.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(255, 215, 0);
      doc.text("🥇 1º Lugar", 14, 54);
      doc.setTextColor(0, 0, 0);
      doc.text(`${brokerRankings[0].name} - ${formatCurrency(brokerRankings[0].totalVGC)}`, 14, 60);
      
      if (brokerRankings.length > 1) {
        doc.setTextColor(192, 192, 192);
        doc.text("🥈 2º Lugar", 14, 68);
        doc.setTextColor(0, 0, 0);
        doc.text(`${brokerRankings[1].name} - ${formatCurrency(brokerRankings[1].totalVGC)}`, 14, 74);
      }
      
      if (brokerRankings.length > 2) {
        doc.setTextColor(205, 127, 50);
        doc.text("🥉 3º Lugar", 14, 82);
        doc.setTextColor(0, 0, 0);
        doc.text(`${brokerRankings[2].name} - ${formatCurrency(brokerRankings[2].totalVGC)}`, 14, 88);
      }
    }
    
    // Full ranking table
    const tableData = brokerRankings.map((br, index) => [
      `${index + 1}º`,
      br.name,
      br.salesCount.toString(),
      formatCurrency(br.totalVGV),
      formatCurrency(br.totalVGC)
    ]);
    
    autoTable(doc, {
      startY: 96,
      head: [["Posição", "Corretor", "Vendas", "VGV Total", "VGC Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [168, 85, 247], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" }
      }
    });
    
    doc.save(`ranking-corretores-${selectedMonth}-${selectedYear}.pdf`);
    
    toast({
      title: "PDF Gerado!",
      description: "Ranking de corretores baixado com sucesso.",
    });
  };

  const reports = [
    {
      title: "Relatório de Vendas",
      description: "Vendas por período e corretor",
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      color: "bg-primary/10",
      handler: generateSalesReport
    },
    {
      title: "Performance Mensal",
      description: "Análise de metas e resultados",
      icon: <TrendingUp className="w-8 h-8 text-success" />,
      color: "bg-success/10",
      handler: generatePerformanceReport
    },
    {
      title: "Ranking de Corretores",
      description: "Classificação por desempenho",
      icon: <Users className="w-8 h-8 text-info" />,
      color: "bg-info/10",
      handler: generateRankingReport
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
            Relatórios
          </h1>
          <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Gere relatórios detalhados de vendas e performance em PDF
          </p>
        </div>

        <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <PeriodFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>

        {salesLoading || brokersLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <Card key={report.title} className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
                <div className={`w-16 h-16 ${report.color} rounded-lg flex items-center justify-center mb-4`}>
                  {report.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{report.title}</h3>
                <p className="text-muted-foreground mb-4">{report.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={report.handler}>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!salesLoading && !brokersLoading && filteredSales.length === 0 && (
          <div className="text-center py-12 mt-6">
            <p className="text-muted-foreground">Nenhuma venda encontrada para o período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Relatorios;