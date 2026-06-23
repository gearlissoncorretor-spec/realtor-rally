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
  TrendingDown, TrendingUp, DollarSign, PieChart, LineChart, FolderTree
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useFinancialRecords, FinancialRecord, FinancialRecordInsert } from "@/hooks/useFinancialRecords";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useCostCenters } from "@/hooks/useCostCenters";
import { CostCentersManager } from "@/components/financeiro/CostCentersManager";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";

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
  const { cashFlow } = useCashFlow();
  const { costCenters } = useCostCenters();
  const { user, profile, isDiretor, isAdmin, isSocio } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [costCenterFilter, setCostCenterFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCostCentersDialog, setShowCostCentersDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<FinancialRecordInsert>>({
    description: "",
    value: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: "pendente",
    category: "Outros",
    payment_method: "",
    observations: "",
    cost_center_id: null,
  });

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (costCenterFilter !== 'all') {
        if (costCenterFilter === 'none' ? r.cost_center_id : r.cost_center_id !== costCenterFilter) return false;
      }
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        if (!r.description.toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }, [records, statusFilter, categoryFilter, costCenterFilter, searchTerm]);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalToPay = records.filter(r => r.status !== 'pago').reduce((s, r) => s + Number(r.value), 0);
    
    const totalReceivable = cashFlow
      .filter(i => i.type === 'income' && i.status !== 'pago')
      .reduce((s, i) => s + Number(i.value), 0);
      
    const netProfitMonth = cashFlow
      .filter(i => {
        const d = new Date(i.due_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && i.status === 'pago';
      })
      .reduce((s, i) => s + (i.type === 'income' ? Number(i.value) : -Math.abs(Number(i.value))), 0);

    return {
      totalToPay,
      totalReceivable,
      netProfitMonth,
      overdueCount: records.filter(r => r.status === 'atrasado').length,
    };
  }, [records, cashFlow]);

  const chartData = useMemo(() => {
    const months: Record<string, { month: string, income: number, expense: number, profit: number }> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('pt-BR', { month: 'short' });
      months[key] = { month: key, income: 0, expense: 0, profit: 0 };
    }

    cashFlow.forEach(item => {
      const d = new Date(item.due_date);
      const key = d.toLocaleDateString('pt-BR', { month: 'short' });
      if (months[key]) {
        if (item.type === 'income') months[key].income += Number(item.value);
        else months[key].expense += Math.abs(Number(item.value));
        months[key].profit = months[key].income - months[key].expense;
      }
    });

    return Object.values(months);
  }, [cashFlow]);

  const handleSave = async () => {
    if (!formData.description || !formData.value || !formData.due_date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingRecord) {
        await updateRecord({ id: editingRecord.id, ...formData });
      } else {
        await createRecord({
          ...formData as FinancialRecordInsert,
          user_id: user?.id!,
          company_id: profile?.company_id!,
          agency_id: profile?.agency_id,
        });
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
      description: "", value: 0,
      due_date: new Date().toISOString().split('T')[0],
      status: "pendente", category: "Outros",
      payment_method: "", observations: "",
      cost_center_id: null,
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
      description: record.description, value: record.value,
      due_date: record.due_date, status: record.status,
      category: record.category, payment_method: record.payment_method || "",
      observations: record.observations || "",
    });
    setShowCreateDialog(true);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <Navigation />
      
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wallet className="w-8 h-8 text-primary" /> Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">Gestão de fluxo de caixa e controle de comissões.</p>
          </div>
          <Button onClick={() => { resetForm(); setEditingRecord(null); setShowCreateDialog(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Conta
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-red-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" /> Total a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.totalToPay)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Contas pendentes</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" /> A Receber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.totalReceivable)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Comissões projetadas</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" /> Saldo Liquidado (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.netProfitMonth)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Recebido - Pago</p>
            </CardContent>
          </Card>

          <Card className={cn("border-border/50 shadow-sm", metrics.overdueCount > 0 && "border-destructive/30 bg-destructive/5")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className={cn("w-4 h-4", metrics.overdueCount > 0 ? "text-destructive" : "text-muted-foreground")} /> Contas Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-bold", metrics.overdueCount > 0 ? "text-destructive" : "text-foreground")}>{metrics.overdueCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Vencidas e não pagas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="list" className="gap-2"><Wallet className="w-4 h-4" /> Lançamentos</TabsTrigger>
            <TabsTrigger value="cashflow" className="gap-2"><LineChart className="w-4 h-4" /> Saúde Financeira</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <Card className="border-border/50 p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[240px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="atrasado">Atrasados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {Object.keys(categoryConfig).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </Card>

            <div className="space-y-4">
              {loading ? <Skeleton className="h-40 w-full" /> : filtered.map(record => {
                const config = statusConfig[record.status] || statusConfig.pendente;
                const cat = categoryConfig[record.category] || categoryConfig.Outros;
                return (
                  <Card key={record.id} className={cn("p-4 border-border/50 transition-all hover:shadow-md", record.status === 'atrasado' && "bg-destructive/5")}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={config.color}>{config.label}</Badge>
                          <Badge variant="outline" className={cat.color}>{cat.label}</Badge>
                        </div>
                        <h3 className="font-bold text-lg">{record.description}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Vencimento: {new Date(record.due_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-bold">{formatCurrency(Number(record.value))}</p>
                        <div className="flex gap-2">
                          {record.status !== 'pago' && <Button size="sm" onClick={() => handleMarkAsPaid(record)}>Pagar</Button>}
                          <Button size="icon" variant="ghost" onClick={() => openEdit(record)}><Plus className="w-4 h-4 rotate-45" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(record.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6">Projeção de Fluxo de Caixa</h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="income" name="Entradas" stroke="#22c55e" fill="#22c55e20" strokeWidth={3} />
                    <Area type="monotone" dataKey="expense" name="Saídas" stroke="#ef4444" fill="#ef444420" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingRecord ? "Editar Conta" : "Nova Conta"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <CurrencyInput value={formData.value || 0} onChange={(val) => setFormData({ ...formData, value: val })} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(categoryConfig).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={saving}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
