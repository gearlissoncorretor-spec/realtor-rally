import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Users,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  Handshake,
  Phone,
  MessageCircle,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Settings
} from "lucide-react";
import { useFollowUps, CreateFollowUpInput, FollowUp as FollowUpType } from "@/hooks/useFollowUps";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { format, isToday, isPast, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FollowUpStatusBadge } from "@/components/followup/FollowUpStatusBadge";
import { ConvertToNegotiationDialog } from "@/components/followup/ConvertToNegotiationDialog";
import { AddContactDialog } from "@/components/followup/AddContactDialog";
import { FollowUpNotesDialog } from "@/components/followup/FollowUpNotesDialog";
import { FollowUpContactHistory } from "@/components/followup/FollowUpContactHistory";
import { ResponsiveStatCard } from "@/components/negotiations/ResponsiveStatCard";
import { ExpandableCell } from "@/components/ExpandableCell";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FollowUpStatusManagerDialog } from "@/components/followup/FollowUpStatusManagerDialog";
import { cn } from "@/lib/utils";

const FollowUpPage = () => {
  const { user, isCorretor } = useAuth();
  const { 
    followUps, 
    statuses, 
    stats, 
    loading, 
    createFollowUp, 
    updateFollowUp, 
    deleteFollowUp,
    convertToNegotiation,
    addContact,
    getStatusByValue 
  } = useFollowUps();
  const { brokers } = useBrokers();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUpType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBroker, setFilterBroker] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Conversion dialog
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedForConversion, setSelectedForConversion] = useState<FollowUpType | null>(null);
  
  // Add contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedForContact, setSelectedForContact] = useState<FollowUpType | null>(null);
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);

  // Notes dialog
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedForNotes, setSelectedForNotes] = useState<FollowUpType | null>(null);

  // Expanded contact history (mobile)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateFollowUpInput>({
    broker_id: '',
    client_name: '',
    client_phone: '',
    property_interest: '',
    estimated_vgv: 0,
    next_contact_date: '',
    observations: '',
    status: 'novo_lead',
  });

  // Get current user's broker ID
  const currentBroker = brokers.find(b => b.user_id === user?.id);

  // Filter follow-ups
  const filteredFollowUps = useMemo(() => {
    return followUps.filter(followUp => {
      const matchesSearch = 
        followUp.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.property_interest?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.observations?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || followUp.status === filterStatus;
      const matchesBroker = filterBroker === 'all' || followUp.broker_id === filterBroker;
      
      return matchesSearch && matchesStatus && matchesBroker;
    });
  }, [followUps, searchTerm, filterStatus, filterBroker]);

  // Sort by urgency (overdue first, then today, then by date)
  const sortedFollowUps = useMemo(() => {
    return [...filteredFollowUps].sort((a, b) => {
      const aDate = a.next_contact_date ? parseISO(a.next_contact_date) : null;
      const bDate = b.next_contact_date ? parseISO(b.next_contact_date) : null;
      
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      
      return aDate.getTime() - bDate.getTime();
    });
  }, [filteredFollowUps]);

  // Converted count (would need historical data)
  const convertedCount = 0; // This would come from a separate query
  const conversionRate = followUps.length > 0 
    ? ((convertedCount / (followUps.length + convertedCount)) * 100).toFixed(1)
    : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      broker_id: isCorretor() && currentBroker ? currentBroker.id : formData.broker_id,
    };

    try {
      if (editingFollowUp) {
        await updateFollowUp({ id: editingFollowUp.id, ...dataToSubmit });
      } else {
        await createFollowUp(dataToSubmit);
      }
      handleCloseForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (followUp: FollowUpType) => {
    setEditingFollowUp(followUp);
    setFormData({
      broker_id: followUp.broker_id,
      client_name: followUp.client_name,
      client_phone: followUp.client_phone || '',
      property_interest: followUp.property_interest || '',
      estimated_vgv: followUp.estimated_vgv,
      next_contact_date: followUp.next_contact_date || '',
      observations: followUp.observations || '',
      status: followUp.status,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFollowUp(null);
    setFormData({
      broker_id: '',
      client_name: '',
      client_phone: '',
      property_interest: '',
      estimated_vgv: 0,
      next_contact_date: '',
      observations: '',
      status: 'novo_lead',
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFollowUp(deleteId);
      setDeleteId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleOpenConversion = (followUp: FollowUpType) => {
    setSelectedForConversion(followUp);
    setConvertDialogOpen(true);
  };

  const handleConfirmConversion = async () => {
    if (!selectedForConversion) return;
    await convertToNegotiation(selectedForConversion);
    setConvertDialogOpen(false);
    setSelectedForConversion(null);
  };

  const handleOpenContact = (followUp: FollowUpType) => {
    setSelectedForContact(followUp);
    setContactDialogOpen(true);
  };

  const handleConfirmContact = async (contactType: string, notes?: string) => {
    if (!selectedForContact) return;
    await addContact({ followUpId: selectedForContact.id, contactType, notes });
    setContactDialogOpen(false);
    setSelectedForContact(null);
  };

  const handleOpenNotes = (followUp: FollowUpType) => {
    setSelectedForNotes(followUp);
    setNotesDialogOpen(true);
  };

  const getBrokerName = (brokerId: string) => {
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.name || 'Não encontrado';
  };

  const formatWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithCountry}`;
  };

  const getDateStatus = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return 'today';
    if (isPast(date)) return 'overdue';
    return 'future';
  };

  const getDaysLabel = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    const days = differenceInDays(date, new Date());
    if (days === 0) return 'Hoje';
    if (days < 0) return `${Math.abs(days)}d atrás`;
    return `em ${days}d`;
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
          {/* Header */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Follow Up
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhamento de leads e clientes em prospecção
              </p>
            </div>
            
            <div className="flex items-center gap-2">
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
                    Novo Lead
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingFollowUp ? 'Editar Follow Up' : 'Novo Lead'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Broker selector */}
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
                    <label className="text-sm font-medium">Nome do Cliente *</label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Nome do cliente"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Telefone (WhatsApp)</label>
                    <Input
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Imóvel de Interesse</label>
                    <Input
                      value={formData.property_interest}
                      onChange={(e) => setFormData({ ...formData, property_interest: e.target.value })}
                      placeholder="Ex: Apartamento 2 quartos na Zona Sul"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">VGV Estimado</label>
                    <CurrencyInput
                      value={formData.estimated_vgv}
                      onChange={(value) => setFormData({ ...formData, estimated_vgv: value })}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Data Próximo Contato</label>
                      <Input
                        type="date"
                        value={formData.next_contact_date}
                        onChange={(e) => setFormData({ ...formData, next_contact_date: e.target.value })}
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
                          {statuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.icon} {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Anotações</label>
                    <Textarea
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder="Observações sobre o cliente..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingFollowUp ? 'Salvar' : 'Criar Lead'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <ResponsiveStatCard
              icon={Users}
              iconColor="text-blue-500"
              bgColor="bg-blue-500/10"
              value={stats.total}
              label="Clientes em Follow Up"
            />
            <ResponsiveStatCard
              icon={Clock}
              iconColor="text-yellow-500"
              bgColor="bg-yellow-500/10"
              value={stats.dueToday}
              label="Contatos Hoje"
            />
            <ResponsiveStatCard
              icon={AlertTriangle}
              iconColor="text-red-500"
              bgColor="bg-red-500/10"
              value={stats.overdue}
              label="Atrasados"
            />
            <ResponsiveStatCard
              icon={DollarSign}
              iconColor="text-emerald-500"
              bgColor="bg-emerald-500/10"
              value={formatCurrency(stats.vgvPotential)}
              label="VGV Potencial"
            />
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar cliente, imóvel..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Filtrar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.icon} {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isCorretor() && (
                  <Select value={filterBroker} onValueChange={setFilterBroker}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="Filtrar corretor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os corretores</SelectItem>
                      {brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardContent className="p-0">
              {sortedFollowUps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground p-4">
                  Nenhum lead encontrado
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3 p-3">
                    {sortedFollowUps.map((followUp) => {
                      const dateStatus = getDateStatus(followUp.next_contact_date);
                      const statusConfig = getStatusByValue(followUp.status);
                      const daysLabel = getDaysLabel(followUp.next_contact_date);
                      const isExpanded = expandedId === followUp.id;
                      return (
                        <Card
                          key={followUp.id}
                          className={cn(
                            "border-l-4 transition-all",
                            dateStatus === 'overdue' && 'border-l-destructive bg-destructive/5',
                            dateStatus === 'today' && 'border-l-yellow-500 bg-yellow-500/5',
                            dateStatus === 'future' && 'border-l-primary/30',
                            !dateStatus && 'border-l-border'
                          )}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground truncate">{followUp.client_name}</p>
                                {followUp.client_phone && (
                                  <a
                                    href={formatWhatsAppLink(followUp.client_phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-green-600"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    {followUp.client_phone}
                                  </a>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <FollowUpStatusBadge
                                  status={followUp.status}
                                  label={statusConfig?.label}
                                  color={statusConfig?.color}
                                  icon={statusConfig?.icon}
                                />
                                {daysLabel && (
                                  <span className={cn(
                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                    dateStatus === 'overdue' && 'bg-destructive/10 text-destructive',
                                    dateStatus === 'today' && 'bg-yellow-500/10 text-yellow-600',
                                    dateStatus === 'future' && 'bg-muted text-muted-foreground'
                                  )}>
                                    {daysLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Imóvel</p>
                                <p className="truncate">{followUp.property_interest || 'Não definido'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">VGV</p>
                                <p className="font-semibold">{formatCurrency(followUp.estimated_vgv)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Responsável</p>
                                <p className="truncate">{getBrokerName(followUp.broker_id)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Próximo Contato</p>
                                {followUp.next_contact_date ? (
                                  <span className={cn(
                                    "flex items-center gap-1 text-sm",
                                    dateStatus === 'overdue' && 'text-destructive font-medium',
                                    dateStatus === 'today' && 'text-yellow-600 font-medium'
                                  )}>
                                    {dateStatus === 'overdue' && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                                    {dateStatus === 'today' && <Clock className="w-3 h-3 animate-pulse" />}
                                    {format(parseISO(followUp.next_contact_date), "dd/MM/yy", { locale: ptBR })}
                                  </span>
                                ) : <span className="text-muted-foreground">-</span>}
                              </div>
                            </div>

                            {/* Expandable contact history */}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : followUp.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Histórico de contatos
                            </button>
                            {isExpanded && (
                              <div className="pl-2 border-l-2 border-border/50">
                                <FollowUpContactHistory followUpId={followUp.id} />
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                              <Button variant="default" size="sm" onClick={() => handleOpenConversion(followUp)} className="flex-1 h-9 gap-1">
                                <Handshake className="w-4 h-4" /> Negociação
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOpenNotes(followUp)} className="h-9" title="Notas">
                                <StickyNote className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOpenContact(followUp)} className="h-9">
                                <Phone className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(followUp)} className="h-9">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteId(followUp.id)} className="text-destructive h-9">
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
                          <TableHead>Telefone</TableHead>
                          <TableHead>Imóvel</TableHead>
                          <TableHead>VGV</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Próximo Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedFollowUps.map((followUp) => {
                          const dateStatus = getDateStatus(followUp.next_contact_date);
                          const statusConfig = getStatusByValue(followUp.status);
                          return (
                            <TableRow
                              key={followUp.id}
                              className={cn(
                                dateStatus === 'overdue' && 'bg-red-500/5',
                                dateStatus === 'today' && 'bg-yellow-500/5'
                              )}
                            >
                              <TableCell className="font-medium">{followUp.client_name}</TableCell>
                              <TableCell>
                                {followUp.client_phone ? (
                                  <a href={formatWhatsAppLink(followUp.client_phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700">
                                    <MessageCircle className="w-4 h-4" />{followUp.client_phone}
                                  </a>
                                ) : <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell>
                                <ExpandableCell content={followUp.property_interest || 'Não definido'} maxLength={30} title="Imóvel de Interesse" />
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatCurrency(followUp.estimated_vgv)}</TableCell>
                              <TableCell>{getBrokerName(followUp.broker_id)}</TableCell>
                              <TableCell>
                                {followUp.next_contact_date ? (
                                  <span className={cn("flex items-center gap-1", dateStatus === 'overdue' && 'text-red-600 font-medium', dateStatus === 'today' && 'text-yellow-600 font-medium')}>
                                    {dateStatus === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                                    {dateStatus === 'today' && <Clock className="w-3 h-3" />}
                                    {format(parseISO(followUp.next_contact_date), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                ) : <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell>
                                <FollowUpStatusBadge status={followUp.status} label={statusConfig?.label} color={statusConfig?.color} icon={statusConfig?.icon} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="default" size="sm" onClick={() => handleOpenConversion(followUp)} className="gap-1 bg-primary hover:bg-primary/90" title="Converter em Negociação">
                                    <Handshake className="w-4 h-4" /><span className="hidden lg:inline">Negociação</span>
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleOpenContact(followUp)} title="Registrar contato">
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(followUp)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(followUp.id)} className="text-destructive hover:text-destructive">
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
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Follow Up</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conversion dialog */}
      <ConvertToNegotiationDialog
        followUp={selectedForConversion}
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        onConfirm={handleConfirmConversion}
      />

      {/* Add contact dialog */}
      <AddContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onConfirm={handleConfirmContact}
      />

      <FollowUpStatusManagerDialog
        open={statusManagerOpen}
        onOpenChange={setStatusManagerOpen}
      />
    </div>
  );
};

export default FollowUpPage;
