import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Home,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Percent
} from "lucide-react";
import { useNegotiations, CreateNegotiationInput, Negotiation } from "@/hooks/useNegotiations";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SaleConversionDialog, SaleConversionData } from "@/components/negotiations/SaleConversionDialog";
import { LossReasonDialog } from "@/components/negotiations/LossReasonDialog";

const NEGOTIATION_STATUS = [
  { value: 'em_contato', label: 'Em Contato', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'proposta_enviada', label: 'Proposta Enviada', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'em_analise', label: 'Em Análise', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'aprovado', label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'perdida', label: 'Perdida', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
];

const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
];

const Negociacoes = () => {
  const { user, isCorretor } = useAuth();
  const { negotiations, lostNegotiations, loading, createNegotiation, updateNegotiation, deleteNegotiation } = useNegotiations();
  const { brokers } = useBrokers();
  const { createSale } = useData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNegotiation, setEditingNegotiation] = useState<Negotiation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Sale conversion dialog state
  const [saleConversionOpen, setSaleConversionOpen] = useState(false);
  const [selectedForSale, setSelectedForSale] = useState<Negotiation | null>(null);
  
  // Loss reason dialog state
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [selectedForLoss, setSelectedForLoss] = useState<Negotiation | null>(null);
  
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
  });

  // Get current user's broker ID
  const currentBroker = brokers.find(b => b.user_id === user?.id);

  // Filter negotiations (active tab)
  const filteredNegotiations = useMemo(() => {
    const activeStatuses = ['em_contato', 'proposta_enviada', 'em_analise', 'aprovado'];
    return negotiations.filter(negotiation => {
      const matchesSearch = 
        negotiation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.observations?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || negotiation.status === filterStatus;
      const isActive = activeStatuses.includes(negotiation.status);
      
      return matchesSearch && matchesStatus && isActive;
    });
  }, [negotiations, searchTerm, filterStatus]);

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

  // Calculate stats
  const stats = useMemo(() => {
    const allNegotiations = [...negotiations, ...lostNegotiations];
    const total = negotiations.length;
    const emContato = negotiations.filter(n => n.status === 'em_contato').length;
    const propostaEnviada = negotiations.filter(n => n.status === 'proposta_enviada').length;
    const emAnalise = negotiations.filter(n => n.status === 'em_analise').length;
    const aprovado = negotiations.filter(n => n.status === 'aprovado').length;
    const valorTotal = negotiations.reduce((sum, n) => sum + Number(n.negotiated_value), 0);
    
    // Lost stats
    const perdidas = lostNegotiations.length;
    const valorPerdido = lostNegotiations.reduce((sum, n) => sum + Number(n.negotiated_value), 0);
    const taxaConversao = allNegotiations.length > 0 
      ? ((allNegotiations.length - lostNegotiations.length) / allNegotiations.length * 100).toFixed(1)
      : '0';

    return { total, emContato, propostaEnviada, emAnalise, aprovado, valorTotal, perdidas, valorPerdido, taxaConversao };
  }, [negotiations, lostNegotiations]);

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
    });
  };

  // Handle VENDA action
  const handleOpenSaleConversion = (negotiation: Negotiation) => {
    setSelectedForSale(negotiation);
    setSaleConversionOpen(true);
  };

  const handleConfirmSale = async (data: SaleConversionData) => {
    if (!selectedForSale) return;

    // Create sale record
    await createSale({
      broker_id: selectedForSale.broker_id,
      client_name: selectedForSale.client_name,
      client_email: selectedForSale.client_email,
      client_phone: selectedForSale.client_phone,
      property_address: selectedForSale.property_address,
      property_type: selectedForSale.property_type as 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural',
      property_value: selectedForSale.negotiated_value,
      vgv: data.vgv,
      vgc: data.vgc,
      sale_date: data.sale_date,
      contract_date: data.contract_date,
      status: 'confirmada',
      notes: `Venda originada da negociação. ${data.notes || ''} ${selectedForSale.observations || ''}`.trim(),
      vendedor: data.vendedor,
      captador: data.captador,
      gerente: data.gerente,
      origem: data.origem,
    });

    // Update negotiation status to venda_concluida
    await updateNegotiation({ id: selectedForSale.id, status: 'venda_concluida' });
    
    setSelectedForSale(null);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = NEGOTIATION_STATUS.find(s => s.value === status);
    return (
      <Badge variant="outline" className={statusConfig?.color}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8">
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
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Negociações
              </h1>
              <p className="text-muted-foreground mt-1">
                Pipeline de vendas e acompanhamento de negociações
              </p>
            </div>
            
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
                          {NEGOTIATION_STATUS.filter(s => !['perdida', 'cancelado'].includes(s.value)).map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Handshake className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.emContato}</p>
                    <p className="text-xs text-muted-foreground">Em Contato</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.emAnalise}</p>
                    <p className="text-xs text-muted-foreground">Em Análise</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.aprovado}</p>
                    <p className="text-xs text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.perdidas}</p>
                    <p className="text-xs text-muted-foreground">Perdidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Percent className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.taxaConversao}%</p>
                    <p className="text-xs text-muted-foreground">Conversão</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.valorTotal)}</p>
                    <p className="text-xs text-muted-foreground">Valor Ativo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {NEGOTIATION_STATUS.filter(s => !['perdida', 'cancelado'].includes(s.value)).map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <div className="text-center py-12">
                      <Handshake className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Nenhuma negociação encontrada</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Clique em "Nova Negociação" para começar
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Imóvel</TableHead>
                            <TableHead>Corretor</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredNegotiations.map((negotiation) => (
                            <TableRow key={negotiation.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{negotiation.client_name}</p>
                                  {negotiation.client_phone && (
                                    <p className="text-xs text-muted-foreground">{negotiation.client_phone}</p>
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
                              <TableCell>{getStatusBadge(negotiation.status)}</TableCell>
                              <TableCell>
                                {format(new Date(negotiation.start_date), "dd/MM/yy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(negotiation)}
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOpenSaleConversion(negotiation)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    title="Converter em Venda"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    <span className="hidden sm:inline ml-1">VENDA</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleOpenLossDialog(negotiation)}
                                    title="Registrar Perda"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline ml-1">PERDA</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(negotiation.id)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
                    <Badge variant="secondary" className="ml-2">
                      {formatCurrency(stats.valorPerdido)} perdidos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLostNegotiations.length === 0 ? (
                    <div className="text-center py-12">
                      <XCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Nenhuma negociação perdida</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Isso é uma boa notícia! 🎉
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
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
                                    <p className="text-xs text-muted-foreground">{negotiation.client_phone}</p>
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
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                  {negotiation.loss_reason || 'Não informado'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(negotiation.updated_at), "dd/MM/yy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(negotiation.id)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

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
    </div>
  );
};

export default Negociacoes;
