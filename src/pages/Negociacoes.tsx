import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Handshake,
  DollarSign,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  TrendingDown,
  Percent,
  Settings,
  Star,
  Clock,
  Ban,
  Undo2,
  Thermometer,
  AlertTriangle,
  StickyNote,
  MessageCircle
} from "lucide-react";
import { useNegotiations, CreateNegotiationInput, Negotiation } from "@/hooks/useNegotiations";
import { useBrokers } from "@/hooks/useBrokers";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SaleConversionDialog, SaleConversionData } from "@/components/negotiations/SaleConversionDialog";
import { LossReasonDialog } from "@/components/negotiations/LossReasonDialog";
import { ResponsiveStatCard } from "@/components/negotiations/ResponsiveStatCard";
import { NegotiationStatusBadge } from "@/components/negotiations/NegotiationStatusBadge";
import { StatusManagerDialog } from "@/components/negotiations/StatusManagerDialog";
import { NegotiationNotesDialog } from "@/components/negotiations/NegotiationNotesDialog";
import { useNegotiationStatuses } from "@/hooks/useNegotiationStatuses";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SaleCelebration } from "@/components/SaleCelebration";

const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
];

const TEMPERATURE_OPTIONS = [
  { value: 'fria', label: '❄️ Fria', color: 'text-info', bg: 'bg-info/10 border-info/30' },
  { value: 'morna', label: '🌤️ Morna', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  { value: 'quente', label: '🔥 Quente', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
];

const Negociacoes = () => {
  const { user, profile, isCorretor } = useAuth();
  const { negotiations, lostNegotiations, loading, createNegotiation, updateNegotiation, deleteNegotiation } = useNegotiations();
  const { brokers } = useBrokers();
  const { createSale, sales, refreshSales } = useData();
  const { createFollowUp } = useFollowUps();
  const { flowStatuses, getStatusByValue } = useNegotiationStatuses();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNegotiation, setEditingNegotiation] = useState<Negotiation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTemperature, setFilterTemperature] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Status manager dialog
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);
  
  // Sale conversion dialog state
  const [saleConversionOpen, setSaleConversionOpen] = useState(false);
  const [selectedForSale, setSelectedForSale] = useState<Negotiation | null>(null);
  
  // Loss reason dialog state
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [selectedForLoss, setSelectedForLoss] = useState<Negotiation | null>(null);
  
  // Celebration state
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ brokerName: string; clientName: string; saleValue: number }>({ brokerName: '', clientName: '', saleValue: 0 });
  
  // Stalled alert state
  const [showStalledAlert, setShowStalledAlert] = useState(true);

  // Return to follow-up state
  const [returnToFollowUpOpen, setReturnToFollowUpOpen] = useState(false);
  const [selectedForFollowUp, setSelectedForFollowUp] = useState<Negotiation | null>(null);
  
  // Notes dialog state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedForNotes, setSelectedForNotes] = useState<Negotiation | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateNegotiationInput>({
    broker_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    property_address: '',
    property_type: 'apartamento',
    negotiated_value: 0,
    status: 'em_contato',
    start_date: new Date().toISOString().split('T')[0],
    observations: '',
    temperature: 'morna',
  });

  // Get current user's broker ID
  const currentBroker = brokers.find(b => b.user_id === user?.id);

  // Count sales converted from negotiations (based on notes containing "negociação")
  const salesFromNegotiations = useMemo(() => {
    return sales.filter(s => 
      s.notes?.toLowerCase().includes('negociação') || 
      s.notes?.toLowerCase().includes('negociacao')
    ).length;
  }, [sales]);

  // Filter negotiations (active tab)
  const filteredNegotiations = useMemo(() => {
    const terminalStatuses = ['perdida', 'venda_concluida'];
    const filtered = negotiations.filter(negotiation => {
      const matchesSearch = 
        negotiation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.observations?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || negotiation.status === filterStatus;
      const matchesTemperature = filterTemperature === 'all' || negotiation.temperature === filterTemperature;
      const isActive = !terminalStatuses.includes(negotiation.status);
      
      return matchesSearch && matchesStatus && matchesTemperature && isActive;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [negotiations, searchTerm, filterStatus, filterTemperature, sortOrder]);

  // Filter lost negotiations
  const filteredLostNegotiations = useMemo(() => {
    return lostNegotiations.filter(negotiation => {
      const matchesSearch = 
        negotiation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.loss_reason?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [lostNegotiations, searchTerm]);

  // Calculate stats with new status structure
  const stats = useMemo(() => {
    const allNegotiations = [...negotiations, ...lostNegotiations];
    const total = negotiations.length;
    
    // New status counts
    const emAprovacao = negotiations.filter(n => 
      n.status === 'em_aprovacao' || n.status === 'em_analise' || n.status === 'proposta_enviada'
    ).length;
    const clienteAprovado = negotiations.filter(n => 
      n.status === 'cliente_aprovado' || n.status === 'aprovado'
    ).length;
    const clienteReprovado = negotiations.filter(n => 
      n.status === 'cliente_reprovado'
    ).length;
    const emContato = negotiations.filter(n => n.status === 'em_contato').length;
    
    const valorTotal = negotiations.reduce((sum, n) => sum + Number(n.negotiated_value), 0);
    
    // Lost stats
    const perdidas = lostNegotiations.length;
    const valorPerdido = lostNegotiations.reduce((sum, n) => sum + Number(n.negotiated_value), 0);
    
    // Conversion rate based on actual sales from negotiations
    const taxaConversao = allNegotiations.length > 0 
      ? ((salesFromNegotiations / (total + perdidas + salesFromNegotiations)) * 100).toFixed(1)
      : '0';

    return { 
      total, 
      emContato, 
      emAprovacao, 
      clienteAprovado, 
      clienteReprovado,
      valorTotal, 
      perdidas, 
      valorPerdido, 
      taxaConversao,
      vendasConvertidas: salesFromNegotiations,
    };
  }, [negotiations, lostNegotiations, salesFromNegotiations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      broker_id: isCorretor() && currentBroker ? currentBroker.id : formData.broker_id,
    };

    try {
      if (editingNegotiation) {
        await updateNegotiation({ id: editingNegotiation.id, ...dataToSubmit });
      } else {
        await createNegotiation(dataToSubmit);
      }
      handleCloseForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (negotiation: Negotiation) => {
    setEditingNegotiation(negotiation);
    setFormData({
      broker_id: negotiation.broker_id,
      client_name: negotiation.client_name,
      client_email: negotiation.client_email || '',
      client_phone: negotiation.client_phone || '',
      property_address: negotiation.property_address,
      property_type: negotiation.property_type,
      negotiated_value: negotiation.negotiated_value,
      status: negotiation.status,
      start_date: negotiation.start_date,
      observations: negotiation.observations || '',
      temperature: negotiation.temperature || 'morna',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingNegotiation(null);
    setFormData({
      broker_id: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      property_address: '',
      property_type: 'apartamento',
      negotiated_value: 0,
      status: 'em_contato',
      start_date: new Date().toISOString().split('T')[0],
      observations: '',
      temperature: 'morna',
    });
  };

  // Handle VENDA action
  const handleOpenSaleConversion = (negotiation: Negotiation) => {
    setSelectedForSale(negotiation);
    setSaleConversionOpen(true);
  };

  const handleConfirmSale = async (data: SaleConversionData) => {
    if (!selectedForSale) return;

    try {
      // Create sale record with company_id
      await createSale({
        tipo: 'venda',
        broker_id: selectedForSale.broker_id,
        client_name: selectedForSale.client_name,
        client_email: selectedForSale.client_email,
        client_phone: selectedForSale.client_phone,
        property_address: selectedForSale.property_address,
        property_type: (selectedForSale.property_type || 'apartamento') as 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural',
        property_value: selectedForSale.negotiated_value,
        vgv: data.vgv,
        vgc: data.vgc,
        sale_date: data.sale_date,
        contract_date: data.contract_date,
        status: 'confirmada',
        notes: `Venda originada da negociação. ${data.notes || ''} ${selectedForSale.observations || ''}`.trim(),
        vendedor: data.vendedor,
        captador: data.sale_type === 'revenda' ? data.captador : undefined,
        gerente: data.gerente,
        origem: data.origem || selectedForSale.origem,
        sale_type: data.sale_type,
        estilo: data.estilo,
        produto: data.produto,
        visibilidade: 'venda',
        company_id: profile?.company_id || undefined,
      });

      // Update negotiation status to venda_concluida
      await updateNegotiation({ id: selectedForSale.id, status: 'venda_concluida' });
      
      // Force refresh sales data for dashboard
      refreshSales();

      // Trigger celebration
      setCelebrationData({
        brokerName: getBrokerName(selectedForSale.broker_id),
        clientName: selectedForSale.client_name,
        saleValue: data.vgv,
      });
      setCelebrationOpen(true);
      
      setSelectedForSale(null);
    } catch (error) {
      console.error('Erro ao converter negociação em venda:', error);
    }
  };

  // Handle PERDA action
  const handleOpenLossDialog = (negotiation: Negotiation) => {
    setSelectedForLoss(negotiation);
    setLossDialogOpen(true);
  };

  const handleConfirmLoss = async (lossReason: string) => {
    if (!selectedForLoss) return;

    await updateNegotiation({ 
      id: selectedForLoss.id, 
      status: 'perdida',
      loss_reason: lossReason 
    });
    
    setSelectedForLoss(null);
  };

  // Handle return to follow-up
  const handleOpenReturnToFollowUp = (negotiation: Negotiation) => {
    setSelectedForFollowUp(negotiation);
    setReturnToFollowUpOpen(true);
  };

  const handleConfirmReturnToFollowUp = async () => {
    if (!selectedForFollowUp) return;
    try {
      await createFollowUp({
        broker_id: selectedForFollowUp.broker_id,
        client_name: selectedForFollowUp.client_name,
        client_phone: selectedForFollowUp.client_phone || undefined,
        property_interest: selectedForFollowUp.property_address,
        estimated_vgv: selectedForFollowUp.negotiated_value,
        observations: `Retornado da Negociação. ${selectedForFollowUp.observations || ''}`.trim(),
        status: 'novo_lead',
      });
      await deleteNegotiation(selectedForFollowUp.id);
      setSelectedForFollowUp(null);
      setReturnToFollowUpOpen(false);
    } catch (error) {
      // Error handled by hooks
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteNegotiation(deleteId);
      setDeleteId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getBrokerName = (brokerId: string) => {
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.name || 'Não encontrado';
  };

  // Check if negotiation is approved (can be converted to sale)
  const isApproved = (status: string) => {
    return status === 'cliente_aprovado' || status === 'aprovado';
  };

  const getTemperatureBadge = (temperature: string) => {
    const temp = TEMPERATURE_OPTIONS.find(t => t.value === temperature);
    if (!temp) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${temp.bg} ${temp.color}`}>
        {temp.label}
      </span>
    );
  };

  // Stalled negotiations alert
  const stalledNegotiations = useMemo(() => {
    const now = new Date();
    return negotiations.filter(neg => {
      const lastUpdate = new Date(neg.updated_at);
      const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 3;
    });
  }, [negotiations]);

  const isStalled = (negotiation: Negotiation) => {
    const now = new Date();
    const lastUpdate = new Date(negotiation.updated_at);
    const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 3;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-6">
          {/* Total Negociações Card - Prominent */}
          <Card 
            className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setActiveTab('active');
              setFilterStatus('all');
              setSearchTerm('');
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-primary/10">
                    <Handshake className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total de Negociações Ativas
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {stats.total}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">Valor em negociação</p>
                  <p className="text-2xl font-semibold text-primary">
                    {formatCurrency(stats.valorTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Negociações
              </h1>
              <p className="text-muted-foreground mt-1">
                Pipeline de vendas e acompanhamento de negociações
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setStatusManagerOpen(true)}
                title="Gerenciar Status"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Negociação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingNegotiation ? 'Editar Negociação' : 'Nova Negociação'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Corretor selector */}
                    {!isCorretor() && (
                      <div>
                        <label className="text-sm font-medium">Corretor Responsável *</label>
                        <Select
                          value={formData.broker_id}
                          onValueChange={(value) => setFormData({ ...formData, broker_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o corretor" />
                          </SelectTrigger>
                          <SelectContent>
                            {brokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id}>
                                {broker.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Cliente *</label>
                      <Input
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        placeholder="Nome do cliente"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          value={formData.client_email}
                          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Telefone</label>
                        <Input
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Endereço do Imóvel *</label>
                      <Input
                        value={formData.property_address}
                        onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                        placeholder="Endereço completo"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Tipo de Imóvel</label>
                        <Select
                          value={formData.property_type}
                          onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPERTY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Valor Negociado *</label>
                        <Input
                          type="number"
                          value={formData.negotiated_value || ''}
                          onChange={(e) => setFormData({ ...formData, negotiated_value: Number(e.target.value) })}
                          placeholder="0,00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Data de Início</label>
                        <Input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {flowStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <span>{status.icon}</span>
                                  {status.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Temperature selector */}
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Thermometer className="w-4 h-4" />
                        Termômetro da Negociação
                      </label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {TEMPERATURE_OPTIONS.map((temp) => (
                          <button
                            key={temp.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, temperature: temp.value })}
                            className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                              formData.temperature === temp.value
                                ? `${temp.bg} border-current ${temp.color} scale-105 shadow-md`
                                : 'border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {temp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <Textarea
                        value={formData.observations}
                        onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                        placeholder="Detalhes da negociação..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingNegotiation ? 'Salvar' : 'Criar Negociação'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCloseForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stalled Negotiations Alert */}
          {showStalledAlert && stalledNegotiations.length > 0 && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="font-semibold text-destructive">
                    {stalledNegotiations.length} negociação(ões) parada(s) há 3+ dias!
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">
                    — Clientes: {stalledNegotiations.slice(0, 3).map(n => n.client_name).join(', ')}
                    {stalledNegotiations.length > 3 && ` e mais ${stalledNegotiations.length - 3}`}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowStalledAlert(false)} className="h-8 px-2">
                  <X className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Important Notice */}
          <Alert className="border-warning/50 bg-warning/10">
            <AlertDescription className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <span>
                <strong className="text-warning">IMPORTANTE:</strong>{' '}
                Cliente <strong>Aprovado</strong> ≠ <strong>Venda</strong>. 
                Uma venda só é registrada ao clicar em "Converter em Venda".
              </span>
            </AlertDescription>
          </Alert>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3">
            <ResponsiveStatCard
              icon={Handshake}
              iconColor="text-primary"
              bgColor="bg-primary/10"
              value={stats.total}
              label="Total Ativas"
            />
            <ResponsiveStatCard
              icon={Clock}
              iconColor="text-warning"
              bgColor="bg-warning/10"
              value={stats.emAprovacao}
              label="Em Aprovação"
            />
            <ResponsiveStatCard
              icon={CheckCircle2}
              iconColor="text-success"
              bgColor="bg-success/10"
              value={stats.clienteAprovado}
              label="Aprovados"
              sublabel="(não é venda)"
            />
            <ResponsiveStatCard
              icon={Ban}
              iconColor="text-destructive"
              bgColor="bg-destructive/10"
              value={stats.clienteReprovado}
              label="Reprovados"
            />
            <ResponsiveStatCard
              icon={XCircle}
              iconColor="text-muted-foreground"
              bgColor="bg-muted/50"
              value={stats.perdidas}
              label="Perdidas"
            />
            <ResponsiveStatCard
              icon={Star}
              iconColor="text-success"
              bgColor="bg-success/10"
              value={stats.vendasConvertidas}
              label="Vendas"
              sublabel="convertidas"
            />
            <ResponsiveStatCard
              icon={Percent}
              iconColor="text-warning"
              bgColor="bg-warning/10"
              value={`${stats.taxaConversao}%`}
              label="Conversão"
            />
            <ResponsiveStatCard
              icon={DollarSign}
              iconColor="text-success"
              bgColor="bg-success/10"
              value={formatCurrency(stats.valorTotal)}
              label="Valor Ativo"
            />
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar negociações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {activeTab === 'active' && (
                  <>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        {flowStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <span>{status.icon}</span>
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Termômetro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4" />
                            Todas
                          </div>
                        </SelectItem>
                        {TEMPERATURE_OPTIONS.map((temp) => (
                          <SelectItem key={temp.value} value={temp.value}>
                            {temp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Mais recentes
                          </div>
                        </SelectItem>
                        <SelectItem value="oldest">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Mais antigas
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Active/Lost Negotiations */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="active" className="gap-2">
                <Handshake className="w-4 h-4" />
                Em Andamento ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="lost" className="gap-2">
                <XCircle className="w-4 h-4" />
                Perdidas ({stats.perdidas})
              </TabsTrigger>
            </TabsList>

            {/* Active Negotiations Tab */}
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-primary" />
                    Negociações em Andamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredNegotiations.length === 0 ? (
                    <EmptyState
                      variant="negotiations"
                      title="Nenhuma negociação encontrada"
                      description="Comece adicionando sua primeira negociação para acompanhar o pipeline de vendas."
                      actionLabel="Nova Negociação"
                      onAction={() => setIsFormOpen(true)}
                    />
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-3">
                        {filteredNegotiations.map((negotiation) => {
                          const statusConfig = getStatusByValue(negotiation.status);
                          const canConvert = isApproved(negotiation.status);
                          return (
                            <Card key={negotiation.id} className={`border ${isStalled(negotiation) ? 'border-destructive/50 bg-destructive/5' : 'border-border/50'}`}>
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground truncate">{negotiation.client_name}</p>
                                    {negotiation.client_phone && (
                                      <a href={`https://wa.me/${negotiation.client_phone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-success hover:text-success/80">
                                        <MessageCircle className="w-3 h-3" />{negotiation.client_phone}
                                      </a>
                                    )}
                                  </div>
                                  <NegotiationStatusBadge 
                                    status={negotiation.status}
                                    label={statusConfig?.label}
                                    color={statusConfig?.color}
                                    icon={statusConfig?.icon}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Imóvel</p>
                                    <p className="truncate capitalize">{negotiation.property_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Valor</p>
                                    <p className="font-semibold text-primary">{formatCurrency(negotiation.negotiated_value)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Corretor</p>
                                    <p className="truncate">{getBrokerName(negotiation.broker_id)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Data</p>
                                    <p>{format(new Date(negotiation.start_date), "dd/MM/yy", { locale: ptBR })}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {getTemperatureBadge(negotiation.temperature)}
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                  <Button size="sm" variant="ghost" onClick={() => handleEdit(negotiation)} className="flex-1 h-9">
                                    <Edit className="w-4 h-4 mr-1" /> Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenSaleConversion(negotiation)}
                                    className={`flex-1 h-9 text-success-foreground ${canConvert ? 'bg-success hover:bg-success/90' : 'bg-success/50 hover:bg-success/70'}`}
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" /> Venda
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleOpenLossDialog(negotiation)} className="h-9">
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleOpenReturnToFollowUp(negotiation)} className="h-9" title="Voltar para Follow Up">
                                    <Undo2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedForNotes(negotiation); setNotesDialogOpen(true); }} className="h-9" title="Notas">
                                    <StickyNote className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-destructive h-9" onClick={() => setDeleteId(negotiation.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Imóvel</TableHead>
                              <TableHead>Corretor</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Termômetro</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredNegotiations.map((negotiation) => {
                              const statusConfig = getStatusByValue(negotiation.status);
                              const canConvert = isApproved(negotiation.status);
                              return (
                                <TableRow key={negotiation.id} className={isStalled(negotiation) ? 'bg-destructive/5 border-l-2 border-l-destructive' : ''}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{negotiation.client_name}</p>
                                      {negotiation.client_phone && (
                                        <a href={`https://wa.me/${negotiation.client_phone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-success hover:text-success/80">
                                          <MessageCircle className="w-3 h-3" />{negotiation.client_phone}
                                        </a>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-[200px]">
                                      <p className="truncate">{negotiation.property_address}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{negotiation.property_type}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getBrokerName(negotiation.broker_id)}</TableCell>
                                  <TableCell className="font-semibold text-primary">
                                    {formatCurrency(negotiation.negotiated_value)}
                                  </TableCell>
                                  <TableCell>
                                    {getTemperatureBadge(negotiation.temperature)}
                                  </TableCell>
                                  <TableCell>
                                    <NegotiationStatusBadge 
                                      status={negotiation.status}
                                      label={statusConfig?.label}
                                      color={statusConfig?.color}
                                      icon={statusConfig?.icon}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {format(new Date(negotiation.start_date), "dd/MM/yy", { locale: ptBR })}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-1 flex-wrap">
                                      <Button size="sm" variant="ghost" onClick={() => handleEdit(negotiation)} title="Editar">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleOpenSaleConversion(negotiation)}
                                        className={`text-success-foreground ${canConvert ? 'bg-success hover:bg-success/90 animate-pulse' : 'bg-success/50 hover:bg-success/70'}`}
                                        title={canConvert ? "Cliente aprovado - Converter em Venda" : "Converter em Venda"}
                                      >
                                        <DollarSign className="w-4 h-4" />
                                        <span className="ml-1">{canConvert ? 'VENDA!' : 'VENDA'}</span>
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleOpenLossDialog(negotiation)} title="Registrar Perda">
                                        <XCircle className="w-4 h-4" />
                                        <span className="ml-1">PERDA</span>
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => handleOpenReturnToFollowUp(negotiation)} title="Voltar para Follow Up">
                                        <Undo2 className="w-4 h-4" />
                                        <span className="ml-1">Follow Up</span>
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => { setSelectedForNotes(negotiation); setNotesDialogOpen(true); }} title="Notas">
                                        <StickyNote className="w-4 h-4" />
                                        <span className="ml-1">Notas</span>
                                      </Button>
                                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(negotiation.id)} title="Excluir">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lost Negotiations Tab */}
            <TabsContent value="lost">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    Negociações Perdidas
                    <NegotiationStatusBadge
                      status="perdida"
                      label={`${formatCurrency(stats.valorPerdido)} perdidos`}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLostNegotiations.length === 0 ? (
                    <EmptyState
                      icon={XCircle}
                      title="Nenhuma negociação perdida"
                      description="Ótima notícia! Continue assim e mantenha suas conversões em alta."
                    />
                  ) : (
                    <>
                      {/* Mobile Card View - Lost */}
                      <div className="block md:hidden space-y-3">
                        {filteredLostNegotiations.map((negotiation) => (
                          <Card key={negotiation.id} className="border border-border/50 opacity-75">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-foreground">{negotiation.client_name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{negotiation.property_type}</p>
                                </div>
                                <NegotiationStatusBadge status="perdida" label={negotiation.loss_reason || 'Não informado'} showIcon={false} />
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Valor</p>
                                  <p className="font-semibold text-muted-foreground line-through">{formatCurrency(negotiation.negotiated_value)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Data</p>
                                  <p>{format(new Date(negotiation.updated_at), "dd/MM/yy", { locale: ptBR })}</p>
                                </div>
                              </div>
                              <div className="flex justify-end pt-1 border-t border-border/30">
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(negotiation.id)}>
                                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {/* Desktop Table - Lost */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Imóvel</TableHead>
                              <TableHead>Corretor</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Motivo da Perda</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLostNegotiations.map((negotiation) => (
                              <TableRow key={negotiation.id} className="opacity-75">
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{negotiation.client_name}</p>
                                    {negotiation.client_phone && (
                                      <a href={`https://wa.me/${negotiation.client_phone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
                                        <MessageCircle className="w-3 h-3" />{negotiation.client_phone}
                                      </a>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-[200px]">
                                    <p className="truncate">{negotiation.property_address}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{negotiation.property_type}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{getBrokerName(negotiation.broker_id)}</TableCell>
                                <TableCell className="font-semibold text-muted-foreground line-through">
                                  {formatCurrency(negotiation.negotiated_value)}
                                </TableCell>
                                <TableCell>
                                  <NegotiationStatusBadge status="perdida" label={negotiation.loss_reason || 'Não informado'} showIcon={false} />
                                </TableCell>
                                <TableCell>
                                  {format(new Date(negotiation.updated_at), "dd/MM/yy", { locale: ptBR })}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(negotiation.id)} title="Excluir">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Status Manager Dialog */}
      <StatusManagerDialog
        open={statusManagerOpen}
        onOpenChange={setStatusManagerOpen}
      />

      {/* Sale Conversion Dialog */}
      <SaleConversionDialog
        open={saleConversionOpen}
        onOpenChange={setSaleConversionOpen}
        negotiation={selectedForSale}
        onConfirm={handleConfirmSale}
      />

      {/* Loss Reason Dialog */}
      <LossReasonDialog
        open={lossDialogOpen}
        onOpenChange={setLossDialogOpen}
        negotiation={selectedForLoss}
        onConfirm={handleConfirmLoss}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta negociação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sale Celebration */}
      <SaleCelebration
        open={celebrationOpen}
        onOpenChange={setCelebrationOpen}
        brokerName={celebrationData.brokerName}
        clientName={celebrationData.clientName}
        saleValue={celebrationData.saleValue}
      />

      {/* Return to Follow Up Dialog */}
      <AlertDialog open={returnToFollowUpOpen} onOpenChange={setReturnToFollowUpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-primary" />
              Voltar para Follow Up
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a mover esta negociação de volta para a tela de Follow Up.
              </p>
              {selectedForFollowUp && (
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {selectedForFollowUp.client_name}</p>
                  <p><strong>Telefone:</strong> {selectedForFollowUp.client_phone || 'Não informado'}</p>
                  <p><strong>Imóvel:</strong> {selectedForFollowUp.property_address}</p>
                  <p><strong>Valor:</strong> {formatCurrency(selectedForFollowUp.negotiated_value)}</p>
                </div>
              )}
              <p className="text-amber-600 dark:text-amber-400">
                A negociação será removida e um novo registro será criado no Follow Up com status "Novo Lead".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReturnToFollowUp}>
              <Undo2 className="w-4 h-4 mr-2" />
              Voltar para Follow Up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notes Dialog */}
      <NegotiationNotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        negotiation={selectedForNotes}
      />
    </div>
  );
};

export default Negociacoes;
