import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign, Search, Filter, CheckCircle2, Clock, XCircle,
  CreditCard, Users, Calendar, Plus, AlertTriangle, Percent,
  Download, ChevronDown, ChevronUp, User,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useCommissions, Commission, CommissionInsert } from "@/hooks/useCommissions";
import { useBrokers } from "@/hooks/useBrokers";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import InstallmentTimeline from "@/components/commissions/InstallmentTimeline";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  pago: { label: "Pago", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  parcial: { label: "Parcial", color: "bg-info/10 text-info border-info/20", icon: CreditCard },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const paymentMethodLabels: Record<string, string> = {
  pix: "PIX", transferencia: "Transferência", boleto: "Boleto",
  cheque: "Cheque", dinheiro: "Dinheiro", outro: "Outro",
};

const commissionTypeLabels: Record<string, { label: string; color: string }> = {
  venda: { label: "Venda", color: "bg-primary/10 text-primary border-primary/20" },
  captacao: { label: "Captação", color: "bg-accent/10 text-accent-foreground border-accent/20" },
};

const isOverdue = (c: Commission): boolean => {
  if (c.status === 'pago' || c.status === 'cancelado') return false;
  if (!c.due_date) return false;
  return new Date(c.due_date) < new Date(new Date().toDateString());
};

const months = [
  { value: "all", label: "Todos os meses" },
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const Comissoes = () => {
  const { commissions, loading, updateCommission, createCommission } = useCommissions();
  const { brokers } = useBrokers();
  const { sales } = useSales();
  const { isDiretor, isAdmin, isGerente } = useAuth();
  const { toast } = useToast();
  const canManage = isDiretor() || isAdmin() || isGerente();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPaidInstallments, setEditPaidInstallments] = useState(0);
  const [saving, setSaving] = useState(false);
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);

  // Period filter
  const currentYear = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const years = useMemo(() => {
    const ySet = new Set<number>();
    commissions.forEach(c => ySet.add(new Date(c.created_at).getFullYear()));
    ySet.add(currentYear);
    return [{ value: "all", label: "Todos os anos" }, ...Array.from(ySet).sort((a, b) => b - a).map(y => ({ value: y.toString(), label: y.toString() }))];
  }, [commissions, currentYear]);

  // Manual creation state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBrokerId, setNewBrokerId] = useState("");
  const [newSaleId, setNewSaleId] = useState("");
  const [newBaseValue, setNewBaseValue] = useState(0);
  const [newPercentage, setNewPercentage] = useState(5);
  const [newCommissionType, setNewCommissionType] = useState("venda");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newInstallments, setNewInstallments] = useState(1);
  const [newDueDate, setNewDueDate] = useState("");
  const [newObservations, setNewObservations] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState("lista");

  // Enrich commissions
  const enrichedCommissions = useMemo(() => {
    return commissions.map(c => {
      const broker = brokers.find(b => b.id === c.broker_id);
      const sale = sales.find(s => s.id === c.sale_id);
      return { ...c, broker, sale };
    });
  }, [commissions, brokers, sales]);

  // Period + status + search filter
  const filtered = useMemo(() => {
    return enrichedCommissions.filter(c => {
      // Period filter
      const cDate = new Date(c.created_at);
      if (filterYear !== 'all' && cDate.getFullYear() !== Number(filterYear)) return false;
      if (filterMonth !== 'all' && (cDate.getMonth() + 1) !== Number(filterMonth)) return false;

      if (statusFilter === 'atrasado') return isOverdue(c);
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const brokerMatch = c.broker?.name?.toLowerCase().includes(lower);
        const clientMatch = c.sale?.client_name?.toLowerCase().includes(lower);
        if (!brokerMatch && !clientMatch) return false;
      }
      return true;
    });
  }, [enrichedCommissions, statusFilter, searchTerm, filterMonth, filterYear]);

  // KPIs from filtered
  const totalCommission = filtered.reduce((s, c) => s + Number(c.commission_value), 0);
  const totalPaid = filtered.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.commission_value), 0);
  const totalPending = filtered.filter(c => c.status === 'pendente' || c.status === 'parcial').reduce((s, c) => s + Number(c.commission_value), 0);
  const overdueCount = filtered.filter(isOverdue).length;

  // Broker summary
  const brokerSummary = useMemo(() => {
    const map = new Map<string, { broker: typeof brokers[0]; total: number; paid: number; pending: number; count: number }>();
    filtered.forEach(c => {
      if (!c.broker) return;
      const existing = map.get(c.broker_id) || { broker: c.broker, total: 0, paid: 0, pending: 0, count: 0 };
      existing.total += Number(c.commission_value);
      existing.count += 1;
      if (c.status === 'pago') existing.paid += Number(c.commission_value);
      if (c.status === 'pendente' || c.status === 'parcial') existing.pending += Number(c.commission_value);
      map.set(c.broker_id, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const header = ['Corretor', 'Cliente', 'Tipo', 'Valor Base', '% Comissão', 'Valor Comissão', 'Status', 'Parcelas', 'Pagas', 'Vencimento', 'Pagamento', 'Observações'];
    const rows = filtered.map(c => [
      c.broker?.name || '',
      c.sale?.client_name || '',
      commissionTypeLabels[c.commission_type]?.label || c.commission_type,
      Number(c.base_value).toFixed(2),
      c.commission_percentage.toString(),
      Number(c.commission_value).toFixed(2),
      statusConfig[c.status]?.label || c.status,
      c.installments.toString(),
      c.paid_installments.toString(),
      c.due_date || '',
      c.payment_date || '',
      c.observations || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comissoes_${filterYear}_${filterMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado!', description: `${filtered.length} comissões exportadas.` });
  }, [filtered, filterYear, filterMonth, toast]);

  const openEdit = (c: Commission) => {
    setEditingCommission(c);
    setEditStatus(c.status);
    setEditPaymentDate(c.payment_date || '');
    setEditDueDate(c.due_date || '');
    setEditPaidInstallments(c.paid_installments);
  };

  const handleSaveEdit = async () => {
    if (!editingCommission) return;
    setSaving(true);
    try {
      await updateCommission({
        id: editingCommission.id,
        status: editStatus,
        payment_date: editPaymentDate || null,
        due_date: editDueDate || null,
        paid_installments: editPaidInstallments,
      } as any);
      setEditingCommission(null);
    } finally {
      setSaving(false);
    }
  };

  const resetCreateForm = () => {
    setNewBrokerId(""); setNewSaleId(""); setNewBaseValue(0); setNewPercentage(5);
    setNewCommissionType("venda"); setNewPaymentMethod(""); setNewInstallments(1);
    setNewDueDate(""); setNewObservations("");
  };

  const handleCreate = async () => {
    if (!newBrokerId || !newSaleId || newBaseValue <= 0) {
      toast({ title: "Campos obrigatórios", description: "Preencha corretor, venda e valor base.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const commissionValue = (newBaseValue * newPercentage) / 100;
      const data: CommissionInsert = {
        sale_id: newSaleId, broker_id: newBrokerId,
        commission_percentage: newPercentage, commission_value: commissionValue,
        base_value: newBaseValue, commission_type: newCommissionType,
        payment_method: newPaymentMethod || null, installments: newInstallments,
        due_date: newDueDate || null, observations: newObservations || null,
      };
      await createCommission(data);
      toast({ title: "Comissão criada", description: "Comissão registrada com sucesso." });
      setShowCreateDialog(false);
      resetCreateForm();
    } catch {
      toast({ title: "Erro", description: "Não foi possível criar a comissão.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const newCommissionValue = (newBaseValue * newPercentage) / 100;
  const brokerSalesForSelect = useMemo(() => {
    if (!newBrokerId) return sales;
    return sales.filter(s => s.broker_id === newBrokerId);
  }, [newBrokerId, sales]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-24 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-success" />
              Controle de Comissões
            </h1>
            <p className="text-xs text-muted-foreground">Gerencie os comissionamentos dos corretores</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="w-4 h-4" /> Exportar
            </Button>
            {canManage && (
              <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Nova Comissão
              </Button>
            )}
          </div>
        </div>

        {/* Overdue alert banner */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-3 p-3 mb-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">{overdueCount} comissão(ões) atrasada(s)</p>
              <p className="text-xs text-muted-foreground">Existem comissões com data de recebimento vencida.</p>
            </div>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 shrink-0"
              onClick={() => setStatusFilter('atrasado')}>Ver atrasadas</Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: DollarSign, label: "Total Comissões", value: formatCurrency(totalCommission), color: "text-primary", bg: "bg-primary/10" },
            { icon: CheckCircle2, label: "Total Pago", value: formatCurrency(totalPaid), color: "text-success", bg: "bg-success/10" },
            { icon: Clock, label: "Pendente", value: formatCurrency(totalPending), color: "text-warning", bg: "bg-warning/10" },
            { icon: AlertTriangle, label: "Atrasadas", value: overdueCount.toString(), color: overdueCount > 0 ? "text-destructive" : "text-muted-foreground", bg: overdueCount > 0 ? "bg-destructive/10" : "bg-muted/10" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="p-3 md:p-4 border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                    <Icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
              </Card>
            );
          })}
        </div>

        {/* Period Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por corretor ou cliente..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px] h-9">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="atrasado">⚠️ Atrasadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs: Lista / Resumo por Corretor */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista" className="gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Comissões</TabsTrigger>
            <TabsTrigger value="corretores" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Por Corretor</TabsTrigger>
          </TabsList>

          {/* Commission list */}
          <TabsContent value="lista">
            <Card className="overflow-hidden border-border/50">
              <div className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Nenhuma comissão encontrada</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Ajuste os filtros ou cadastre uma nova comissão</p>
                  </div>
                ) : (
                  filtered.map((c) => {
                    const broker = c.broker;
                    const sale = c.sale;
                    const overdue = isOverdue(c);
                    const config = statusConfig[c.status] || statusConfig.pendente;
                    const StatusIcon = config.icon;
                    const initials = broker?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
                    const installmentText = c.installments > 1 ? `${c.paid_installments}/${c.installments} parcelas` : 'À vista';

                    return (
                      <div key={c.id}
                        className={cn(
                          "flex items-center gap-3 p-3 md:p-4 hover:bg-accent/30 transition-colors cursor-pointer",
                          overdue && "bg-destructive/5 hover:bg-destructive/10"
                        )}
                        onClick={() => canManage && openEdit(c)}
                      >
                        <Avatar className="h-10 w-10 ring-2 ring-border/50 shrink-0">
                          <AvatarImage src={broker?.avatar_url || ''} />
                          <AvatarFallback className="text-xs font-bold bg-muted">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-foreground truncate">{broker?.name || 'Corretor'}</p>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                              <StatusIcon className="w-3 h-3 mr-0.5" />{config.label}
                            </Badge>
                            {overdue && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">
                                <AlertTriangle className="w-3 h-3 mr-0.5" />Atrasada
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span>{sale?.client_name || 'Cliente'}</span>
                            <span>·</span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", (commissionTypeLabels[c.commission_type] || commissionTypeLabels.venda).color)}>
                              {(commissionTypeLabels[c.commission_type] || commissionTypeLabels.venda).label}
                            </Badge>
                            <span>·</span>
                            <span>{c.commission_percentage}%</span>
                            <span>·</span>
                            <span>{installmentText}</span>
                            {c.due_date && (
                              <>
                                <span>·</span>
                                <span className={cn("flex items-center gap-0.5", overdue && "text-destructive font-medium")}>
                                  <Calendar className="w-3 h-3" />
                                  {new Date(c.due_date).toLocaleDateString('pt-BR')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm text-foreground">{formatCurrency(Number(c.commission_value))}</p>
                          <p className="text-[10px] text-muted-foreground">Base: {formatCurrency(Number(c.base_value))}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Broker summary */}
          <TabsContent value="corretores">
            <div className="space-y-3">
              {brokerSummary.length === 0 ? (
                <Card className="p-10 text-center border-border/50">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Nenhum corretor com comissões no período</p>
                </Card>
              ) : (
                brokerSummary.map(({ broker, total, paid, pending, count }) => {
                  const initials = broker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                  const isExpanded = expandedBroker === broker.id;
                  const brokerCommissions = filtered.filter(c => c.broker_id === broker.id);

                  return (
                    <Card key={broker.id} className="border-border/50 overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                        onClick={() => setExpandedBroker(isExpanded ? null : broker.id)}
                      >
                        <Avatar className="h-10 w-10 ring-2 ring-border/50 shrink-0">
                          <AvatarImage src={broker.avatar_url || ''} />
                          <AvatarFallback className="text-xs font-bold bg-muted">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{broker.name}</p>
                          <p className="text-xs text-muted-foreground">{count} comissão(ões)</p>
                        </div>
                        <div className="flex gap-4 items-center text-right">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Total</p>
                            <p className="text-sm font-bold text-foreground">{formatCurrency(total)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-success">Pago</p>
                            <p className="text-sm font-bold text-success">{formatCurrency(paid)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-warning">Pendente</p>
                            <p className="text-sm font-bold text-warning">{formatCurrency(pending)}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border divide-y divide-border/50">
                          {brokerCommissions.map(c => {
                            const sale = c.sale;
                            const config = statusConfig[c.status] || statusConfig.pendente;
                            const StatusIcon = config.icon;
                            return (
                              <div key={c.id}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors cursor-pointer"
                                onClick={() => canManage && openEdit(c)}
                              >
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", config.color)}>
                                  <StatusIcon className="w-3 h-3 mr-0.5" />{config.label}
                                </Badge>
                                <span className="text-muted-foreground truncate flex-1">{sale?.client_name || 'Cliente'}</span>
                                <span className="text-muted-foreground">{c.commission_percentage}%</span>
                                <span className="font-bold text-foreground">{formatCurrency(Number(c.commission_value))}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Commission Dialog */}
      <Dialog open={!!editingCommission} onOpenChange={(open) => !open && setEditingCommission(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Atualizar Comissão
            </DialogTitle>
          </DialogHeader>

          {editingCommission && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Valor da Comissão</p>
                <p className="text-2xl font-black text-success">{formatCurrency(Number(editingCommission.commission_value))}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="parcial">Parcialmente Pago</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Previsão Recebimento
                  </Label>
                  <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data Pagamento
                  </Label>
                  <Input type="date" value={editPaymentDate} onChange={(e) => setEditPaymentDate(e.target.value)} />
                </div>
              </div>

              {editingCommission.installments > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Parcelas pagas ({editingCommission.installments} total)</Label>
                  <Input type="number" value={editPaidInstallments}
                    onChange={(e) => setEditPaidInstallments(Number(e.target.value))}
                    min={0} max={editingCommission.installments} />
                </div>
              )}

              {isOverdue(editingCommission) && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive font-medium">
                    Atrasada desde {new Date(editingCommission.due_date!).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Installment Timeline */}
              {editingCommission.installments > 1 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Timeline de Parcelas</p>
                  <InstallmentTimeline
                    commissionId={editingCommission.id}
                    commissionValue={Number(editingCommission.commission_value)}
                    installmentCount={editingCommission.installments}
                    canManage={canManage}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCommission(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Commission Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); resetCreateForm(); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              Nova Comissão Manual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Corretor *</Label>
              <Select value={newBrokerId} onValueChange={setNewBrokerId}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione o corretor..." /></SelectTrigger>
                <SelectContent>
                  {brokers.filter(b => b.status === 'ativo').map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Venda Vinculada *</Label>
              <Select value={newSaleId} onValueChange={setNewSaleId}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione a venda..." /></SelectTrigger>
                <SelectContent>
                  {brokerSalesForSelect.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.client_name} — {formatCurrency(Number(s.property_value))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Origem da Comissão</Label>
              <Select value={newCommissionType} onValueChange={setNewCommissionType}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="captacao">Captação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><DollarSign className="w-3 h-3" /> Valor Base</Label>
                <CurrencyInput value={newBaseValue} onChange={setNewBaseValue} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Percent className="w-3 h-3" /> % Comissão</Label>
                <Input type="number" value={newPercentage} onChange={(e) => setNewPercentage(Number(e.target.value))}
                  step="0.1" min="0" max="100" className="h-9" />
              </div>
            </div>

            {newBaseValue > 0 && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Valor da Comissão</p>
                <p className="text-2xl font-black text-success">{formatCurrency(newCommissionValue)}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><CreditCard className="w-3 h-3" /> Pagamento</Label>
                <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Parcelas</Label>
                <Input type="number" value={newInstallments} onChange={(e) => setNewInstallments(Number(e.target.value))}
                  min="1" className="h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data Prevista para Recebimento
              </Label>
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="h-9" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea value={newObservations} onChange={(e) => setNewObservations(e.target.value)}
                placeholder="Observações sobre o comissionamento..." rows={2} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetCreateForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              <DollarSign className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Registrar Comissão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comissoes;
