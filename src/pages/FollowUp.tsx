import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";

/** Wrapper com barra de rolagem horizontal também no topo, sincronizada com a debaixo. */
const DoubleScroll: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom) return;
    const update = () => setWidth(bottom.scrollWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bottom);
    return () => ro.disconnect();
  }, [children]);

  const syncing = useRef(false);
  const onScroll = (from: "top" | "bottom") => () => {
    if (syncing.current) return;
    const a = from === "top" ? topRef.current : bottomRef.current;
    const b = from === "top" ? bottomRef.current : topRef.current;
    if (!a || !b) return;
    syncing.current = true;
    b.scrollLeft = a.scrollLeft;
    requestAnimationFrame(() => (syncing.current = false));
  };

  return (
    <div className={className}>
      <div ref={topRef} onScroll={onScroll("top")} className="overflow-x-auto overflow-y-hidden">
        <div style={{ width, height: 1 }} />
      </div>
      <div ref={bottomRef} onScroll={onScroll("bottom")} className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
};
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  UserPlus,
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
  Settings,
  Bell,
  BellOff,
  Download,
  FileDown,
  TrendingUp
} from "lucide-react";
import { useFollowUps, CreateFollowUpInput, FollowUp as FollowUpType } from "@/hooks/useFollowUps";

import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BrandedFollowUpReportDialog } from '@/components/followup/BrandedFollowUpReportDialog';


const LEAD_ORIGIN_OPTIONS = [
  "Marketplace",
  "Tráfego Pago (Patrocinado)",
  "Ação de Rua",
  "Lista Imobiliária",
  "Lista Pessoal",
  "Anúncio Geral",
  "Indicação",
  "Outro"
];

const FollowUpPage = () => {
  const { user, profile, isCorretor } = useAuth();
  const { toast } = useToast();
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
  const [filterOrigin, setFilterOrigin] = useState<string>("all");
  
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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength <= 2) return phoneNumber;
    if (phoneNumberLength <= 6) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    if (phoneNumberLength <= 10) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };
  
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
    origem: '',
    reminder_enabled: false,
  });

  // Get current user's broker ID
  const currentBroker = brokers.find(b => b.user_id === user?.id);

  // Pre-select current broker if available and not already set
  React.useEffect(() => {
    if (currentBroker && !formData.broker_id && !editingFollowUp) {
      setFormData(prev => ({ ...prev, broker_id: currentBroker.id }));
    }
  }, [currentBroker, formData.broker_id, editingFollowUp]);

  // Show warning if broker profile is missing
  React.useEffect(() => {
    if (isCorretor() && !loading && !currentBroker && brokers.length > 0) {
      toast({
        title: "Perfil Incompleto",
        description: "Seu perfil de corretor não foi encontrado. Por favor, contate o administrador para vincular seu usuário ao cadastro de corretores.",
        variant: "destructive",
      });
    }
  }, [isCorretor, loading, currentBroker, brokers, toast]);

  // Filter follow-ups
  const filteredFollowUps = useMemo(() => {
    return followUps.filter(followUp => {
      const matchesSearch = 
        followUp.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.property_interest?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.observations?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || followUp.status === filterStatus;
      const matchesBroker = filterBroker === 'all' || followUp.broker_id === filterBroker;
      const matchesOrigin = filterOrigin === 'all' || followUp.origem === filterOrigin;
      
      return matchesSearch && matchesStatus && matchesBroker && matchesOrigin;
    });
  }, [followUps, searchTerm, filterStatus, filterBroker, filterOrigin]);

  // Sort: newest created first (recém-cadastrados no topo)
  const sortedFollowUps = useMemo(() => {
    return [...filteredFollowUps].sort((a, b) => {
      const aC = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bC = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bC - aC;
    });
  }, [filteredFollowUps]);


  // Converted count (would need historical data)
  const convertedCount = 0; // This would come from a separate query
  const conversionRate = followUps.length > 0 
    ? ((convertedCount / (followUps.length + convertedCount)) * 100).toFixed(1)
    : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Determine the correct broker ID
    let brokerId = formData.broker_id;
    
    if (isCorretor()) {
      if (currentBroker) {
        brokerId = currentBroker.id;
      } else {
        toast({
          title: "Erro de perfil",
          description: "Seu usuário não está vinculado a um corretor cadastrado. Por favor, contate o administrador para regularizar seu acesso.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    }

    if (!brokerId) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione um corretor responsável.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const dataToSubmit = {
      ...formData,
      broker_id: brokerId,
      // Ensure empty date is sent as null
      next_contact_date: formData.next_contact_date || null,
    };

    try {
      if (editingFollowUp) {
        await updateFollowUp({ id: editingFollowUp.id, ...dataToSubmit });
      } else {
        await createFollowUp(dataToSubmit);
      }
      handleCloseForm();
    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao tentar salvar o lead. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
      origem: followUp.origem,
      reminder_enabled: followUp.reminder_enabled || false,
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
      origem: '',
      reminder_enabled: false,
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

  const handleStatusChange = async (followUpId: string, newStatus: string) => {
    try {
      await updateFollowUp({ id: followUpId, status: newStatus });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleReminder = async (followUp: FollowUpType) => {
    try {
      await updateFollowUp({ 
        id: followUp.id, 
        reminder_enabled: !followUp.reminder_enabled 
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleExportPDF = useCallback((type: 'filtered' | 'total') => {
    const dataToExport = type === 'filtered' ? sortedFollowUps : followUps;
    
    if (dataToExport.length === 0) {
      toast({
        title: "Nada para exportar",
        description: "Não há dados que correspondam aos filtros atuais.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF('landscape');
    
    // Header
    doc.setFontSize(18);
    doc.text('Relatório de Follow-up / Clientes', 14, 15);
    doc.setFontSize(10);
    doc.text(`Tipo: ${type === 'filtered' ? 'Filtrado' : 'Total'} | Data: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 22);

    const tableHeaders = [['Cliente', 'Telefone', 'Origem', 'Imóvel de Interesse', 'VGV', 'Status', 'Próximo Contato', 'Responsável']];
    
    const tableRows = dataToExport.map(f => {
      const statusObj = getStatusByValue(f.status);
      const brokerName = getBrokerName(f.broker_id);
      
      return [
        f.client_name,
        f.client_phone || '',
        f.origem || '',
        f.property_interest || '',
        formatCurrency(f.estimated_vgv),
        statusObj?.label || f.status,
        f.next_contact_date ? format(parseISO(f.next_contact_date), "dd/MM/yyyy") : '-',
        brokerName
      ];
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 133, 244] }
    });

    doc.save(`follow_up_clientes_${type}_${format(new Date(), "dd-MM-yyyy")}.pdf`);
    
    toast({
      title: "Exportação concluída",
      description: `${dataToExport.length} registros exportados para PDF com sucesso.`,
    });
  }, [sortedFollowUps, followUps, getStatusByValue, brokers, toast]);

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
                Follow-up / Clientes
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhamento de leads e clientes em prospecção
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportPDF('filtered')}>
                    Exportar PDF Filtrados ({filteredFollowUps.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF('total')}>
                    Exportar PDF Total ({followUps.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <BrandedFollowUpReportDialog followUps={filteredFollowUps as any} brokers={brokers} getStatusLabel={(s) => getStatusByValue(s)?.label || s} filteredCount={filteredFollowUps.length} />


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
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    {editingFollowUp ? 'Editar Follow Up' : 'Cadastrar Lead'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingFollowUp 
                      ? 'Atualize os dados do acompanhamento deste cliente.' 
                      : 'Preencha os dados para cadastrar um novo cliente e iniciar o acompanhamento.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                  {/* Seção: Informações do Cliente */}
                  <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Informações do Cliente
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Nome do Cliente *</label>
                        <Input
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          placeholder="Nome completo"
                          className="h-9 bg-background"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Telefone (WhatsApp)</label>
                        <Input
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: formatPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          className="h-9 bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção: Interesse e Valores */}
                  <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> Interesse e Valores
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Imóvel de Interesse</label>
                        <Input
                          value={formData.property_interest}
                          onChange={(e) => setFormData({ ...formData, property_interest: e.target.value })}
                          placeholder="Ex: Apartamento 2 quartos na Zona Sul"
                          className="h-9 bg-background"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">VGV Estimado</label>
                          <CurrencyInput
                            value={formData.estimated_vgv}
                            onChange={(value) => setFormData({ ...formData, estimated_vgv: value })}
                            placeholder="0,00"
                            className="h-9 bg-background"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Origem do Lead *</label>
                          <Select
                            value={formData.origem}
                            onValueChange={(value) => setFormData({ ...formData, origem: value })}
                            required
                          >
                            <SelectTrigger className="h-9 bg-background">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_ORIGIN_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção: Agendamento e Responsável */}
                  <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Agendamento e Responsável
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        {!isCorretor() && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">Corretor Responsável *</label>
                            <Select
                              value={formData.broker_id}
                              onValueChange={(value) => setFormData({ ...formData, broker_id: value })}
                              required
                            >
                              <SelectTrigger className="h-9 bg-background">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {brokers.map((broker) => (
                                  <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Status</label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                          >
                            <SelectTrigger className="h-9 bg-background">
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
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Próximo Contato</label>
                          <Input
                            type="date"
                            value={formData.next_contact_date}
                            onChange={(e) => setFormData({ ...formData, next_contact_date: e.target.value })}
                            className="h-9 bg-background px-3"
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 border rounded-lg bg-background shadow-sm">
                          <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-primary" />
                            <div className="leading-tight">
                              <p className="text-[11px] font-bold">Lembrete</p>
                              <p className="text-[9px] text-muted-foreground">Notificação ativa</p>
                            </div>
                          </div>
                          <Switch 
                            checked={formData.reminder_enabled} 
                            onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })} 
                            className="scale-90"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Observações Gerais</label>
                    <Textarea
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder="Histórico ou detalhes importantes..."
                      rows={3}
                      className="bg-muted/10"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1 h-10">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 h-10 shadow-lg" disabled={submitting}>
                      {submitting ? 'Salvando...' : (editingFollowUp ? 'Salvar Alterações' : 'Cadastrar Lead')}
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
              label="Clientes em Follow-up"
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

                <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Filtrar origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    {LEAD_ORIGIN_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
                      {[...brokers]
                        .filter((b) => (b as any).status !== 'inativo')
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((broker) => (
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
                  <div className="block md:hidden space-y-5 p-3">
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
                          <CardContent className="p-4 space-y-2.5">
                            {/* Linha 1: Nome + Status */}
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-foreground truncate flex-1 text-base leading-tight">
                                {followUp.client_name}
                              </p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="focus:outline-none hover:opacity-80 shrink-0">
                                    <FollowUpStatusBadge
                                      status={followUp.status}
                                      label={statusConfig?.label}
                                      color={statusConfig?.color}
                                      icon={statusConfig?.icon}
                                    />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  {statuses.map((s) => (
                                    <DropdownMenuItem
                                      key={s.value}
                                      onClick={() => handleStatusChange(followUp.id, s.value)}
                                      className={cn(followUp.status === s.value && "bg-accent font-medium")}
                                    >
                                      <span className="mr-2">{s.icon}</span> {s.label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setStatusManagerOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Cadastrar Novo Status
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Linha 2: VGV em destaque + Origem */}
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-lg font-bold text-foreground tabular-nums">
                                {formatCurrency(followUp.estimated_vgv)}
                              </p>
                              {followUp.origem && (
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                                  {followUp.origem}
                                </span>
                              )}
                            </div>

                            {/* Linha 3: Metadata — corretor · próximo contato · imóvel */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 truncate max-w-[45%]">
                                <User className="w-3 h-3 shrink-0" />
                                <span className="truncate">{getBrokerName(followUp.broker_id)}</span>
                              </span>
                              {followUp.next_contact_date && (
                                <span className={cn(
                                  "inline-flex items-center gap-1 font-medium",
                                  dateStatus === 'overdue' && 'text-destructive',
                                  dateStatus === 'today' && 'text-yellow-600',
                                  dateStatus === 'future' && 'text-muted-foreground'
                                )}>
                                  {dateStatus === 'overdue' && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                                  {dateStatus === 'today' && <Clock className="w-3 h-3 animate-pulse" />}
                                  {dateStatus === 'future' && <Clock className="w-3 h-3" />}
                                  {daysLabel || format(parseISO(followUp.next_contact_date), "dd/MM", { locale: ptBR })}
                                </span>
                              )}
                              {followUp.property_interest && (
                                <span className="truncate max-w-full opacity-80">· {followUp.property_interest}</span>
                              )}
                            </div>

                            {/* Ações rápidas sempre visíveis */}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
                              {followUp.client_phone && (
                                <a
                                  href={formatWhatsAppLink(followUp.client_phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 transition"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleOpenContact(followUp)} className="h-9 w-9 p-0" title="Registrar contato">
                                <Phone className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOpenNotes(followUp)} className="h-9 w-9 p-0" title="Notas">
                                <StickyNote className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleReminder(followUp)}
                                className="h-9 w-9 p-0"
                                title="Lembrete"
                              >
                                {followUp.reminder_enabled
                                  ? <Bell className="w-4 h-4 text-primary" />
                                  : <BellOff className="w-4 h-4 text-muted-foreground/50" />}
                              </Button>
                              <Button variant="default" size="sm" onClick={() => handleOpenConversion(followUp)} className="flex-1 h-9 gap-1 ml-auto">
                                <Handshake className="w-4 h-4" /> Negociar
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(followUp)}>
                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setExpandedId(isExpanded ? null : followUp.id)}>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                                    Histórico
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setDeleteId(followUp.id)} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {isExpanded && (
                              <div className="pl-2 border-l-2 border-border/50">
                                <FollowUpContactHistory followUpId={followUp.id} />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {/* Desktop Table View */}
                  <DoubleScroll className="hidden md:block">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead>Imóvel</TableHead>
                          <TableHead>VGV</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Próximo Contato</TableHead>
                          <TableHead className="text-center">Lembrete</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedFollowUps.map((followUp, idx) => {
                          const dateStatus = getDateStatus(followUp.next_contact_date);
                          const statusConfig = getStatusByValue(followUp.status);
                          const daysLabel = getDaysLabel(followUp.next_contact_date);
                          return (
                            <TableRow
                              key={followUp.id}
                              className={cn(
                                "transition-colors",
                                idx % 2 === 1 && "bg-sky-50/60 dark:bg-sky-950/20",
                                "hover:bg-muted/40",
                                dateStatus === 'overdue' && 'bg-destructive/5 hover:bg-destructive/10',
                                dateStatus === 'today' && 'bg-yellow-500/5 hover:bg-yellow-500/10'
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
                                <Badge variant="outline" className="text-[10px] uppercase font-normal">
                                  {followUp.origem}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <ExpandableCell content={followUp.property_interest || 'Não definido'} maxLength={30} title="Imóvel de Interesse" />
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatCurrency(followUp.estimated_vgv)}</TableCell>
                              <TableCell>{getBrokerName(followUp.broker_id)}</TableCell>
                              <TableCell>
                                {followUp.next_contact_date ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className={cn("flex items-center gap-1", dateStatus === 'overdue' && 'text-destructive font-medium', dateStatus === 'today' && 'text-yellow-600 font-medium')}>
                                      {dateStatus === 'overdue' && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                                      {dateStatus === 'today' && <Clock className="w-3 h-3 animate-pulse" />}
                                      {format(parseISO(followUp.next_contact_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                    {daysLabel && (
                                      <span className={cn(
                                        "text-[10px] font-medium",
                                        dateStatus === 'overdue' && 'text-destructive',
                                        dateStatus === 'today' && 'text-yellow-600',
                                        dateStatus === 'future' && 'text-muted-foreground'
                                      )}>
                                        {daysLabel}
                                      </span>
                                    )}
                                  </div>
                                ) : <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleToggleReminder(followUp)}
                                >
                                  {followUp.reminder_enabled ? (
                                    <Bell className="w-4 h-4 text-primary" />
                                  ) : (
                                    <BellOff className="w-4 h-4 text-muted-foreground/40" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="focus:outline-none hover:opacity-80 transition-opacity">
                                      <FollowUpStatusBadge
                                        status={followUp.status}
                                        label={statusConfig?.label}
                                        color={statusConfig?.color}
                                        icon={statusConfig?.icon}
                                      />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    {statuses.map((s) => (
                                      <DropdownMenuItem 
                                        key={s.value} 
                                        onClick={() => handleStatusChange(followUp.id, s.value)}
                                        className={cn(followUp.status === s.value && "bg-accent font-medium")}
                                      >
                                        <span className="mr-2">{s.icon}</span> {s.label}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setStatusManagerOpen(true)}>
                                      <Plus className="w-4 h-4 mr-2" /> Cadastrar Novo Status
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="default" size="sm" onClick={() => handleOpenConversion(followUp)} className="h-8 gap-1">
                                    <Handshake className="w-3.5 h-3.5" /> Negociação
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => handleOpenNotes(followUp)} className="h-8 w-8" title="Notas">
                                    <StickyNote className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => handleOpenContact(followUp)} className="h-8 w-8">
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(followUp)} className="h-8 w-8">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(followUp.id)} className="text-destructive h-8 w-8">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </DoubleScroll>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConvertToNegotiationDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        followUp={selectedForConversion}
        onConfirm={handleConfirmConversion}
      />

      <AddContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onConfirm={handleConfirmContact}
      />

      <FollowUpNotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        followUpId={selectedForNotes?.id || ''}
        clientName={selectedForNotes?.client_name || ''}
      />

      <FollowUpStatusManagerDialog
        open={statusManagerOpen}
        onOpenChange={setStatusManagerOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lead e todo o seu histórico serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FollowUpPage;
