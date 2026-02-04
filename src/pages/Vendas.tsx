import Navigation from "@/components/Navigation";
import { SaleForm } from "@/components/forms/SaleForm";
import SaleDetailsDialog from "@/components/SaleDetailsDialog";
import ExcelImport from "@/components/ExcelImport";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SalesMetricsCards } from "@/components/sales/SalesMetricsCards";
import { SalesInsightsPanel } from "@/components/sales/SalesInsightsPanel";
import { SalesQuickFilters } from "@/components/sales/SalesQuickFilters";
import { SalesTableRow } from "@/components/sales/SalesTableRow";
import { TopBrokersRanking } from "@/components/sales/TopBrokersRanking";
import { useSearchAndFilters } from "@/components/SearchWithFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  User,
  MapPin,
  Filter,
  Calendar,
  Upload
} from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import type { Sale } from "@/contexts/DataContext";
import { VendasSkeleton } from "@/components/skeletons/VendasSkeleton";

const Vendas = () => {
  const { toast } = useToast();
  const { isDiretor } = useAuth();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { sales, loading, createSale, updateSale, deleteSale, refreshSales } = useSales();
  const { brokers } = useBrokers();
  const { teams, teamMembers } = useTeams();

  // Filter configurations
  const filterConfigs = useMemo(() => {
    const uniqueYears = [...new Set(sales.map(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      return saleDate.getFullYear();
    }))].sort((a, b) => b - a);

    const monthOptions = [
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

    return [
      {
        id: 'status',
        label: 'Status',
        type: 'select' as const,
        icon: <Filter className="w-4 h-4" />,
        options: [
          { value: 'pendente', label: 'Pendente' },
          { value: 'confirmada', label: 'Confirmada' },
          { value: 'cancelada', label: 'Cancelada' },
          { value: 'distrato', label: 'Distrato' },
        ],
      },
      {
        id: 'broker_id',
        label: 'Corretor',
        type: 'select' as const,
        icon: <User className="w-4 h-4" />,
        options: brokers.map(broker => ({
          value: broker.id,
          label: broker.name,
        })),
      },
      ...(isDiretor() ? [{
        id: 'team_id',
        label: 'Equipe',
        type: 'select' as const,
        icon: <User className="w-4 h-4" />,
        options: teams.map(team => ({
          value: team.id,
          label: team.name,
        })),
      }] : []),
      {
        id: 'property_type',
        label: 'Tipo de Imóvel',
        type: 'select' as const,
        icon: <MapPin className="w-4 h-4" />,
        options: [
          { value: 'apartamento', label: 'Apartamento' },
          { value: 'casa', label: 'Casa' },
          { value: 'terreno', label: 'Terreno' },
          { value: 'comercial', label: 'Comercial' },
        ],
      },
      {
        id: 'month',
        label: 'Mês',
        type: 'select' as const,
        icon: <Calendar className="w-4 h-4" />,
        options: monthOptions,
      },
      {
        id: 'year',
        label: 'Ano',
        type: 'select' as const,
        icon: <Calendar className="w-4 h-4" />,
        options: uniqueYears.map(year => ({
          value: year,
          label: year.toString(),
        })),
      },
    ];
  }, [brokers, sales, teams, isDiretor]);

  // Custom filter functions
  const customFilters = useMemo(() => ({
    team_id: (sales: Sale[], teamId: string) => {
      const teamBrokerIds = teamMembers
        .filter(member => member.team_id === teamId)
        .map(member => member.id);
      return sales.filter(sale => 
        sale.broker_id && teamBrokerIds.includes(sale.broker_id)
      );
    },
  }), [teamMembers]);

  const {
    activeFilters,
    filteredData: filteredSales,
    handleFilterChange,
    handleClearFilter,
    handleClearAllFilters,
    resultCount,
  } = useSearchAndFilters(
    sales,
    ['client_name', 'property_address'],
    filterConfigs,
    customFilters
  );

  // Apply search filter on top of other filters
  const searchFilteredSales = useMemo(() => {
    if (!searchTerm.trim()) return filteredSales;
    
    const lowerSearch = searchTerm.toLowerCase();
    return filteredSales.filter(sale => 
      sale.client_name?.toLowerCase().includes(lowerSearch) ||
      sale.property_address?.toLowerCase().includes(lowerSearch) ||
      brokers.find(b => b.id === sale.broker_id)?.name.toLowerCase().includes(lowerSearch)
    );
  }, [filteredSales, searchTerm, brokers]);

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
        <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8 min-h-screen">
          <VendasSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8 min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
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
                  
                  {/* Quick Filters */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <SalesQuickFilters 
                      activeFilters={activeFilters}
                      onFilterChange={handleFilterChange}
                      onClearFilter={handleClearFilter}
                      totalResults={searchFilteredSales.length}
                    />
                    
                    {activeFilters.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearAllFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Limpar filtros
                      </Button>
                    )}
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
                      {searchTerm || activeFilters.length > 0 
                        ? 'Nenhuma venda encontrada para os filtros aplicados.' 
                        : 'Nenhuma venda cadastrada ainda.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                          <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Imóvel</th>
                          <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corretor</th>
                          <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor / Comissão</th>
                          <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                          <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchFilteredSales.map((sale) => (
                          <SalesTableRow
                            key={sale.id}
                            sale={sale}
                            broker={brokers.find(b => b.id === sale.broker_id)}
                            onView={(sale) => {
                              setSelectedSale(sale);
                              setIsDetailsOpen(true);
                            }}
                            onEdit={(sale) => {
                              setSelectedSale(sale);
                              setIsFormOpen(true);
                            }}
                            onDelete={handleDelete}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
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
