import Navigation from "@/components/Navigation";
import { SaleForm } from "@/components/forms/SaleForm";
import SaleDetailsDialog from "@/components/SaleDetailsDialog";
import ExcelImport from "@/components/ExcelImport";
import { ColumnSelector } from "@/components/ColumnSelector";
import { ExpandableCell } from "@/components/ExpandableCell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveTable, 
  ResponsiveTableHeader, 
  ResponsiveTableRow,
  type ColumnConfig,
  type ActionConfig 
} from "@/components/ui/responsive-table";
import SearchWithFilters, { useSearchAndFilters } from "@/components/SearchWithFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Filter,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import type { Sale } from "@/contexts/DataContext";
import { VendasSkeleton } from "@/components/skeletons/VendasSkeleton";

const Vendas = () => {
  const { toast } = useToast();
  const { isDiretor } = useAuth();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'client_name', 'property_address', 'broker_name', 'property_value', 'vgc', 'status', 'sale_date'
  ]);
  
  const { sales, loading, createSale, updateSale, deleteSale, refreshSales } = useSales();
  const { brokers } = useBrokers();
  const { teams, teamMembers } = useTeams();

  // Enhanced search and filter configuration
  const filterConfigs = useMemo(() => {
    // Get unique years from sales data
    const uniqueYears = [...new Set(sales.map(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      return saleDate.getFullYear();
    }))].sort((a, b) => b - a); // Sort descending (newest first)

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
      // Only show team filter for directors
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

  // Custom filter functions for complex filtering
  const customFilters = useMemo(() => ({
    team_id: (sales: Sale[], teamId: string) => {
      // Get all brokers from the selected team
      const teamBrokerIds = teamMembers
        .filter(member => member.team_id === teamId)
        .map(member => member.id);
      
      // Filter sales by brokers in the team
      return sales.filter(sale => 
        sale.broker_id && teamBrokerIds.includes(sale.broker_id)
      );
    },
  }), [teamMembers]);

  const {
    searchTerm,
    setSearchTerm,
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

  // Define all available table columns
  const allTableColumns: ColumnConfig[] = [
    {
      key: 'client_name',
      label: 'Cliente',
      priority: 'high',
      render: (value) => (
        <ExpandableCell 
          content={value}
          maxLength={20}
          title="Nome do Cliente"
          className="font-medium text-foreground"
        />
      ),
    },
    {
      key: 'property_address',
      label: 'Imóvel',
      priority: 'high',
      render: (value, row) => (
        <div className="min-w-0">
          <ExpandableCell 
            content={value}
            maxLength={25}
            title="Endereço do Imóvel"
            className="font-medium text-foreground"
          />
          <div className="text-sm text-muted-foreground capitalize">{row.property_type}</div>
        </div>
      ),
    },
    {
      key: 'broker_name',
      label: 'Corretor',
      priority: 'high',
      render: (_, row) => {
        const broker = brokers.find(b => b.id === row.broker_id);
        return (
          <div className="font-medium text-foreground">
            {broker ? broker.name : "Sem corretor"}
          </div>
        );
      },
    },
    {
      key: 'captador',
      label: 'Captador',
      priority: 'medium',
      render: (value) => (
        <div className="font-medium text-foreground">
          {value || 'Não informado'}
        </div>
      ),
    },
    {
      key: 'vendedor',
      label: 'Vendedor',
      priority: 'low',
      render: (value) => (
        <div className="font-medium text-foreground">
          {value || 'Não informado'}
        </div>
      ),
    },
    {
      key: 'gerente',
      label: 'Gerente',
      priority: 'low',
      render: (value) => (
        <div className="font-medium text-foreground">
          {value || 'Não informado'}
        </div>
      ),
    },
    {
      key: 'property_value',
      label: 'Valor do Imóvel',
      priority: 'medium',
      render: (value) => (
        <div className="font-semibold text-foreground">
          {formatCurrency(Number(value))}
        </div>
      ),
    },
    {
      key: 'vgc',
      label: 'VGC',
      priority: 'medium',
      render: (value) => (
        <div className="font-semibold text-success">
          {formatCurrency(Number(value))}
        </div>
      ),
    },
    {
      key: 'vgv',
      label: 'VGV',
      priority: 'low',
      render: (value) => (
        <div className="font-semibold text-primary">
          {formatCurrency(Number(value))}
        </div>
      ),
    },
    {
      key: 'commission_value',
      label: 'Comissão',
      priority: 'low',
      render: (value) => (
        <div className="font-semibold text-accent">
          {formatCurrency(Number(value || 0))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'high',
      render: (value) => (
        <Badge
          variant={
            value === 'confirmada' ? 'default' :
            value === 'pendente' ? 'secondary' :
            value === 'distrato' ? 'outline' :
            'destructive'
          }
          className={`capitalize ${value === 'distrato' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}`}
        >
          {value === 'distrato' ? '⚠️ Distrato' : value}
        </Badge>
      ),
    },
    {
      key: 'sale_date',
      label: 'Data da Venda',
      priority: 'medium',
      render: (value) => (
        <div className="text-sm text-foreground">
          {value ? new Date(value).toLocaleDateString('pt-BR') : 'Sem data'}
        </div>
      ),
    },
    {
      key: 'contract_date',
      label: 'Data do Contrato',
      priority: 'low',
      render: (value) => (
        <div className="text-sm text-foreground">
          {value ? new Date(value).toLocaleDateString('pt-BR') : 'Sem data'}
        </div>
      ),
    },
    {
      key: 'client_email',
      label: 'Email Cliente',
      priority: 'low',
      render: (value) => (
        <ExpandableCell 
          content={value || 'Não informado'}
          maxLength={20}
          title="Email do Cliente"
          className="text-sm text-foreground"
        />
      ),
    },
    {
      key: 'client_phone',
      label: 'Telefone Cliente',
      priority: 'low',
      render: (value) => (
        <div className="text-sm text-foreground">
          {value || 'Não informado'}
        </div>
      ),
    },
    {
      key: 'origem',
      label: 'Origem',
      priority: 'low',
      render: (value) => (
        <div className="text-sm text-foreground">
          {value || 'Não informado'}
        </div>
      ),
    },
    {
      key: 'produto',
      label: 'Produto',
      priority: 'low',
      render: (value) => (
        <div className="text-sm text-foreground">
          {value || 'Não informado'}
        </div>
      ),
    },
    {
      key: 'notes',
      label: 'Observações',
      priority: 'low',
      render: (value) => (
        <ExpandableCell 
          content={value || 'Nenhuma observação'}
          maxLength={30}
          title="Observações"
          className="text-sm text-foreground"
        />
      ),
    },
  ];

  // Filter columns based on visibility settings
  const tableColumns = allTableColumns.filter(col => visibleColumns.includes(col.key));

  // Column selector handlers
  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAllColumns = () => {
    setVisibleColumns(allTableColumns.map(col => col.key));
  };

  const handleSelectNoColumns = () => {
    setVisibleColumns([]);
  };

  // Define table actions
  const tableActions: ActionConfig[] = [
    {
      label: 'Ver detalhes',
      icon: <Eye className="w-4 h-4" />,
      onClick: (sale) => {
        setSelectedSale(sale as Sale);
        setIsDetailsOpen(true);
      },
    },
    {
      label: 'Editar',
      icon: <Edit className="w-4 h-4" />,
      onClick: (sale) => {
        setSelectedSale(sale as Sale);
        setIsFormOpen(true);
      },
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'destructive' as const,
      onClick: (sale) => handleDelete(sale.id),
    },
  ];

  const isInitialLoading = loading && sales.length === 0;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-64 pt-16 lg:pt-0 p-2 sm:p-4 lg:p-6 min-h-screen overflow-x-hidden">
          <VendasSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-2 sm:p-4 lg:p-6 min-h-screen overflow-x-hidden">
        <div className="max-w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 truncate">Imóveis para Venda</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Gestão completa de imóveis e vendas</p>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <ColumnSelector
                columns={allTableColumns}
                visibleColumns={visibleColumns}
                onColumnToggle={handleColumnToggle}
                onSelectAll={handleSelectAllColumns}
                onSelectNone={handleSelectNoColumns}
              />
              
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full xs:w-auto">
                    <Plus className="w-4 h-4" />
                    <span className="hidden xs:inline">Nova Venda</span>
                    <span className="xs:hidden">Nova</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2">
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
                      // ... keep existing code
                      try {
                        // Transform form data to match Sale interface
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

        {/* Enhanced Search and Filters */}
        <div className="mb-4 sm:mb-6 overflow-x-auto">
          <SearchWithFilters
            searchPlaceholder="Buscar por cliente, endereço ou corretor..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filterConfigs}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilter={handleClearFilter}
            onClearAllFilters={handleClearAllFilters}
            showResultCount={true}
            resultCount={resultCount}
            className="min-w-0"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total de Vendas</p>
                <p className="text-lg sm:text-2xl font-bold">{filteredSales.length}</p>
              </div>
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-80 flex-shrink-0" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">VGV Total</p>
                <p className="text-sm sm:text-2xl font-bold text-success truncate">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + Number(sale.vgv), 0))}
                </p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-success opacity-80 flex-shrink-0" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">VGC Total</p>
                <p className="text-sm sm:text-2xl font-bold text-success truncate">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + Number(sale.vgc), 0))}
                </p>
              </div>
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-success opacity-80 flex-shrink-0" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Vendas Confirmadas</p>
                <p className="text-lg sm:text-2xl font-bold text-primary">
                  {filteredSales.filter(sale => sale.status === 'confirmada').length}
                </p>
              </div>
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-80 flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Sales Table */}
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 border-b bg-muted/30">
            <h3 className="text-lg font-semibold text-foreground">Lista de Vendas</h3>
          </div>
          
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-muted-foreground">Carregando vendas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="h-32 flex items-center justify-center px-4">
              <p className="text-muted-foreground text-center text-sm">
                {searchTerm || activeFilters.length > 0 
                  ? 'Nenhuma venda encontrada para os filtros aplicados.' 
                  : 'Nenhuma venda cadastrada ainda.'}
              </p>
            </div>
          ) : visibleColumns.length === 0 ? (
            <div className="h-32 flex items-center justify-center px-4">
              <p className="text-muted-foreground text-center text-sm">
                Selecione pelo menos uma coluna para visualizar os dados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ResponsiveTable>
                <ResponsiveTableHeader columns={tableColumns} />
                {filteredSales.map((sale) => (
                  <ResponsiveTableRow
                    key={sale.id}
                    data={sale}
                    columns={tableColumns}
                    actions={tableActions}
                    isExpandable={true}
                    expandedContent={
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground border-b pb-2">Informações do Cliente</h4>
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Nome:</span>
                                <span className="font-medium text-foreground">{sale.client_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Telefone:</span>
                                <span className="font-medium text-foreground">{sale.client_phone || 'Não informado'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium text-foreground break-all">{sale.client_email || 'Não informado'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground border-b pb-2">Detalhes da Venda</h4>
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">VGV:</span>
                                <span className="font-semibold text-foreground">{formatCurrency(Number(sale.vgv))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">VGC:</span>
                                <span className="font-semibold text-success">{formatCurrency(Number(sale.vgc))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tipo de Venda:</span>
                                <span className="font-medium text-foreground">{sale.sale_type || 'Não informado'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Origem:</span>
                                <span className="font-medium text-foreground">{sale.origem || 'Não informado'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground border-b pb-2">Dados Adicionais</h4>
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Captador:</span>
                                <span className="font-medium text-foreground">{sale.captador || 'Não informado'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Gerente:</span>
                                <span className="font-medium text-foreground">{sale.gerente || 'Não informado'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Produto:</span>
                                <span className="font-medium text-foreground">{sale.produto || 'Não informado'}</span>
                              </div>
                              {sale.notes && (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-muted-foreground">Observações:</span>
                                  <span className="font-medium text-foreground text-wrap">{sale.notes}</span>
                                </div>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     }
                   />
                 ))}
               </ResponsiveTable>
             </div>
           )}
         </Card>
        </div>
      </div>

      {/* Dialogs */}
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