import Navigation from "@/components/Navigation";
import { SaleForm } from "@/components/forms/SaleForm";
import SaleDetailsDialog from "@/components/SaleDetailsDialog";
import ExcelImport from "@/components/ExcelImport";
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
import { formatCurrency } from "@/utils/formatting";
import type { Sale } from "@/contexts/DataContext";

const Vendas = () => {
  const { toast } = useToast();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { sales, loading, createSale, updateSale, deleteSale, refreshSales } = useSales();
  const { brokers } = useBrokers();

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
  }, [brokers, sales]);

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
    filterConfigs
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

  // Define table columns for responsive table
  const tableColumns: ColumnConfig[] = [
    {
      key: 'client_name',
      label: 'Cliente',
      priority: 'high',
    },
    {
      key: 'property_address',
      label: 'Imóvel',
      priority: 'high',
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium">{value}</div>
          <div className="text-muted-foreground">{row.property_type}</div>
        </div>
      ),
    },
    {
      key: 'broker_name',
      label: 'Corretor',
      priority: 'medium',
      render: (_, row) => {
        const broker = brokers.find(b => b.id === row.broker_id);
        return broker ? broker.name : "Sem corretor";
      },
    },
    {
      key: 'property_value',
      label: 'Valor do Imóvel',
      priority: 'medium',
      render: (value) => (
        <span className="font-semibold">
          {formatCurrency(Number(value))}
        </span>
      ),
    },
    {
      key: 'vgc',
      label: 'VGC',
      priority: 'low',
      render: (value) => (
        <span className="font-semibold text-success">
          {formatCurrency(Number(value))}
        </span>
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
            'destructive'
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'sale_date',
      label: 'Data',
      priority: 'low',
      render: (value) => 
        value ? new Date(value).toLocaleDateString('pt-BR') : 'Sem data',
    },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Vendas</h1>
            <p className="text-muted-foreground">Controle completo de vendas e negociações</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
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
                    // Handle form submission
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
          className="mb-6"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl font-bold">{filteredSales.length}</p>
              </div>
              <User className="w-8 h-8 text-primary opacity-80" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VGV Total</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + Number(sale.vgv), 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success opacity-80" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VGC Total</p>
                <p className="text-2xl font-bold text-info">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + Number(sale.vgc), 0))}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-info opacity-80" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Confirmadas</p>
                <p className="text-2xl font-bold text-warning">
                  {filteredSales.filter(sale => sale.status === 'confirmada').length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-warning opacity-80" />
            </div>
          </Card>
        </div>

        {/* Enhanced Responsive Sales Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Lista de Vendas</h3>
          </div>
          
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-muted-foreground">Carregando vendas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-muted-foreground">
                {searchTerm || activeFilters.length > 0 
                  ? 'Nenhuma venda encontrada para os filtros aplicados.' 
                  : 'Nenhuma venda cadastrada ainda.'}
              </p>
            </div>
          ) : (
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
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Informações do Cliente</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Nome:</strong> {sale.client_name}</p>
                            <p><strong>Telefone:</strong> {sale.client_phone || 'Não informado'}</p>
                            <p><strong>Email:</strong> {sale.client_email || 'Não informado'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Detalhes da Venda</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>VGV:</strong> {formatCurrency(Number(sale.vgv))}</p>
                            <p><strong>VGC:</strong> {formatCurrency(Number(sale.vgc))}</p>
                            <p><strong>Tipo de Venda:</strong> {sale.sale_type || 'Não informado'}</p>
                            <p><strong>Origem:</strong> {sale.origem || 'Não informado'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Informações Adicionais</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Captador:</strong> {sale.captador || 'Não informado'}</p>
                            <p><strong>Gerente:</strong> {sale.gerente || 'Não informado'}</p>
                            <p><strong>Produto:</strong> {sale.produto || 'Não informado'}</p>
                            <p><strong>Estilo:</strong> {sale.estilo || 'Não informado'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {sale.notes && (
                        <div className="pt-2 border-t">
                          <h4 className="font-medium text-sm mb-1">Observações</h4>
                          <p className="text-sm text-muted-foreground">{sale.notes}</p>
                        </div>
                      )}
                    </div>
                  }
                />
              ))}
            </ResponsiveTable>
          )}
        </Card>

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
    </div>
  );
};

export default Vendas;