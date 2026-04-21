import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Wallet, Search, Filter, CheckCircle2, Clock, AlertTriangle,
  CreditCard, Calendar, Plus, Download, ChevronDown, ChevronUp, Trash2,
  TrendingDown, TrendingUp, DollarSign, PieChart,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useFinancialRecords, FinancialRecord, FinancialRecordInsert } from "@/hooks/useFinancialRecords";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  pago: { label: "Pago", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  atrasado: { label: "Atrasado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  Marketing: { label: "Marketing", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  Operacional: { label: "Operacional", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  Comissão: { label: "Comissão", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  Outros: { label: "Outros", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

const Financeiro = () => {
  const { records, loading, createRecord, updateRecord, deleteRecord } = useFinancialRecords();
  const { user, profile, isDiretor, isAdmin, isSocio, isGerente } = useAuth();
  const { toast } = useToast();
  
  const canManageAll = isDiretor() || isAdmin() || isSocio();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<FinancialRecordInsert>>({
    description: "",
    value: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: "pendente",
    category: "Outros",
    payment_method: "",
    observations: "",
  });

  // Filtered records
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        if (!r.description.toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }, [records, statusFilter, categoryFilter, searchTerm]);

  // Dashboard Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRecords = records.filter(r => {
      const d = new Date(r.due_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalToPay = records.filter(r => r.status !== 'pago').reduce((s, r) => s + Number(r.value), 0);
    const totalPaidMonth = monthlyRecords.filter(r => r.status === 'pago').reduce((s, r) => s + Number(r.value), 0);
    const commissionsPending = records.filter(r => r.category === 'Comissão' && r.status !== 'pago').reduce((s, r) => s + Number(r.value), 0);
    const commissionsPaidMonth = monthlyRecords.filter(r => r.category === 'Comissão' && r.status === 'pago').reduce((s, r) => s + Number(r.value), 0);

    return {
      totalToPay,
      totalPaidMonth,
      commissionsPending,
      commissionsPaidMonth,
      overdueCount: records.filter(r => r.status === 'atrasado').length,
    };
  }, [records]);

  const handleSave = async () => {
    if (!formData.description || !formData.value || !formData.due_date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingRecord) {
        await updateRecord({ id: editingRecord.id, ...formData });
        toast({ title: "Sucesso", description: "Registro atualizado." });
      } else {
        await createRecord({
          ...formData as FinancialRecordInsert,
          user_id: user?.id!,
          company_id: profile?.company_id!,
          agency_id: profile?.agency_id,
        });
        toast({ title: "Sucesso", description: "Registro criado." });
      }
      setShowCreateDialog(false);
      setEditingRecord(null);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      value: 0,
      due_date: new Date().toISOString().split('T')[0],
      status: "pendente",
      category: "Outros",
      payment_method: "",
      observations: "",
    });
  };

  const handleMarkAsPaid = async (record: FinancialRecord) => {
    try {
      await updateRecord({ id: record.id, status: 'pago' });
      toast({ title: "Sucesso", description: "Conta marcada como paga." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      await deleteRecord(id);
    }
  };

  const openEdit = (record: FinancialRecord) => {
    setEditingRecord(record);
    setFormData({
      description: record.description,
      value: record.value,
      due_date: record.due_date,
      status: record.status,
      category: record.category,
      payment_method: record.payment_method || "",
      observations: record.observations || "",
    });
    setShowCreateDialog(true);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <Navigation />
      
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wallet className="w-8 h-8 text-primary" /> Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">Gestão de contas a pagar e controle de comissões.</p>
          </div>
          <Button onClick={() => { resetForm(); setEditingRecord(null); setShowCreateDialog(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Conta
          </Button>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-warning" /> Total a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-foreground">{formatCurrency(metrics.totalToPay)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Acumulado pendente</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" /> Pago no Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-foreground">{formatCurrency(metrics.totalPaidMonth)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Referente a {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" /> Comissões Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-foreground">{formatCurrency(metrics.commissionsPending)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Total aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card className={cn("border-border/50 shadow-sm", metrics.overdueCount > 0 && "border-destructive/30 bg-destructive/5")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className={cn("w-4 h-4", metrics.overdueCount > 0 ? "text-destructive" : "text-muted-foreground")} /> Contas Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-black", metrics.overdueCount > 0 ? "text-destructive" : "text-foreground")}>{metrics.overdueCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Vencidas e não pagas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição..."
                  className="pl-9 h-10 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10 border-border/50">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="atrasado">Atrasados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-10 border-border/50">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Categoria" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {Object.keys(categoryConfig).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-10 gap-2 border-border/50">
              <Download className="w-4 h-4" /> Exportar
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-4 border-border/50"><Skeleton className="h-20 w-full" /></Card>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl border-border/50">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Nenhum registro financeiro encontrado.</p>
            </div>
          ) : (
            filtered.map(record => {
              const config = statusConfig[record.status] || statusConfig.pendente;
              const cat = categoryConfig[record.category] || categoryConfig.Outros;
              const StatusIcon = config.icon;

              return (
                <Card key={record.id} className={cn(
                  "p-4 border-border/50 transition-all hover:shadow-md",
                  record.status === 'atrasado' && "border-destructive/30 bg-destructive/5",
                  record.status === 'pago' && "opacity-80"
                )}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5", config.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" /> {config.label}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5", cat.color)}>
                          {cat.label}
                        </Badge>
                        {record.commission_id && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Vínculo: Comissão</Badge>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg text-foreground truncate">{record.description}</h3>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> 
                          Vencimento: {new Date(record.due_date).toLocaleDateString('pt-BR')}
                        </span>
                        {record.payment_method && (
                          <span className="flex items-center gap-1 uppercase tracking-tighter font-medium">
                            <CreditCard className="w-3.5 h-3.5" /> {record.payment_method}
                          </span>
                        )}
                        {record.observations && <span className="italic">"{record.observations}"</span>}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-black text-foreground">{formatCurrency(Number(record.value))}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {record.status !== 'pago' && (
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90 text-success-foreground font-bold h-8"
                            onClick={() => handleMarkAsPaid(record)}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(record)}>
                          <Plus className="w-4 h-4 rotate-45" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(record.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Editar Conta" : "Nova Conta a Pagar"}</DialogTitle>
            <DialogDescription>Preencha os dados da conta para controle financeiro.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input 
                id="description" 
                placeholder="Ex: Aluguel, Internet, Pagamento Corretor..." 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor *</Label>
                <CurrencyInput 
                  value={formData.value || 0}
                  onChange={(val) => setFormData({ ...formData, value: val })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Vencimento *</Label>
                <Input 
                  id="due_date" 
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categoryConfig).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select value={formData.payment_method || ""} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea 
                id="observations" 
                placeholder="Detalhes adicionais..." 
                className="resize-none"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editingRecord ? "Salvar Alterações" : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
