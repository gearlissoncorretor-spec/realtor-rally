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

const Vendas = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  const vendas = [
    {
      id: "1",
      cliente: "João da Silva",
      corretor: "Ana Silva",
      imovel: "Apt 101 - Edifício Sunset",
      valor: 450000,
      status: "Fechada",
      data: "2024-01-15",
      comissao: 22500
    },
    {
      id: "2",
      cliente: "Maria Santos",
      corretor: "Carlos Santos", 
      imovel: "Casa Jardim América",
      valor: 680000,
      status: "Em Negociação",
      data: "2024-01-18",
      comissao: 34000
    },
    {
      id: "3",
      cliente: "Pedro Oliveira",
      corretor: "Maria Oliveira",
      imovel: "Cobertura Vista Mar",
      valor: 850000,
      status: "Proposta Enviada",
      data: "2024-01-20",
      comissao: 42500
    },
    {
      id: "4",
      cliente: "Ana Costa",
      corretor: "João Costa",
      imovel: "Terreno Industrial",
      valor: 320000,
      status: "Fechada",
      data: "2024-01-22", 
      comissao: 16000
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fechada":
        return "bg-success text-success-foreground";
      case "Em Negociação":
        return "bg-warning text-warning-foreground";
      case "Proposta Enviada":
        return "bg-info text-info-foreground";
      default:
        return "bg-muted text-muted-foreground";
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

  const handleDeleteSale = (saleId: string) => {
    toast({
      title: "Venda excluída",
      description: "A venda foi removida com sucesso.",
    });
  };

  const handleViewSale = (sale: any) => {
    toast({
      title: "Visualizar Venda",
      description: `Exibindo detalhes da venda para ${sale.cliente}`,
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
    toast({
      title: "Venda salva",
      description: "Os dados da venda foram salvos com sucesso.",
    });
  };

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
                <p className="text-2xl font-bold text-foreground">24</p>
              </div>
              <Home className="w-8 h-8 text-primary opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">R$ 2.4M</p>
              </div>
              <DollarSign className="w-8 h-8 text-success opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Comissões</p>
                <p className="text-2xl font-bold text-foreground">R$ 120K</p>
              </div>
              <Calendar className="w-8 h-8 text-warning opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Este Mês</p>
                <p className="text-2xl font-bold text-foreground">8</p>
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
                {vendas.map((venda, index) => (
                  <tr 
                    key={venda.id} 
                    className="border-b border-border hover:bg-accent/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {venda.cliente.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{venda.cliente}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">{venda.corretor}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">{venda.imovel}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-foreground">
                        R$ {venda.valor.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(venda.status)}>
                        {venda.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(venda.data).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewSale(venda)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditSale(venda)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSale(venda.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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