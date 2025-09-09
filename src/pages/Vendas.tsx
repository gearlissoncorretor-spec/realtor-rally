import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Plus, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SaleForm } from "@/components/forms/SaleForm";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import type { Sale } from "@/contexts/DataContext";

const Vendas = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const { sales, loading: salesLoading, createSale, updateSale, deleteSale } = useSales();
  const { brokers } = useBrokers();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "bg-success text-success-foreground";
      case "pendente":
        return "bg-warning text-warning-foreground";
      case "cancelada":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmada":
        return "Confirmada";
      case "pendente":
        return "Pendente";
      case "cancelada":
        return "Cancelada";
      default:
        return status;
    }
  };

  const handleNewSale = () => {
    setSelectedSale(null);
    setIsFormOpen(true);
  };

  const handleEditSale = (sale: any) => {
    setSelectedSale(sale);
    setIsFormOpen(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    try {
      await deleteSale(saleId);
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
    }
  };

  const handleViewSale = (sale: Sale) => {
    toast({
      title: "Visualizar Venda",
      description: `Exibindo detalhes da venda para ${sale.client_name}`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados estão sendo preparados para download.",
    });
  };

  const handleFilter = () => {
    toast({
      title: "Filtros",
      description: "Funcionalidade de filtros em desenvolvimento.",
    });
  };

  const handleSaleSubmit = async (data: any) => {
    try {
      // Calculate commission based on broker's rate
      const selectedBroker = brokers.find(b => b.id === data.broker_id);
      const commissionRate = selectedBroker?.commission_rate || 5;
      const commission_value = (data.property_value * Number(commissionRate)) / 100;
      
      const saleData = {
        ...data,
        commission_value,
        client_email: data.client_email || null,
      };

      if (selectedSale) {
        await updateSale(selectedSale.id, saleData);
      } else {
        await createSale(saleData);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
    }
  };

  // Calculate totals from real data
  const totalSales = sales.length;
  const totalValue = sales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
  const confirmedSales = sales.filter(sale => sale.status === 'confirmada');
  const totalCommissions = confirmedSales.reduce((sum, sale) => sum + Number(sale.commission_value || 0), 0);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const thisMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Home className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Gestão de Vendas</h1>
            </div>
            <p className="text-muted-foreground">
              Controle completo de vendas e negociações
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleFilter}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" className="bg-gradient-primary" onClick={handleNewSale}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Vendas</p>
                <p className="text-2xl font-bold text-foreground">{totalSales}</p>
              </div>
              <Home className="w-8 h-8 text-primary opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {totalValue > 1000000 
                    ? `${(totalValue / 1000000).toFixed(1)}M` 
                    : `${(totalValue / 1000).toFixed(0)}K`}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Comissões</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {totalCommissions > 1000000 
                    ? `${(totalCommissions / 1000000).toFixed(1)}M` 
                    : `${(totalCommissions / 1000).toFixed(0)}K`}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-warning opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Este Mês</p>
                <p className="text-2xl font-bold text-foreground">{thisMonthSales}</p>
              </div>
              <Home className="w-8 h-8 text-info opacity-80" />
            </div>
          </Card>
        </div>

        {/* Sales Table */}
        <Card className="bg-gradient-card border-border">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Vendas Recentes</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Corretor</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Imóvel</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {salesLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Carregando vendas...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhuma venda encontrada. Clique em "Nova Venda" para adicionar a primeira.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale, index) => (
                    <tr 
                      key={sale.id} 
                      className="border-b border-border hover:bg-accent/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {sale.client_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{sale.client_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">
                          {sale.broker?.name || 'Sem corretor'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">{sale.property_address}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-foreground">
                          R$ {Number(sale.property_value).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(sale.status)}>
                          {getStatusLabel(sale.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewSale(sale)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditSale(sale)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSale(sale.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <SaleForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaleSubmit}
        sale={selectedSale}
        title={selectedSale ? "Editar Venda" : "Nova Venda"}
      />
    </div>
  );
};

export default Vendas;