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
  Users,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  Handshake,
  Phone,
  MessageCircle,
  Percent,
  TrendingUp
} from "lucide-react";
import { useFollowUps, CreateFollowUpInput, FollowUp as FollowUpType } from "@/hooks/useFollowUps";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { format, isToday, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FollowUpStatusBadge } from "@/components/followup/FollowUpStatusBadge";
import { ConvertToNegotiationDialog } from "@/components/followup/ConvertToNegotiationDialog";
import { AddContactDialog } from "@/components/followup/AddContactDialog";
import { ResponsiveStatCard } from "@/components/negotiations/ResponsiveStatCard";
import { ExpandableCell } from "@/components/ExpandableCell";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Conversion dialog
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedForConversion, setSelectedForConversion] = useState<FollowUpType | null>(null);
  
  // Add contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedForContact, setSelectedForContact] = useState<FollowUpType | null>(null);
  
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
      
      return matchesSearch && matchesStatus;
    });
  }, [followUps, searchTerm, filterStatus]);

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
                Follow Up
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhamento de leads e clientes em prospecção
              </p>
            </div>
            
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
              <div className="flex flex-col sm:flex-row gap-4">
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
                  <SelectTrigger className="w-full sm:w-48">
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
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
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
                    {sortedFollowUps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum lead encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedFollowUps.map((followUp) => {
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
                            <TableCell className="font-medium">
                              {followUp.client_name}
                            </TableCell>
                            <TableCell>
                              {followUp.client_phone ? (
                                <a 
                                  href={formatWhatsAppLink(followUp.client_phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  {followUp.client_phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <ExpandableCell 
                                content={followUp.property_interest || 'Não definido'} 
                                maxLength={30}
                                title="Imóvel de Interesse"
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatCurrency(followUp.estimated_vgv)}
                            </TableCell>
                            <TableCell>{getBrokerName(followUp.broker_id)}</TableCell>
                            <TableCell>
                              {followUp.next_contact_date ? (
                                <span className={cn(
                                  "flex items-center gap-1",
                                  dateStatus === 'overdue' && 'text-red-600 font-medium',
                                  dateStatus === 'today' && 'text-yellow-600 font-medium'
                                )}>
                                  {dateStatus === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                                  {dateStatus === 'today' && <Clock className="w-3 h-3" />}
                                  {format(parseISO(followUp.next_contact_date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <FollowUpStatusBadge 
                                status={followUp.status}
                                label={statusConfig?.label}
                                color={statusConfig?.color}
                                icon={statusConfig?.icon}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenConversion(followUp)}
                                  className="gap-1 bg-primary hover:bg-primary/90"
                                  title="Converter em Negociação"
                                >
                                  <Handshake className="w-4 h-4" />
                                  <span className="hidden sm:inline">Negociação</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenContact(followUp)}
                                  title="Registrar contato"
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(followUp)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteId(followUp.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
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
    </div>
  );
};

export default FollowUpPage;
