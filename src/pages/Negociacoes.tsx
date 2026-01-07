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
  ArrowRight
} from "lucide-react";
import { useNegotiations, CreateNegotiationInput, Negotiation } from "@/hooks/useNegotiations";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const NEGOTIATION_STATUS = [
  { value: 'em_contato', label: 'Em Contato', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'proposta_enviada', label: 'Proposta Enviada', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'em_analise', label: 'Em Análise', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'aprovado', label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
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
  const { negotiations, loading, createNegotiation, updateNegotiation, deleteNegotiation } = useNegotiations();
  const { brokers } = useBrokers();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNegotiation, setEditingNegotiation] = useState<Negotiation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [confirmSaleId, setConfirmSaleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
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

  // Filter negotiations
  const filteredNegotiations = useMemo(() => {
    return negotiations.filter(negotiation => {
      const matchesSearch = 
        negotiation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        negotiation.observations?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || negotiation.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [negotiations, searchTerm, filterStatus]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = negotiations.length;
    const emContato = negotiations.filter(n => n.status === 'em_contato').length;
    const propostaEnviada = negotiations.filter(n => n.status === 'proposta_enviada').length;
    const emAnalise = negotiations.filter(n => n.status === 'em_analise').length;
    const aprovado = negotiations.filter(n => n.status === 'aprovado').length;
    const valorTotal = negotiations.reduce((sum, n) => sum + Number(n.negotiated_value), 0);

    return { total, emContato, propostaEnviada, emAnalise, aprovado, valorTotal };
  }, [negotiations]);

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

  const handleConcludeSale = async () => {
    if (!confirmSaleId) return;
    
    try {
      await updateNegotiation({ id: confirmSaleId, status: 'venda_concluida' });
      setConfirmSaleId(null);
    } catch (error) {
      // Error handled by hook
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
                          {NEGOTIATION_STATUS.map((status) => (
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Handshake className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
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
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.valorTotal)}</p>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
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
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {NEGOTIATION_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Negotiations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="w-5 h-5 text-primary" />
                Lista de Negociações
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
                              {negotiation.status === 'aprovado' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setConfirmSaleId(negotiation.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                  title="Concluir Venda"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
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
        </div>
      </div>

      {/* Confirm Sale Dialog */}
      <AlertDialog open={!!confirmSaleId} onOpenChange={() => setConfirmSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, esta negociação será convertida em uma venda e movida automaticamente para a tela de Vendas.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConcludeSale}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar Venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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