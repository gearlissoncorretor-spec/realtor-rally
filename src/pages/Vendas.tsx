import Navigation from "@/components/Navigation";
import { SaleForm } from "@/components/forms/SaleForm";
import SaleDetailsDialog from "@/components/SaleDetailsDialog";
import ExcelImport from "@/components/ExcelImport";
import CommissionDialog from "@/components/commissions/CommissionDialog";
import SalesExportDialog from "@/components/sales/SalesExportDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SalesMetricsCards } from "@/components/sales/SalesMetricsCards";
import { SalesInsightsPanel } from "@/components/sales/SalesInsightsPanel";
import { SalesTableRow } from "@/components/sales/SalesTableRow";
import { TopBrokersRanking } from "@/components/sales/TopBrokersRanking";
import { CaptacaoTab } from "@/components/sales/CaptacaoTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Calendar, FileSpreadsheet, Filter, BarChart3, Home, Download } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useQueryErrorHandler } from "@/hooks/useQueryErrorHandler";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import type { Sale } from "@/contexts/DataContext";
import { VendasSkeleton } from "@/components/skeletons/VendasSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SalesQuickFilters } from "@/components/sales/SalesQuickFilters";

const currentYear = new Date().getFullYear();

const Vendas = () => {
  const { toast } = useToast();
  const { isDiretor, isGerente } = useAuth();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { filters, setFilter, resetFilters, hasActiveFilters: hasPersistedFilters } = usePersistedFilters({
    key: 'vendas',
    defaultValues: { year: currentYear, month: 0, status: 'all' as string },
  });
  const selectedYear = filters.year;
  const selectedMonth = filters.month;
  const statusFilter = filters.status;
  const setSelectedYear = (v: number) => setFilter('year', v);
  const setSelectedMonth = (v: number) => setFilter('month', v);
  const setStatusFilter = (v: string) => setFilter('status', v);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [commissionSaleData, setCommissionSaleData] = useState<{
    saleId: string; brokerId: string; brokerName: string; clientName: string;
    propertyValue: number; vgc: number; commissionRate: number;
  } | null>(null);
  const [defaultSaleType, setDefaultSaleType] = useState<'lancamento' | 'revenda'>('lancamento');
  
  const { sales, loading, createSale, updateSale, deleteSale, refreshSales } = useSales();
  const { brokers } = useBrokers();

  const availableYears = useMemo(() => {
    const vendaOnly = sales.filter(s => s.tipo !== 'captacao');
    const years = [...new Set(vendaOnly.map(sale => {
      const dateStr = sale.sale_date || (sale.created_at ? sale.created_at.substring(0, 10) : '');
      return dateStr ? parseInt(dateStr.substring(0, 4), 10) : NaN;
    }))].filter(y => !isNaN(y)).sort((a, b) => b - a);
    if (!years.includes(currentYear)) years.unshift(currentYear);
    return years;
  }, [sales]);

  const months = [
    { value: 0, label: 'Todos os meses' },
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ];

  // Show sales based on visibilidade field
  const vendaSales = useMemo(() => {
    return sales.filter(sale => {
      const vis = (sale as any).visibilidade || 'auto';
      if (vis === 'venda' || vis === 'ambos') return true;
      if (vis === 'captacao') return false;
      // auto: show if tipo is venda, or if captação from agency
      return sale.tipo !== 'captacao' || sale.parceria_tipo === 'Agência';
    });
  }, [sales]);

  const periodFilteredSales = useMemo(() => {
    return vendaSales.filter(sale => {
      const dateStr = sale.sale_date || (sale.created_at ? sale.created_at.substring(0, 10) : '');
      if (!dateStr) return false;
      const parts = dateStr.substring(0, 10).split('-');
      const saleYear = parseInt(parts[0], 10);
      const saleMonth = parseInt(parts[1], 10);
      if (isNaN(saleYear)) return false;
      if (selectedYear > 0 && saleYear !== selectedYear) return false;
      if (selectedMonth > 0 && saleMonth !== selectedMonth) return false;
      if (statusFilter !== 'all' && sale.status !== statusFilter) return false;
      return true;
    });
  }, [vendaSales, selectedYear, selectedMonth, statusFilter]);

  const searchFilteredSales = useMemo(() => {
    if (!searchTerm.trim()) return periodFilteredSales;
    const lowerSearch = searchTerm.toLowerCase();
    return periodFilteredSales.filter(sale =>
      sale.client_name?.toLowerCase().includes(lowerSearch) ||
      sale.property_address?.toLowerCase().includes(lowerSearch) ||
      brokers.find(b => b.id === sale.broker_id)?.name.toLowerCase().includes(lowerSearch)
    );
  }, [periodFilteredSales, searchTerm, brokers]);

  // Pagination - must be before any early returns
  const pagination = usePagination(searchFilteredSales, { storageKey: 'vendas', defaultPageSize: 25 });
  
  // Reset page when filters change
  useEffect(() => { pagination.resetPage(); }, [selectedYear, selectedMonth, statusFilter, searchTerm]);

  const handleDelete = async (saleId: string) => {
    try {
      await deleteSale(saleId);
      toast({ title: "Venda excluída", description: "A venda foi excluída com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir a venda.", variant: "destructive" });
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

  const hasActiveFilters = hasPersistedFilters || !!searchTerm;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6 min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Header Premium */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">Painel de Vendas</h1>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe resultados e performance da equipe
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-sm" size="default" onClick={() => setDefaultSaleType('lancamento')}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Venda</span>
                    <span className="sm:hidden">Nova</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedSale ? "Editar Venda" : "Nova Venda"}</DialogTitle>
                  </DialogHeader>
                  <SaleForm 
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setSelectedSale(null); }}
                    onSubmit={async (data) => {
                      try {
                        const saleData = {
                          tipo: data.tipo!,
                          client_name: data.client_name!,
                          property_address: data.property_address!,
                          property_type: data.property_type!,
                          broker_id: data.broker_id!,
                          status: data.status!,
                          origem: data.origem!,
                          estilo: data.estilo!,
                          produto: data.produto!,
                          captador: data.captador!,
                          vendedor_nome: data.vendedor_nome || null,
                          vendedor_telefone: data.vendedor_telefone || null,
                          vendedor_creci: data.vendedor_creci || null,
                          parceria_tipo: data.parceria_tipo || null,
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
                          toast({ title: data.tipo === 'captacao' ? "Captação atualizada" : "Venda atualizada", description: "Registro atualizado com sucesso." });
                        } else {
                          const createdSale = await createSale(saleData);
                          toast({ title: data.tipo === 'captacao' ? "Captação criada" : "Venda criada", description: "Registro criado com sucesso." });
                          if (createdSale && data.tipo === 'venda') {
                            const broker = brokers.find(b => b.id === saleData.broker_id);
                            setCommissionSaleData({
                              saleId: createdSale.id,
                              brokerId: saleData.broker_id || '',
                              brokerName: broker?.name || 'Corretor',
                              clientName: saleData.client_name,
                              propertyValue: Number(saleData.property_value || 0),
                              vgc: Number(saleData.vgc || saleData.property_value || 0),
                              commissionRate: Number(broker?.commission_rate || 5),
                            });
                            setCommissionDialogOpen(true);
                          }
                        }
                        setIsFormOpen(false);
                        setSelectedSale(null);
                      } catch (error) {
                        toast({ title: "Erro", description: "Não foi possível salvar o registro.", variant: "destructive" });
                      }
                    }}
                    sale={selectedSale}
                    title={selectedSale ? "Editar Venda" : "Nova Venda"}
                    defaultSaleType={defaultSaleType}
                    defaultTipo={selectedSale?.tipo === 'captacao' ? 'captacao' : 'venda'}
                  />
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" className="gap-2 shadow-sm" size="default" onClick={() => setExportDialogOpen(true)}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              
              <ExcelImport onImportComplete={() => refreshSales()} />
            </div>
          </div>

          {/* Tabs: Vendas / Captação */}
          <Tabs defaultValue="vendas" className="w-full">
            <TabsList className="grid w-full max-w-[360px] grid-cols-2">
              <TabsTrigger value="vendas" className="gap-1.5 text-xs">
                <BarChart3 className="w-3.5 h-3.5" />
                Vendas
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-bold">{searchFilteredSales.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="captacao" className="gap-1.5 text-xs">
                <Home className="w-3.5 h-3.5" />
                Captação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vendas" className="space-y-6 mt-4">
              {/* Filtros Compactos */}
              <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente, imóvel ou corretor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Filter className="w-3.5 h-3.5" />
                    </div>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger className="w-[110px] h-9 text-xs bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Todos anos</SelectItem>
                        {availableYears.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger className="w-[130px] h-9 text-xs bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px] h-9 text-xs bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="distrato">Distrato</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          resetFilters();
                          setSearchTerm('');
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground h-9 px-2"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              <SalesMetricsCards sales={searchFilteredSales} />

              {(isDiretor() || isGerente()) ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <SalesInsightsPanel sales={searchFilteredSales} brokers={brokers} />
                  </div>
                  <div>
                    <TopBrokersRanking sales={searchFilteredSales} brokers={brokers} />
                  </div>
                </div>
              ) : (
                <SalesInsightsPanel sales={searchFilteredSales} brokers={brokers} />
              )}

              <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Registro de Vendas</h3>
                      <p className="text-xs text-muted-foreground">Detalhamento completo das transações</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-medium">
                    {searchFilteredSales.length} {searchFilteredSales.length === 1 ? 'registro' : 'registros'}
                  </Badge>
                </div>
                
                {loading ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Carregando vendas...</p>
                    </div>
                  </div>
                ) : searchFilteredSales.length === 0 ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <Search className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? 'Nenhuma venda encontrada para os filtros aplicados.' 
                          : 'Nenhuma venda cadastrada ainda.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="block md:hidden space-y-2 p-3">
                      {pagination.paginatedItems.map((sale) => {
                        const broker = brokers.find(b => b.id === sale.broker_id);
                        return (
                          <Card key={sale.id} className="border-border/40 hover:border-border/80 transition-colors">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-foreground truncate text-sm">{sale.client_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{sale.property_address}</p>
                                </div>
                                <Badge 
                                  variant={sale.status === 'confirmada' ? 'default' : sale.status === 'cancelada' || sale.status === 'distrato' ? 'destructive' : 'secondary'} 
                                  className="shrink-0 text-[10px]"
                                >
                                  {sale.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Corretor</p>
                                  <p className="truncate font-medium">{broker?.name || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Data</p>
                                  <p className="font-medium">{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-BR') : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">VGV</p>
                                  <p className="font-bold text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.vgv)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Comissão</p>
                                  <p className="font-bold text-success">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.vgc)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => { setSelectedSale(sale); setIsDetailsOpen(true); }}>
                                  Detalhes
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setSelectedSale(sale); setIsFormOpen(true); }}>
                                  Editar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-muted/30 border-b border-border/50">
                          <tr>
                            <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                            <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Imóvel</th>
                            <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Corretor</th>
                            <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Valor / Comissão</th>
                            <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                            <th className="text-right p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {pagination.paginatedItems.map((sale) => (
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

                    {/* Pagination */}
                    <TablePagination
                      totalItems={pagination.totalItems}
                      currentPage={pagination.currentPage}
                      pageSize={pagination.pageSize}
                      onPageChange={pagination.handlePageChange}
                      onPageSizeChange={pagination.handlePageSizeChange}
                    />
                  </>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="captacao" className="mt-4">
              <CaptacaoTab 
                sales={sales} 
                brokers={brokers} 
                loading={loading} 
                onRegisterSale={() => {
                  setSelectedSale(null);
                  setDefaultSaleType('revenda');
                  setIsFormOpen(true);
                }}
                onEdit={(sale) => {
                  setSelectedSale(sale);
                  setDefaultSaleType('revenda');
                  setIsFormOpen(true);
                }}
                onView={(sale) => {
                  setSelectedSale(sale);
                  setIsDetailsOpen(true);
                }}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SaleDetailsDialog
        sale={selectedSale}
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedSale(null); }}
      />

      <CommissionDialog
        isOpen={commissionDialogOpen}
        onClose={() => { setCommissionDialogOpen(false); setCommissionSaleData(null); }}
        saleData={commissionSaleData}
      />

      <SalesExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        sales={sales}
        brokers={brokers}
      />
    </div>
  );
};

export default Vendas;
