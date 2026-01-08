import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2,
  Target,
  DollarSign,
  Phone,
  Mail,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BrokerForm } from "@/components/forms/BrokerForm";
import BrokerDetailsModal from "@/components/BrokerDetailsModal";
import { useBrokers } from "@/hooks/useBrokers";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import type { Broker } from "@/contexts/DataContext";
import { CorretoresSkeleton } from "@/components/skeletons/CorretoresSkeleton";
import { formatCurrency } from "@/utils/formatting";

const Corretores = () => {
  const { toast } = useToast();
  const { user, isGerente, isDiretor, isAdmin } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [detailsBroker, setDetailsBroker] = useState<Broker | null>(null);
  const [deleteConfirmBroker, setDeleteConfirmBroker] = useState<Broker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  // Check if user can delete a specific broker
  const canDeleteBroker = (broker: Broker): boolean => {
    // Admin and directors can delete any broker
    if (isAdmin() || isDiretor()) {
      return true;
    }
    // Managers can only delete brokers they created
    if (isGerente()) {
      return broker.created_by === user?.id;
    }
    return false;
  };

  const handleDeleteBroker = async () => {
    if (!deleteConfirmBroker) return;
    
    // Check permission before deleting
    if (!canDeleteBroker(deleteConfirmBroker)) {
      toast({
        title: "Sem permissão",
        description: "Você só pode excluir corretores que você mesmo criou.",
        variant: "destructive",
      });
      setDeleteConfirmBroker(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBroker(deleteConfirmBroker.id);
      setDeleteConfirmBroker(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível excluir o corretor.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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

  // Calculate broker statistics - exclude distratos
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
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-3 sm:p-4 lg:p-6">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              👥 Corretores
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie sua equipe de vendas
            </p>
          </div>
          <Button className="w-full sm:w-auto h-11" onClick={handleNewBroker}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Corretor
          </Button>
        </div>

        {brokersLoading && brokers.length === 0 ? (
          <CorretoresSkeleton />
        ) : brokers.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Nenhum corretor encontrado. Clique em "Adicionar Corretor" para começar.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {brokers.map((broker, index) => {
              const stats = getBrokerStats(broker.id);
              const canDelete = canDeleteBroker(broker);
              
              return (
                <Card 
                  key={broker.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-4 sm:p-6">
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-4 lg:hidden">
                      {/* Header with avatar and status */}
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 shrink-0">
                          <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-lg">
                            {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {broker.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{broker.email}</span>
                          </div>
                          {broker.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="w-3 h-3 shrink-0" />
                              {broker.phone}
                            </div>
                          )}
                        </div>
                        
                        <Badge 
                          variant="secondary" 
                          className={broker.status === 'ativo' 
                            ? "bg-green-500/10 text-green-600 border-green-500/20 shrink-0" 
                            : "bg-muted/10 text-muted-foreground shrink-0"
                          }
                        >
                          {broker.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 text-primary mb-1">
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-medium">Vendas</span>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            {stats.salesCount}/{broker.meta_monthly || 0}
                          </p>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium">Faturamento</span>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            {formatCurrency(stats.totalRevenue)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 h-10"
                          onClick={() => handleEditBroker(broker)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`h-10 ${canDelete ? 'text-destructive hover:text-destructive' : 'opacity-50'}`}
                          onClick={() => canDelete ? setDeleteConfirmBroker(broker) : toast({
                            title: "Sem permissão",
                            description: "Você só pode excluir corretores que você criou.",
                            variant: "destructive"
                          })}
                          disabled={!canDelete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{broker.name}</h3>
                          <p className="text-muted-foreground mb-2">{broker.email}</p>
                          <Badge 
                            variant="secondary" 
                            className={broker.status === 'ativo' 
                              ? "bg-green-500/10 text-green-600" 
                              : "bg-muted/10 text-muted-foreground"
                            }
                          >
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
                          <p className="text-2xl font-bold text-foreground">
                            {stats.salesCount}/{broker.meta_monthly || 0}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">Faturamento</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(stats.totalRevenue)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditBroker(broker)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={canDelete ? "text-destructive hover:text-destructive" : "opacity-50"}
                          onClick={() => canDelete ? setDeleteConfirmBroker(broker) : toast({
                            title: "Sem permissão",
                            description: "Você só pode excluir corretores que você criou.",
                            variant: "destructive"
                          })}
                          disabled={!canDelete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BrokerForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleBrokerSubmit}
        broker={selectedBroker}
        title={selectedBroker ? "Editar Corretor" : "Novo Corretor"}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmBroker} onOpenChange={() => setDeleteConfirmBroker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Corretor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o corretor <strong>{deleteConfirmBroker?.name}</strong>? 
              Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBroker}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Corretores;