import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  Star,
  Calendar,
  Mail,
  Phone,
  Edit3,
  Save,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatting";
import type { Broker, Sale } from "@/contexts/DataContext";

interface BrokerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  broker: Broker | null;
  sales: Sale[];
  onUpdateBroker: (id: string, data: Partial<Broker>) => Promise<void>;
}

const BrokerDetailsModal = ({ 
  isOpen, 
  onClose, 
  broker, 
  sales, 
  onUpdateBroker 
}: BrokerDetailsModalProps) => {
  const { toast } = useToast();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (broker) {
      setNewGoal(String(broker.meta_monthly || 0));
    }
  }, [broker]);

  if (!broker) return null;

  const brokerSales = sales.filter(sale => sale.broker_id === broker.id);
  const confirmedSales = brokerSales.filter(sale => sale.status === 'confirmada');
  const totalRevenue = confirmedSales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
  const totalCommission = confirmedSales.reduce((sum, sale) => {
    const commissionRate = Number(broker.commission_rate || 5) / 100;
    return sum + (Number(sale.property_value || 0) * commissionRate);
  }, 0);
  const salesCount = confirmedSales.length;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlySales = confirmedSales.filter(sale => {
    const saleDate = new Date(sale.sale_date || sale.created_at || '');
    return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
  const goalProgress = broker.meta_monthly ? (monthlyRevenue / Number(broker.meta_monthly)) * 100 : 0;

  const handleSaveGoal = async () => {
    try {
      await onUpdateBroker(broker.id, { 
        meta_monthly: Number(newGoal) || 0 
      });
      setIsEditingGoal(false);
      toast({
        title: "Meta atualizada",
        description: "Meta mensal atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive",
      });
    }
  };

  const getPerformanceBadge = () => {
    if (goalProgress >= 100) return { color: "bg-success/10 text-success", text: "Meta Alcançada!" };
    if (goalProgress >= 80) return { color: "bg-warning/10 text-warning", text: "Quase Lá!" };
    if (goalProgress >= 50) return { color: "bg-info/10 text-info", text: "Em Progresso" };
    return { color: "bg-muted/10 text-muted-foreground", text: "Início do Mês" };
  };

  const performanceBadge = getPerformanceBadge();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{broker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{broker.name}</h2>
              <p className="text-muted-foreground text-sm">{broker.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <DollarSign className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalCommission)}
              </p>
              <p className="text-sm text-muted-foreground">Comissão Total</p>
            </Card>

            <Card className="p-4 text-center">
              <Target className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{salesCount}</p>
              <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
            </Card>

            <Card className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {salesCount > 0 ? formatCurrency(totalRevenue / salesCount) : 'R$ 0,00'}
              </p>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
            </Card>

            <Card className="p-4 text-center">
              <Star className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{goalProgress.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Meta do Mês</p>
            </Card>
          </div>

          {/* Goal Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Meta Mensal</h3>
              <Badge className={performanceBadge.color}>
                {performanceBadge.text}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium min-w-[80px]">Meta Atual:</Label>
                {isEditingGoal ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Digite a nova meta"
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSaveGoal}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingGoal(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg font-bold">
                      {formatCurrency(Number(broker.meta_monthly || 0))}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingGoal(true)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium min-w-[80px]">Alcançado:</Label>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(monthlyRevenue)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso da Meta</span>
                  <span>{goalProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-success h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(goalProgress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Faltam {formatCurrency(Math.max(0, Number(broker.meta_monthly || 0) - monthlyRevenue))} para atingir a meta
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{broker.email}</span>
              </div>
              
              {broker.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{broker.phone}</span>
                </div>
              )}
              
              {broker.creci && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">CRECI:</span>
                  <span className="text-sm">{broker.creci}</span>
                </div>
              )}
              
              {broker.hire_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Desde {new Date(broker.hire_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrokerDetailsModal;