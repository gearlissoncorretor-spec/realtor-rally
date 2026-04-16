import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Handshake, Settings, Clock, Thermometer, XCircle, X, AlertTriangle, Undo2, Trash2, Download } from "lucide-react";
import NegotiationsExportDialog from "@/components/negotiations/NegotiationsExportDialog";
import { useNegotiations, CreateNegotiationInput, Negotiation } from "@/hooks/useNegotiations";
import { useBrokers } from "@/hooks/useBrokers";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { SaleConversionDialog, SaleConversionData } from "@/components/negotiations/SaleConversionDialog";
import { LossReasonDialog } from "@/components/negotiations/LossReasonDialog";
import { StatusManagerDialog } from "@/components/negotiations/StatusManagerDialog";
import { NegotiationNotesDialog } from "@/components/negotiations/NegotiationNotesDialog";
import { NegotiationFormDialog } from "@/components/negotiations/NegotiationFormDialog";
import { NegotiationStatsCards } from "@/components/negotiations/NegotiationStatsCards";
import { NegotiationActiveTable } from "@/components/negotiations/NegotiationActiveTable";
import { NegotiationLostTable } from "@/components/negotiations/NegotiationLostTable";
import { useNegotiationStatuses } from "@/hooks/useNegotiationStatuses";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SaleCelebration } from "@/components/SaleCelebration";

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
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);
  const [saleConversionOpen, setSaleConversionOpen] = useState(false);
  const [selectedForSale, setSelectedForSale] = useState<Negotiation | null>(null);
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [selectedForLoss, setSelectedForLoss] = useState<Negotiation | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ brokerName: '', clientName: '', saleValue: 0 });
  const [showStalledAlert, setShowStalledAlert] = useState(true);
  const [returnToFollowUpOpen, setReturnToFollowUpOpen] = useState(false);
  const [selectedForFollowUp, setSelectedForFollowUp] = useState<Negotiation | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedForNotes, setSelectedForNotes] = useState<Negotiation | null>(null);

  const currentBroker = brokers.find(b => b.user_id === user?.id);

  const salesFromNegotiations = useMemo(() => {
    return sales.filter(s => s.notes?.toLowerCase().includes('negociação') || s.notes?.toLowerCase().includes('negociacao')).length;
  }, [sales]);

  const filteredNegotiations = useMemo(() => {
    const terminalStatuses = ['perdida', 'venda_concluida'];
    return negotiations.filter(n => {
      const matchesSearch = n.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || n.property_address.toLowerCase().includes(searchTerm.toLowerCase()) || n.observations?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || n.status === filterStatus;
      const matchesTemperature = filterTemperature === 'all' || n.temperature === filterTemperature;
      return matchesSearch && matchesStatus && matchesTemperature && !terminalStatuses.includes(n.status);
    }).sort((a, b) => sortOrder === 'newest' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [negotiations, searchTerm, filterStatus, filterTemperature, sortOrder]);

  const filteredLostNegotiations = useMemo(() => {
    return lostNegotiations.filter(n => n.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || n.property_address.toLowerCase().includes(searchTerm.toLowerCase()) || n.loss_reason?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [lostNegotiations, searchTerm]);

  const stats = useMemo(() => {
    const allNegotiations = [...negotiations, ...lostNegotiations];
    const total = negotiations.length;
    const emAprovacao = negotiations.filter(n => n.status === 'em_aprovacao' || n.status === 'em_analise' || n.status === 'proposta_enviada').length;
    const clienteAprovado = negotiations.filter(n => n.status === 'cliente_aprovado' || n.status === 'aprovado').length;
    const clienteReprovado = negotiations.filter(n => n.status === 'cliente_reprovado').length;
    const emContato = negotiations.filter(n => n.status === 'em_contato').length;
    const valorTotal = negotiations.reduce((sum, n) => sum + Number(n.negotiated_value), 0);
    const perdidas = lostNegotiations.length;
    const valorPerdido = lostNegotiations.reduce((sum, n) => sum + Number(n.negotiated_value), 0);
    const taxaConversao = allNegotiations.length > 0 ? ((salesFromNegotiations / (total + perdidas + salesFromNegotiations)) * 100).toFixed(1) : '0';
    return { total, emContato, emAprovacao, clienteAprovado, clienteReprovado, valorTotal, perdidas, valorPerdido, taxaConversao, vendasConvertidas: salesFromNegotiations };
  }, [negotiations, lostNegotiations, salesFromNegotiations]);

  const handleFormSubmit = async (data: CreateNegotiationInput, isEditing: boolean, editId?: string) => {
    if (isEditing && editId) {
      await updateNegotiation({ id: editId, ...data });
    } else {
      await createNegotiation(data);
    }
  };

  const handleEdit = (n: Negotiation) => { setEditingNegotiation(n); setIsFormOpen(true); };

  const getBrokerName = (brokerId: string) => brokers.find(b => b.id === brokerId)?.name || 'Não encontrado';
  const isApproved = (status: string) => status === 'cliente_aprovado' || status === 'aprovado';

  const handleConfirmSale = async (data: SaleConversionData) => {
    if (!selectedForSale) return;
    try {
      await createSale({
        tipo: 'venda', broker_id: selectedForSale.broker_id, client_name: selectedForSale.client_name,
        client_email: selectedForSale.client_email, client_phone: selectedForSale.client_phone,
        property_address: selectedForSale.property_address,
        property_type: (selectedForSale.property_type || 'apartamento') as any,
        property_value: selectedForSale.negotiated_value, vgv: data.vgv, vgc: data.vgc,
        sale_date: data.sale_date, contract_date: data.contract_date, status: 'confirmada',
        notes: `Venda originada da negociação. ${data.notes || ''} ${selectedForSale.observations || ''}`.trim(),
        vendedor: data.vendedor, captador: data.sale_type === 'revenda' ? data.captador : undefined,
        gerente: data.gerente, origem: data.origem || selectedForSale.origem, sale_type: data.sale_type,
        estilo: data.estilo, produto: data.produto, visibilidade: 'venda', company_id: profile?.company_id || undefined,
      });
      await updateNegotiation({ id: selectedForSale.id, status: 'venda_concluida' });
      refreshSales();
      setCelebrationData({ brokerName: getBrokerName(selectedForSale.broker_id), clientName: selectedForSale.client_name, saleValue: data.vgv });
      setCelebrationOpen(true);
      setSelectedForSale(null);
    } catch (error) { console.error('Erro ao converter negociação em venda:', error); }
  };

  const handleConfirmLoss = async (lossReason: string) => {
    if (!selectedForLoss) return;
    await updateNegotiation({ id: selectedForLoss.id, status: 'perdida', loss_reason: lossReason });
    setSelectedForLoss(null);
  };

  const handleConfirmReturnToFollowUp = async () => {
    if (!selectedForFollowUp) return;
    try {
      await createFollowUp({ broker_id: selectedForFollowUp.broker_id, client_name: selectedForFollowUp.client_name, client_phone: selectedForFollowUp.client_phone || undefined, property_interest: selectedForFollowUp.property_address, estimated_vgv: selectedForFollowUp.negotiated_value, observations: `Retornado da Negociação. ${selectedForFollowUp.observations || ''}`.trim(), status: 'novo_lead' });
      await deleteNegotiation(selectedForFollowUp.id);
      setSelectedForFollowUp(null);
      setReturnToFollowUpOpen(false);
    } catch {}
  };

  const handleDelete = async () => { if (deleteId) { await deleteNegotiation(deleteId); setDeleteId(null); } };

  const stalledNegotiations = useMemo(() => {
    const now = new Date();
    return negotiations.filter(n => Math.floor((now.getTime() - new Date(n.updated_at).getTime()) / (1000 * 60 * 60 * 24)) >= 3);
  }, [negotiations]);

  const isStalled = (n: Negotiation) => Math.floor((new Date().getTime() - new Date(n.updated_at).getTime()) / (1000 * 60 * 60 * 24)) >= 3;

  const TEMPERATURE_OPTIONS = [
    { value: 'fria', label: '❄️ Fria' },
    { value: 'morna', label: '🌤️ Morna' },
    { value: 'quente', label: '🔥 Quente' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
          <div className="flex items-center justify-center h-64"><div className="text-lg text-muted-foreground">Carregando...</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-6">
          <NegotiationStatsCards stats={stats} onClickTotal={() => { setActiveTab('active'); setFilterStatus('all'); setSearchTerm(''); }} />

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Negociações</h1>
              <p className="text-muted-foreground mt-1">Pipeline de vendas e acompanhamento de negociações</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setStatusManagerOpen(true)} title="Gerenciar Status"><Settings className="w-4 h-4" /></Button>
              <Button className="gap-2" onClick={() => { setEditingNegotiation(null); setIsFormOpen(true); }}><Plus className="w-4 h-4" />Nova Negociação</Button>
            </div>
          </div>

          {/* Alerts */}
          {showStalledAlert && stalledNegotiations.length > 0 && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="font-semibold text-destructive">{stalledNegotiations.length} negociação(ões) parada(s) há 3+ dias!</span>
                  <span className="text-muted-foreground hidden sm:inline">— Clientes: {stalledNegotiations.slice(0, 3).map(n => n.client_name).join(', ')}{stalledNegotiations.length > 3 && ` e mais ${stalledNegotiations.length - 3}`}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowStalledAlert(false)} className="h-8 px-2"><X className="w-4 h-4" /></Button>
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-warning/50 bg-warning/10">
            <AlertDescription className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <span><strong className="text-warning">IMPORTANTE:</strong> Cliente <strong>Aprovado</strong> ≠ <strong>Venda</strong>. Uma venda só é registrada ao clicar em "Converter em Venda".</span>
            </AlertDescription>
          </Alert>

          {/* Compact Filters */}
          <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar negociações..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9 bg-background/50 border-border/50" />
              </div>
              {activeTab === 'active' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-44 h-9 text-xs bg-background/50 border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {flowStatuses.map((s) => <SelectItem key={s.value} value={s.value}><div className="flex items-center gap-2"><span>{s.icon}</span>{s.label}</div></SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                    <SelectTrigger className="w-full sm:w-40 h-9 text-xs bg-background/50 border-border/50"><SelectValue placeholder="Termômetro" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"><div className="flex items-center gap-2"><Thermometer className="w-4 h-4" />Todas</div></SelectItem>
                      {TEMPERATURE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-40 h-9 text-xs bg-background/50 border-border/50"><SelectValue placeholder="Ordenar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest"><div className="flex items-center gap-2"><Clock className="w-4 h-4" />Mais recentes</div></SelectItem>
                      <SelectItem value="oldest"><div className="flex items-center gap-2"><Clock className="w-4 h-4" />Mais antigas</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs with badges */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="active" className="gap-2">
                <Handshake className="w-4 h-4" />
                Em Andamento
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-bold">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="lost" className="gap-2">
                <XCircle className="w-4 h-4" />
                Perdidas
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px] font-bold">{stats.perdidas}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <NegotiationActiveTable
                negotiations={filteredNegotiations}
                getBrokerName={getBrokerName}
                getStatusByValue={getStatusByValue}
                isApproved={isApproved}
                isStalled={isStalled}
                onEdit={handleEdit}
                onSaleConversion={(n) => { setSelectedForSale(n); setSaleConversionOpen(true); }}
                onLoss={(n) => { setSelectedForLoss(n); setLossDialogOpen(true); }}
                onReturnFollowUp={(n) => { setSelectedForFollowUp(n); setReturnToFollowUpOpen(true); }}
                onNotes={(n) => { setSelectedForNotes(n); setNotesDialogOpen(true); }}
                onDelete={setDeleteId}
                onNewNegotiation={() => { setEditingNegotiation(null); setIsFormOpen(true); }}
              />
            </TabsContent>

            <TabsContent value="lost">
              <NegotiationLostTable negotiations={filteredLostNegotiations} getBrokerName={getBrokerName} valorPerdido={stats.valorPerdido} onDelete={setDeleteId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <NegotiationFormDialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingNegotiation(null); }} editing={editingNegotiation} brokers={brokers} isCorretor={isCorretor()} currentBrokerId={currentBroker?.id} onSubmit={handleFormSubmit} />
      <StatusManagerDialog open={statusManagerOpen} onOpenChange={setStatusManagerOpen} />
      <SaleConversionDialog open={saleConversionOpen} onOpenChange={setSaleConversionOpen} negotiation={selectedForSale} onConfirm={handleConfirmSale} />
      <LossReasonDialog open={lossDialogOpen} onOpenChange={setLossDialogOpen} negotiation={selectedForLoss} onConfirm={handleConfirmLoss} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta negociação? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90"><Trash2 className="w-4 h-4 mr-2" />Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SaleCelebration open={celebrationOpen} onOpenChange={setCelebrationOpen} brokerName={celebrationData.brokerName} clientName={celebrationData.clientName} saleValue={celebrationData.saleValue} />

      <AlertDialog open={returnToFollowUpOpen} onOpenChange={setReturnToFollowUpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Undo2 className="w-5 h-5 text-primary" />Voltar para Follow Up</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Você está prestes a mover esta negociação de volta para a tela de Follow Up.</p>
              {selectedForFollowUp && (
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {selectedForFollowUp.client_name}</p>
                  <p><strong>Telefone:</strong> {selectedForFollowUp.client_phone || 'Não informado'}</p>
                  <p><strong>Imóvel:</strong> {selectedForFollowUp.property_address}</p>
                  <p><strong>Valor:</strong> {formatCurrency(selectedForFollowUp.negotiated_value)}</p>
                </div>
              )}
              <p className="text-warning">A negociação será removida e um novo registro será criado no Follow Up com status "Novo Lead".</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReturnToFollowUp}><Undo2 className="w-4 h-4 mr-2" />Voltar para Follow Up</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NegotiationNotesDialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen} negotiation={selectedForNotes} />
    </div>
  );
};

export default Negociacoes;
