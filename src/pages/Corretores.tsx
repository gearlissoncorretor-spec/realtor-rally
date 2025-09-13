import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2,
  Star,
  TrendingUp,
  Target,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BrokerForm } from "@/components/forms/BrokerForm";
import BrokerDetailsModal from "@/components/BrokerDetailsModal";
import { useBrokers } from "@/hooks/useBrokers";
import { useSales } from "@/hooks/useSales";
import type { Broker } from "@/contexts/DataContext";

const Corretores = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [detailsBroker, setDetailsBroker] = useState<Broker | null>(null);
  
  const { brokers, loading: brokersLoading, createBroker, updateBroker, deleteBroker } = useBrokers();
  const { sales } = useSales();

  const handleNewBroker = () => {
    setSelectedBroker(null);
    setIsFormOpen(true);
  };

  const handleEditBroker = (broker: Broker) => {
    setSelectedBroker(broker);
    setIsFormOpen(true);
  };

  const handleDeleteBroker = async (brokerId: string) => {
    try {
      await deleteBroker(brokerId);
    } catch (error) {
      console.error('Erro ao excluir corretor:', error);
    }
  };

  const handleBrokerSubmit = async (data: any) => {
    try {
      if (selectedBroker) {
        await updateBroker(selectedBroker.id, data);
      } else {
        await createBroker(data);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar corretor:', error);
    }
  };

  // Calculate broker statistics
  const getBrokerStats = (brokerId: string) => {
    const brokerSales = sales.filter(sale => sale.broker_id === brokerId);
    const confirmedSales = brokerSales.filter(sale => sale.status === 'confirmada');
    const totalRevenue = confirmedSales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
    const salesCount = confirmedSales.length;
    
    return {
      salesCount,
      totalRevenue,
      conversionRate: brokerSales.length > 0 ? Math.round((confirmedSales.length / brokerSales.length) * 100) : 0
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
              Corretores
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Gerencie sua equipe de vendas
            </p>
          </div>
          <Button className="animate-fade-in" style={{ animationDelay: '0.2s' }} onClick={handleNewBroker}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Corretor
          </Button>
        </div>

        <div className="grid gap-6">
          {brokersLoading ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Carregando corretores...</p>
            </Card>
          ) : brokers.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Nenhum corretor encontrado. Clique em "Adicionar Corretor" para começar.
              </p>
            </Card>
          ) : (
            brokers.map((broker, index) => {
              const stats = getBrokerStats(broker.id);
              return (
                <Card key={broker.id} className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{broker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{broker.name}</h3>
                        <p className="text-muted-foreground mb-2">{broker.email}</p>
                        <Badge variant="secondary" className={broker.status === 'ativo' ? "bg-success/10 text-success" : "bg-muted/10 text-muted-foreground"}>
                          {broker.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-8">
                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Vendas</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.salesCount}/{broker.meta_monthly || 0}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-success" />
                          <span className="text-sm text-muted-foreground">Meta</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          R$ {stats.totalRevenue > 1000000 
                            ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` 
                            : `${(stats.totalRevenue / 1000).toFixed(0)}K`}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-info" />
                          <span className="text-sm text-muted-foreground">Ticket Médio</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          R$ {stats.salesCount > 0 ? (stats.totalRevenue / stats.salesCount / 1000).toFixed(0) : '0'}K
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditBroker(broker)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteBroker(broker.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <BrokerForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleBrokerSubmit}
        broker={selectedBroker}
        title={selectedBroker ? "Editar Corretor" : "Novo Corretor"}
      />
    </div>
  );
};

export default Corretores;