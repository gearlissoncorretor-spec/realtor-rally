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

const Corretores = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  
  const corretores = [
    {
      id: 1,
      name: "Ana Silva",
      email: "ana@empresa.com",
      vendas: 8,
      meta: 10,
      revenue: 850000,
      status: "Ativo",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Carlos Santos",
      email: "carlos@empresa.com",
      vendas: 6,
      meta: 8,
      revenue: 720000,
      status: "Ativo",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Maria Oliveira",
      email: "maria@empresa.com",
      vendas: 5,
      meta: 7,
      revenue: 650000,
      status: "Ativo",
      avatar: "/placeholder.svg"
    }
  ];

  const handleNewBroker = () => {
    setSelectedBroker(null);
    setIsFormOpen(true);
  };

  const handleEditBroker = (broker: any) => {
    setSelectedBroker(broker);
    setIsFormOpen(true);
  };

  const handleDeleteBroker = (brokerId: number) => {
    toast({
      title: "Corretor excluído",
      description: "O corretor foi removido com sucesso.",
    });
  };

  const handleBrokerSubmit = async (data: any) => {
    toast({
      title: "Corretor salvo",
      description: "Os dados do corretor foram salvos com sucesso.",
    });
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
          {corretores.map((corretor, index) => (
            <Card key={corretor.id} className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={corretor.avatar} />
                    <AvatarFallback>{corretor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{corretor.name}</h3>
                    <p className="text-muted-foreground mb-2">{corretor.email}</p>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {corretor.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Vendas</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{corretor.vendas}/{corretor.meta}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-success" />
                      <span className="text-sm text-muted-foreground">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      R$ {(corretor.revenue / 1000)}K
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-info" />
                      <span className="text-sm text-muted-foreground">Taxa</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round((corretor.vendas / corretor.meta) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditBroker(corretor)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteBroker(corretor.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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