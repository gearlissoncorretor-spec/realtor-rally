import Navigation from "@/components/Navigation";
import { SaleForm } from "@/components/forms/SaleForm";
import SaleDetailsDialog from "@/components/SaleDetailsDialog";
import ExcelImport from "@/components/ExcelImport";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SalesMetricsCards } from "@/components/sales/SalesMetricsCards";
import { SalesInsightsPanel } from "@/components/sales/SalesInsightsPanel";
import { SalesTableRow } from "@/components/sales/SalesTableRow";
import { TopBrokersRanking } from "@/components/sales/TopBrokersRanking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import type { Sale } from "@/contexts/DataContext";
import { VendasSkeleton } from "@/components/skeletons/VendasSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const currentYear = new Date().getFullYear();

const Vendas = () => {
  const { toast } = useToast();
  const { isDiretor } = useAuth();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  
  const { sales, loading, createSale, updateSale, deleteSale, refreshSales } = useSales();
  const { brokers } = useBrokers();
  

  // Available years from data
  const availableYears = useMemo(() => {
    const years = [...new Set(sales.map(sale => {
      const d = new Date(sale.sale_date || sale.created_at || '');
      return d.getFullYear();
    }))].filter(y => !isNaN(y)).sort((a, b) => b - a);
    // Ensure current year is always in the list
    if (!years.includes(currentYear)) years.unshift(currentYear);
    return years;
  }, [sales]);

  const months = [
    { value: 0, label: 'Todos os meses' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter by year, month, status
  const periodFilteredSales = useMemo(() => {
    return sales.filter(sale => {
      const d = new Date(sale.sale_date || sale.created_at || '');
      if (isNaN(d.getTime())) return false;

      // Year filter (0 = all)
      if (selectedYear > 0 && d.getFullYear() !== selectedYear) return false;
      // Month filter (0 = all)
      if (selectedMonth > 0 && d.getMonth() + 1 !== selectedMonth) return false;
      // Status filter
      if (statusFilter !== 'all' && sale.status !== statusFilter) return false;

      return true;
    });
  }, [sales, selectedYear, selectedMonth, statusFilter]);

  // Apply search on top
  const searchFilteredSales = useMemo(() => {
    if (!searchTerm.trim()) return periodFilteredSales;
    const lowerSearch = searchTerm.toLowerCase();
    return periodFilteredSales.filter(sale =>
      sale.client_name?.toLowerCase().includes(lowerSearch) ||
      sale.property_address?.toLowerCase().includes(lowerSearch) ||
      brokers.find(b => b.id === sale.broker_id)?.name.toLowerCase().includes(lowerSearch)
    );
  }, [periodFilteredSales, searchTerm, brokers]);

  const handleDelete = async (saleId: string) => {
    try {
      await deleteSale(saleId);
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a venda.",
        variant: "destructive",
      });
    }
  };

  const isInitialLoading = loading && sales.length === 0;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 min-h-screen">
          <VendasSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 min-h-screen">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">VENDAS</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visão geral das vendas e resultados da equipe
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" size="default">
                    <Plus className="w-4 h-4" />
                    Nova Venda
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedSale ? "Editar Venda" : "Nova Venda"}
                    </DialogTitle>
                  </DialogHeader>
                  <SaleForm 
                    isOpen={isFormOpen}
                    onClose={() => {
                      setIsFormOpen(false);
                      setSelectedSale(null);
                    }}
                    onSubmit={async (data) => {
                      try {
                        const saleData = {
                          client_name: data.client_name!,
                          property_address: data.property_address!,
                          property_type: data.property_type!,
                          broker_id: data.broker_id!,
                          status: data.status!,
                          origem: data.origem!,
                          estilo: data.estilo!,
                          produto: data.produto!,
                          captador: data.captador!,
                          gerente: data.gerente!,
                          latitude: data.latitude!,
                          sale_type: data.sale_type!,
                          sale_date: data.sale_date!,
                          client_email: data.client_email || null,
                          client_phone: data.client_phone || null,
                          notes: data.notes || null,
                          property_value: Number(data.property_value),
                          vgv: Number(data.vgv || data.property_value),
                          vgc: Number(data.vgc),
                          commission_value: Number(data.commission_value || 0),
                          pagos: Number(data.pagos || 0),
                          ano: Number(data.ano),
                          mes: Number(data.mes),
                        };

                        if (selectedSale) {
                          await updateSale(selectedSale.id, saleData);
                          toast({
                            title: "Venda atualizada",
                            description: "A venda foi atualizada com sucesso.",
                          });
                        } else {
                          await createSale(saleData);
                          toast({
                            title: "Venda criada",
                            description: "A nova venda foi criada com sucesso.",
                          });
                        }
                        setIsFormOpen(false);
                        setSelectedSale(null);
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível salvar a venda.",
                          variant: "destructive",
                        });
                      }
                    }}
                    sale={selectedSale}
                    title={selectedSale ? "Editar Venda" : "Nova Venda"}
                  />
                </DialogContent>
              </Dialog>
              
              <ExcelImport onImportComplete={() => refreshSales()} />
            </div>
          </div>

          {/* Metrics Cards - Layer 1 & 2 */}
          <SalesMetricsCards sales={searchFilteredSales} />

          {/* Insights Panel */}
          <SalesInsightsPanel sales={searchFilteredSales} brokers={brokers} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Table Section */}
            <div className="xl:col-span-3 space-y-4">
              {/* Search and Filters */}
              <Card className="p-4">
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente, imóvel ou corretor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                  
                  {/* Period & Status Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(v) => setSelectedYear(parseInt(v))}
                      >
                        <SelectTrigger className="w-[130px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Todos os anos</SelectItem>
                          {availableYears.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(v) => setSelectedMonth(parseInt(v))}
                    >
                      <SelectTrigger className="w-[150px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="distrato">Distrato</SelectItem>
                      </SelectContent>
                    </Select>

                    {(selectedYear !== currentYear || selectedMonth !== 0 || statusFilter !== 'all' || searchTerm) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedYear(currentYear);
                          setSelectedMonth(0);
                          setStatusFilter('all');
                          setSearchTerm('');
                        }}
                        className="text-muted-foreground hover:text-foreground h-9"
                      >
                        Limpar filtros
                      </Button>
                    )}

                    <Badge variant="secondary" className="ml-auto text-xs">
                      {searchFilteredSales.length} {searchFilteredSales.length === 1 ? 'resultado' : 'resultados'}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Sales Table */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Lista de Vendas</h3>
                  <span className="text-sm text-muted-foreground">
                    {searchFilteredSales.length} {searchFilteredSales.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>
                
                {loading ? (
                  <div className="h-32 flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando vendas...</p>
                  </div>
                ) : searchFilteredSales.length === 0 ? (
                  <div className="h-32 flex items-center justify-center">
                    <p className="text-muted-foreground text-center text-sm">
                      {searchTerm || statusFilter !== 'all' || selectedMonth !== 0 
                        ? 'Nenhuma venda encontrada para os filtros aplicados.' 
                        : 'Nenhuma venda cadastrada ainda.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-3 p-3">
                      {searchFilteredSales.map((sale) => {
                        const broker = brokers.find(b => b.id === sale.broker_id);
                        return (
                          <Card key={sale.id} className="border border-border/50">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-foreground truncate">{sale.client_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{sale.property_address}</p>
                                </div>
                                <Badge variant={sale.status === 'confirmada' ? 'default' : sale.status === 'cancelada' || sale.status === 'distrato' ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                                  {sale.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Corretor</p>
                                  <p className="truncate">{broker?.name || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Data</p>
                                  <p>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-BR') : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">VGV</p>
                                  <p className="font-semibold text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.vgv)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Comissão</p>
                                  <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.vgc)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                <Button size="sm" variant="ghost" className="flex-1 h-9" onClick={() => { setSelectedSale(sale); setIsDetailsOpen(true); }}>
                                  Ver detalhes
                                </Button>
                                <Button size="sm" variant="ghost" className="h-9" onClick={() => { setSelectedSale(sale); setIsFormOpen(true); }}>
                                  <Search className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive h-9" onClick={() => handleDelete(sale.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto scrollbar-styled">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                          <tr>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Imóvel</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corretor</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor / Comissão</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchFilteredSales.map((sale) => (
                            <SalesTableRow
                              key={sale.id}
                              sale={sale}
                              broker={brokers.find(b => b.id === sale.broker_id)}
                              onView={(sale) => { setSelectedSale(sale); setIsDetailsOpen(true); }}
                              onEdit={(sale) => { setSelectedSale(sale); setIsFormOpen(true); }}
                              onDelete={handleDelete}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Sidebar - Top Brokers */}
            <div className="xl:col-span-1">
              <TopBrokersRanking sales={searchFilteredSales} brokers={brokers} />
            </div>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <SaleDetailsDialog
        sale={selectedSale}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedSale(null);
        }}
      />
    </div>
  );
};

export default Vendas;
