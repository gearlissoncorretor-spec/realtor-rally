import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X,
  Trophy,
  MessageCircle,
  BarChart3,
  Briefcase,
  Clock
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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

const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) => (
  <Card className="p-4 text-center border-border/40">
    <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
  </Card>
);

const BrokerDetailsModal = ({ isOpen, onClose, broker, sales, onUpdateBroker }: BrokerDetailsModalProps) => {
  const { toast } = useToast();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState(0);
  const [newGoalSalesCount, setNewGoalSalesCount] = useState('');

  useEffect(() => {
    if (broker) {
      setNewGoalValue(Number(broker.meta_monthly || 0));
      // Sales count goal could be stored elsewhere; for now derive from meta or default 0
      setNewGoalSalesCount('');
    }
  }, [broker]);

  const stats = useMemo(() => {
    if (!broker) return null;
    const brokerSales = sales.filter(s => s.broker_id === broker.id);
    const confirmed = brokerSales.filter(s => s.status !== 'cancelada' && s.status !== 'distrato');
    const totalVGV = confirmed.reduce((sum, s) => sum + Number(s.vgv || s.property_value || 0), 0);
    const totalVGC = confirmed.reduce((sum, s) => sum + Number(s.vgc || 0), 0);
    const count = confirmed.length;
    const ticketMedio = count > 0 ? totalVGV / count : 0;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthly = confirmed.filter(s => {
      const d = new Date(s.sale_date || s.created_at || '');
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const monthlyRevenue = monthly.reduce((sum, s) => sum + Number(s.vgv || s.property_value || 0), 0);
    const goalProgress = broker.meta_monthly ? (monthlyRevenue / Number(broker.meta_monthly)) * 100 : 0;

    const lastSale = confirmed.length > 0 
      ? confirmed.sort((a, b) => new Date(b.sale_date || b.created_at || '').getTime() - new Date(a.sale_date || a.created_at || '').getTime())[0]
      : null;

    // Monthly evolution (last 6 months)
    const evolution = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthSales = confirmed.filter(s => {
        const sd = new Date(s.sale_date || s.created_at || '');
        return sd.getMonth() + 1 === m && sd.getFullYear() === y;
      });
      const rev = monthSales.reduce((sum, s) => sum + Number(s.vgv || s.property_value || 0), 0);
      evolution.push({ month: d.toLocaleDateString('pt-BR', { month: 'short' }), sales: monthSales.length, revenue: rev });
    }

    return { totalVGV, totalVGC, count, ticketMedio, monthlyRevenue, goalProgress, lastSale, monthly, evolution, confirmed };
  }, [broker, sales]);

  if (!broker || !stats) return null;

  const handleSaveGoal = async () => {
    try {
      await onUpdateBroker(broker.id, { meta_monthly: newGoalValue || 0 });
      setIsEditingGoal(false);
      toast({ title: "Meta atualizada", description: "Meta mensal atualizada com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar a meta.", variant: "destructive" });
    }
  };

  const getGoalBadge = () => {
    if (stats.goalProgress >= 100) return { color: "bg-emerald-500/15 text-emerald-400", text: "Meta Alcançada!" };
    if (stats.goalProgress >= 70) return { color: "bg-amber-500/15 text-amber-400", text: "Quase Lá!" };
    if (stats.goalProgress >= 30) return { color: "bg-primary/15 text-primary", text: "Em Progresso" };
    return { color: "bg-muted text-muted-foreground", text: "Início do Mês" };
  };

  const goalBadge = getGoalBadge();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-border">
              <AvatarImage src={broker.avatar_url || undefined} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{broker.name}</DialogTitle>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{broker.email}</span>
                {broker.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{broker.phone}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={broker.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px]">
                  {broker.status === 'ativo' ? 'Ativo' : broker.status === 'ferias' ? 'Férias' : 'Inativo'}
                </Badge>
                {broker.creci && <Badge variant="outline" className="text-[10px]">CRECI: {broker.creci}</Badge>}
                {broker.hire_date && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Desde {new Date(broker.hire_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            {broker.phone && (
              <Button size="sm" variant="outline" className="shrink-0 text-emerald-500 hover:text-emerald-400 border-emerald-500/30"
                onClick={() => window.open(`https://wa.me/55${broker.phone?.replace(/\D/g, '')}`, '_blank')}>
                <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Performance KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard icon={<DollarSign className="w-5 h-5 text-emerald-400" />} value={formatCurrency(stats.totalVGC)} label="VGC Total" color="bg-emerald-500/10" />
              <StatCard icon={<TrendingUp className="w-5 h-5 text-primary" />} value={formatCurrency(stats.totalVGV)} label="VGV Total" color="bg-primary/10" />
              <StatCard icon={<Target className="w-5 h-5 text-blue-400" />} value={stats.count} label="Vendas" color="bg-blue-500/10" />
              <StatCard icon={<BarChart3 className="w-5 h-5 text-amber-400" />} value={formatCurrency(stats.ticketMedio)} label="Ticket Médio" color="bg-amber-500/10" />
              <StatCard icon={<Star className="w-5 h-5 text-amber-400" />} value={`${stats.goalProgress.toFixed(0)}%`} label="Meta do Mês" color="bg-amber-500/10" />
            </div>

            <Tabs defaultValue="meta" className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="meta" className="text-xs">Meta Mensal</TabsTrigger>
                <TabsTrigger value="evolucao" className="text-xs">Evolução</TabsTrigger>
                <TabsTrigger value="vendas" className="text-xs">Histórico de Vendas</TabsTrigger>
              </TabsList>

              {/* Meta Tab */}
              <TabsContent value="meta" className="mt-4">
                <Card className="p-5 border-border/40">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Meta Mensal</h3>
                    <Badge className={goalBadge.color}>{goalBadge.text}</Badge>
                  </div>
                  <div className="space-y-4">
                    {/* Meta em R$ */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium min-w-[80px]">Meta (R$):</Label>
                      {isEditingGoal ? (
                        <CurrencyInput 
                          value={newGoalValue} 
                          onChange={(val) => setNewGoalValue(val)} 
                          className="flex-1 h-9" 
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{formatCurrency(Number(broker.meta_monthly || 0))}</span>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingGoal(true)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </div>

                    {/* Meta em número de vendas */}
                    {isEditingGoal && (
                      <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium min-w-[80px]">Vendas:</Label>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={newGoalSalesCount} 
                          onChange={(e) => setNewGoalSalesCount(e.target.value.replace(/\D/g, ''))} 
                          placeholder="Ex: 10 vendas"
                          className="flex-1 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    )}

                    {isEditingGoal && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={handleSaveGoal}><Save className="w-3.5 h-3.5 mr-1" /> Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingGoal(false)}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium min-w-[80px]">Alcançado:</Label>
                      <span className="text-lg font-bold text-emerald-400">{formatCurrency(stats.monthlyRevenue)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span className="font-semibold">{stats.goalProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(stats.goalProgress, 100)} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Faltam {formatCurrency(Math.max(0, Number(broker.meta_monthly || 0) - stats.monthlyRevenue))} para atingir a meta
                    </p>
                  </div>
                </Card>
              </TabsContent>

              {/* Evolution Tab */}
              <TabsContent value="evolucao" className="mt-4">
                <Card className="p-5 border-border/40">
                  <h3 className="text-sm font-semibold mb-4">Evolução (últimos 6 meses)</h3>
                  <div className="space-y-3">
                    {stats.evolution.map((m, i) => {
                      const maxRev = Math.max(...stats.evolution.map(e => e.revenue), 1);
                      const pct = (m.revenue / maxRev) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-10 uppercase">{m.month}</span>
                          <div className="flex-1 bg-muted/30 rounded-full h-5 relative overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%` }} />
                            <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium">
                              {m.sales} venda(s) — {formatCurrency(m.revenue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </TabsContent>

              {/* Sales History Tab */}
              <TabsContent value="vendas" className="mt-4">
                <Card className="p-5 border-border/40">
                  <h3 className="text-sm font-semibold mb-4">Últimas Vendas ({stats.confirmed.length})</h3>
                  {stats.confirmed.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda registrada.</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {stats.confirmed
                        .sort((a, b) => new Date(b.sale_date || b.created_at || '').getTime() - new Date(a.sale_date || a.created_at || '').getTime())
                        .slice(0, 20)
                        .map(sale => (
                          <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{sale.client_name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{sale.property_address}</p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold text-foreground">{formatCurrency(Number(sale.vgv || sale.property_value || 0))}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-BR') : '-'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BrokerDetailsModal;
