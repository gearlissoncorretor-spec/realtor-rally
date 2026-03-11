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
import {
  DollarSign, Search, Filter, CheckCircle2, Clock, XCircle,
  CreditCard, Users, Calendar, Plus, AlertTriangle, Percent,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCommissions, Commission, CommissionInsert } from "@/hooks/useCommissions";
import { useBrokers } from "@/hooks/useBrokers";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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

  // Enrich commissions with broker/sale data
  const enrichedCommissions = useMemo(() => {
    return commissions.map(c => {
      const broker = brokers.find(b => b.id === c.broker_id);
      const sale = sales.find(s => s.id === c.sale_id);
      return { ...c, broker, sale };
    });
  }, [commissions, brokers, sales]);

  const filtered = useMemo(() => {
    return enrichedCommissions.filter(c => {
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
  }, [enrichedCommissions, statusFilter, searchTerm]);

  // KPIs
  const totalCommission = enrichedCommissions.reduce((s, c) => s + Number(c.commission_value), 0);
  const totalPaid = enrichedCommissions.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.commission_value), 0);
  const totalPending = enrichedCommissions.filter(c => c.status === 'pendente' || c.status === 'parcial').reduce((s, c) => s + Number(c.commission_value), 0);
  const overdueCount = enrichedCommissions.filter(isOverdue).length;

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
    setNewBrokerId("");
    setNewSaleId("");
    setNewBaseValue(0);
    setNewPercentage(5);
    setNewCommissionType("venda");
    setNewPaymentMethod("");
    setNewInstallments(1);
    setNewDueDate("");
    setNewObservations("");
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
        sale_id: newSaleId,
        broker_id: newBrokerId,
        commission_percentage: newPercentage,
        commission_value: commissionValue,
        base_value: newBaseValue,
        commission_type: newCommissionType,
        payment_method: newPaymentMethod || null,
        installments: newInstallments,
        due_date: newDueDate || null,
        observations: newObservations || null,
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

  // Broker sales for selection
  const brokerSales = useMemo(() => {
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
          {canManage && (
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Nova Comissão
            </Button>
          )}
        </div>

        {/* Overdue alert banner */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-3 p-3 mb-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                {overdueCount} comissão(ões) atrasada(s)
              </p>
              <p className="text-xs text-muted-foreground">
                Existem comissões com data de recebimento vencida que ainda não foram pagas.
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 shrink-0"
              onClick={() => setStatusFilter('atrasado')}>
              Ver atrasadas
            </Button>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por corretor ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
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

        {/* Commission list */}
        <Card className="overflow-hidden border-border/50">
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhuma comissão encontrada</p>
                <p className="text-xs text-muted-foreground/60 mt-1">As comissões serão exibidas aqui ao cadastrar vendas</p>
              </div>
            ) : (
              filtered.map((c) => {
                const broker = c.broker;
                const sale = c.sale;
                const overdue = isOverdue(c);
                const config = statusConfig[c.status] || statusConfig.pendente;
                const StatusIcon = config.icon;
                const initials = broker?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
                const installmentText = c.installments > 1
                  ? `${c.paid_installments}/${c.installments} parcelas`
                  : 'À vista';

                return (
                  <div
                    key={c.id}
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
                          <StatusIcon className="w-3 h-3 mr-0.5" />
                          {config.label}
                        </Badge>
                        {overdue && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />
                            Atrasada
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
                      <p className="text-[10px] text-muted-foreground">
                        Base: {formatCurrency(Number(c.base_value))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Edit Commission Dialog */}
      <Dialog open={!!editingCommission} onOpenChange={(open) => !open && setEditingCommission(null)}>
        <DialogContent className="sm:max-w-[400px]">
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data Pagamento
                  </Label>
                  <Input
                    type="date"
                    value={editPaymentDate}
                    onChange={(e) => setEditPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              {editingCommission.installments > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Parcelas pagas ({editingCommission.installments} total)</Label>
                  <Input
                    type="number"
                    value={editPaidInstallments}
                    onChange={(e) => setEditPaidInstallments(Number(e.target.value))}
                    min={0}
                    max={editingCommission.installments}
                  />
                </div>
              )}

              {isOverdue(editingCommission) && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive font-medium">
                    Esta comissão está atrasada desde {new Date(editingCommission.due_date!).toLocaleDateString('pt-BR')}
                  </p>
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
            {/* Broker selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Corretor *</Label>
              <Select value={newBrokerId} onValueChange={setNewBrokerId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione o corretor..." />
                </SelectTrigger>
                <SelectContent>
                  {brokers.filter(b => b.status === 'ativo').map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sale selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Venda Vinculada *</Label>
              <Select value={newSaleId} onValueChange={setNewSaleId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione a venda..." />
                </SelectTrigger>
                <SelectContent>
                  {brokerSales.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.client_name} — {formatCurrency(Number(s.property_value))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Commission type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Origem da Comissão</Label>
              <Select value={newCommissionType} onValueChange={setNewCommissionType}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="captacao">Captação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <DollarSign className="w-3 h-3" /> Valor Base
                </Label>
                <CurrencyInput
                  value={newBaseValue}
                  onChange={setNewBaseValue}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <Percent className="w-3 h-3" /> % Comissão
                </Label>
                <Input
                  type="number"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  step="0.1"
                  min="0"
                  max="100"
                  className="h-9"
                />
              </div>
            </div>

            {/* Calculated value */}
            {newBaseValue > 0 && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Valor da Comissão</p>
                <p className="text-2xl font-black text-success">{formatCurrency(newCommissionValue)}</p>
              </div>
            )}

            {/* Payment & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <CreditCard className="w-3 h-3" /> Pagamento
                </Label>
                <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
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
                <Input
                  type="number"
                  value={newInstallments}
                  onChange={(e) => setNewInstallments(Number(e.target.value))}
                  min="1"
                  className="h-9"
                />
              </div>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data Prevista para Recebimento
              </Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Observations */}
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea
                value={newObservations}
                onChange={(e) => setNewObservations(e.target.value)}
                placeholder="Observações sobre o comissionamento..."
                rows={2}
              />
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
