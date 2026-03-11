import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DollarSign, Search, Filter, CheckCircle2, Clock, XCircle,
  CreditCard, TrendingUp, Users, Calendar,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCommissions, Commission } from "@/hooks/useCommissions";
import { useBrokers } from "@/hooks/useBrokers";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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

const Comissoes = () => {
  const { commissions, loading, updateCommission } = useCommissions();
  const { brokers } = useBrokers();
  const { sales } = useSales();
  const { isDiretor, isAdmin, isGerente } = useAuth();
  const canManage = isDiretor() || isAdmin() || isGerente();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaidInstallments, setEditPaidInstallments] = useState(0);
  const [saving, setSaving] = useState(false);

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
  const totalCount = enrichedCommissions.length;

  const openEdit = (c: Commission) => {
    setEditingCommission(c);
    setEditStatus(c.status);
    setEditPaymentDate(c.payment_date || '');
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
        paid_installments: editPaidInstallments,
      } as any);
      setEditingCommission(null);
    } finally {
      setSaving(false);
    }
  };

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
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: DollarSign, label: "Total Comissões", value: formatCurrency(totalCommission), color: "text-primary", bg: "bg-primary/10" },
            { icon: CheckCircle2, label: "Total Pago", value: formatCurrency(totalPaid), color: "text-success", bg: "bg-success/10" },
            { icon: Clock, label: "Pendente", value: formatCurrency(totalPending), color: "text-warning", bg: "bg-warning/10" },
            { icon: Users, label: "Registros", value: totalCount.toString(), color: "text-info", bg: "bg-info/10" },
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
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
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
                const config = statusConfig[c.status] || statusConfig.pendente;
                const StatusIcon = config.icon;
                const initials = broker?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
                const installmentText = c.installments > 1
                  ? `${c.paid_installments}/${c.installments} parcelas`
                  : 'À vista';

                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 md:p-4 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => canManage && openEdit(c)}
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-border/50 shrink-0">
                      <AvatarImage src={broker?.avatar_url || ''} />
                      <AvatarFallback className="text-xs font-bold bg-muted">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">{broker?.name || 'Corretor'}</p>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                          <StatusIcon className="w-3 h-3 mr-0.5" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{sale?.client_name || 'Cliente'}</span>
                        <span>·</span>
                        <span>{c.commission_percentage}%</span>
                        <span>·</span>
                        <span>{installmentText}</span>
                        {c.payment_method && (
                          <>
                            <span>·</span>
                            <span>{paymentMethodLabels[c.payment_method] || c.payment_method}</span>
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

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Data de Pagamento
                </Label>
                <Input
                  type="date"
                  value={editPaymentDate}
                  onChange={(e) => setEditPaymentDate(e.target.value)}
                />
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
    </div>
  );
};

export default Comissoes;
