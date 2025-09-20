import Navigation from "@/components/Navigation";
import { SaleForm } from "@/components/forms/SaleForm";
import SaleDetailsDialog from "@/components/SaleDetailsDialog";
import ExcelImport from "@/components/ExcelImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const { sales, loading, createSale, updateSale, deleteSale, refreshSales } = useSales();
  const { brokers } = useBrokers();

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    return sales.filter(sale =>
      sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brokers.find(b => b.id === sale.broker_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm, brokers]);

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

  const toggleRowExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedRows(newExpanded);
  };

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

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por cliente, endereço ou corretor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + Number(sale.property_value), 0))}
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

        {/* Sales Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Lista de Vendas</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead>Valor do Imóvel</TableHead>
                <TableHead>VGC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    Carregando vendas...
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    {searchTerm ? 'Nenhuma venda encontrada para o filtro aplicado.' : 'Nenhuma venda cadastrada ainda.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => {
                  const broker = brokers.find(b => b.id === sale.broker_id);
                  const isExpanded = expandedRows.has(sale.id);
                  return (
                    <>
                      <TableRow key={sale.id} className="hover:bg-muted/50">
                        <TableCell className="w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(sale.id)}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{sale.client_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{sale.property_address}</div>
                            <div className="text-muted-foreground">
                              {sale.property_type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {broker ? broker.name : "Sem corretor"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(Number(sale.property_value))}
                        </TableCell>
                        <TableCell className="font-semibold text-success">
                          {formatCurrency(Number(sale.vgc))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sale.status === 'confirmada' ? 'default' :
                              sale.status === 'pendente' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-BR') : 'Sem data'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedSale(sale);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedSale(sale);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDelete(sale.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/20">
                            <div className="p-4 space-y-3">
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
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
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