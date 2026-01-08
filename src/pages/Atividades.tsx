import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin, 
  Users, 
  Calendar,
  ClipboardList,
  Search,
  Info,
  Loader2
} from "lucide-react";
import { useActivities, CreateActivityInput, BrokerActivity } from "@/hooks/useActivities";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTIVITY_TYPES = [
  { value: 'visita', label: 'Visita', icon: MapPin },
  { value: 'ligacao', label: 'Ligação', icon: Phone },
  { value: 'follow_up', label: 'Follow-up', icon: ClipboardList },
  { value: 'reuniao', label: 'Reunião', icon: Users },
  { value: 'acao_rua', label: 'Ação de Rua', icon: MapPin },
];

const ACTIVITY_STATUS = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'realizada', label: 'Realizada', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
];

const Atividades = () => {
  const { user, isCorretor, isGerente, isDiretor, isAdmin } = useAuth();
  const { activities, loading, createActivity, updateActivity, deleteActivity } = useActivities();
  const { brokers } = useBrokers();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<BrokerActivity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateActivityInput>({
    broker_id: '',
    activity_type: 'visita',
    client_name: '',
    property_reference: '',
    activity_date: new Date().toISOString().split('T')[0],
    observations: '',
    status: 'pendente',
  });

  // Get current user's broker ID
  const currentBroker = brokers.find(b => b.user_id === user?.id);
  
  // Check if user can create activities (corretor with permission or manager+)
  const canCreateActivity = isCorretor() || isGerente() || isDiretor() || isAdmin();

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = 
        activity.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.property_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.observations?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
      const matchesType = filterType === 'all' || activity.activity_type === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [activities, searchTerm, filterStatus, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const dataToSubmit = {
      ...formData,
      broker_id: isCorretor() && currentBroker ? currentBroker.id : formData.broker_id,
    };

    try {
      if (editingActivity) {
        await updateActivity({ id: editingActivity.id, ...dataToSubmit });
      } else {
        await createActivity(dataToSubmit);
      }
      handleCloseForm();
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (activity: BrokerActivity) => {
    setEditingActivity(activity);
    setFormData({
      broker_id: activity.broker_id,
      activity_type: activity.activity_type,
      client_name: activity.client_name || '',
      property_reference: activity.property_reference || '',
      activity_date: activity.activity_date,
      observations: activity.observations || '',
      status: activity.status,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingActivity(null);
    setFormData({
      broker_id: '',
      activity_type: 'visita',
      client_name: '',
      property_reference: '',
      activity_date: new Date().toISOString().split('T')[0],
      observations: '',
      status: 'pendente',
    });
  };

  const getBrokerName = (brokerId: string) => {
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.name || 'Não encontrado';
  };

  const getActivityTypeLabel = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ACTIVITY_STATUS.find(s => s.value === status);
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
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-3 sm:p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                📋 Atividades dos Corretores
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Registre e acompanhe as atividades realizadas
              </p>
            </div>
            
            {/* Texto explicativo */}
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Como usar:</strong> Aqui o corretor registra todas as atividades do dia 
                (ligações, visitas, ações externas e acompanhamentos). Essas informações ajudam 
                no controle e desempenho da equipe.
              </AlertDescription>
            </Alert>
          </div>

          {/* Filters - Mobile optimized */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atividades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {ACTIVITY_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ClipboardList className="w-5 h-5" />
                Atividades ({filteredActivities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground px-4">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base">Nenhuma atividade encontrada</p>
                  {canCreateActivity && (
                    <p className="text-sm mt-2">
                      Clique no botão "+" para registrar a primeira
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3 p-3">
                    {filteredActivities.map((activity) => (
                      <Card key={activity.id} className="border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="secondary" className="mb-2">
                                {getActivityTypeLabel(activity.activity_type)}
                              </Badge>
                              <p className="font-medium text-foreground">
                                {getBrokerName(activity.broker_id)}
                              </p>
                            </div>
                            {getStatusBadge(activity.status)}
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(activity.activity_date), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            {activity.client_name && (
                              <p><strong>Cliente:</strong> {activity.client_name}</p>
                            )}
                            {activity.property_reference && (
                              <p><strong>Imóvel:</strong> {activity.property_reference}</p>
                            )}
                            {activity.observations && (
                              <p className="text-muted-foreground mt-2 text-base leading-relaxed">
                                {activity.observations}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-10"
                              onClick={() => handleEdit(activity)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 text-destructive hover:text-destructive"
                              onClick={() => deleteActivity(activity.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Corretor</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Imóvel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {format(new Date(activity.activity_date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {getActivityTypeLabel(activity.activity_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {getBrokerName(activity.broker_id)}
                            </TableCell>
                            <TableCell>{activity.client_name || '-'}</TableCell>
                            <TableCell>{activity.property_reference || '-'}</TableCell>
                            <TableCell>{getStatusBadge(activity.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(activity)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteActivity(activity.id)}
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAB Button - Mobile */}
      {canCreateActivity && (
        <Button
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 sm:hidden"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Desktop Button */}
      {canCreateActivity && (
        <div className="fixed top-20 right-6 z-40 hidden sm:block lg:right-8 lg:top-6">
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 shadow-lg">
            <Plus className="w-4 h-4" />
            Nova Atividade
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Corretor selector (hidden for corretores, they can only add their own) */}
            {!isCorretor() && (
              <div>
                <label className="text-sm font-medium">Corretor</label>
                <Select
                  value={formData.broker_id}
                  onValueChange={(value) => setFormData({ ...formData, broker_id: value })}
                >
                  <SelectTrigger className="h-11">
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
              <label className="text-sm font-medium">Tipo de Atividade</label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Cliente (opcional)</label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Nome do cliente"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Imóvel Relacionado (opcional)</label>
              <Input
                value={formData.property_reference}
                onChange={(e) => setFormData({ ...formData, property_reference: e.target.value })}
                placeholder="Referência do imóvel"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={formData.activity_date}
                onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Detalhes da atividade..."
                rows={4}
                className="text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 h-11" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingActivity ? 'Salvar' : 'Criar Atividade'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseForm} className="h-11">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Atividades;