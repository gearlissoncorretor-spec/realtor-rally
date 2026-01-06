import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Filter
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
                Atividades dos Corretores
              </h1>
              <p className="text-muted-foreground mt-1">
                Registre e acompanhe as atividades realizadas
              </p>
            </div>
            
            {canCreateActivity && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Atividade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
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
                      <label className="text-sm font-medium">Tipo de Atividade</label>
                      <Select
                        value={formData.activity_type}
                        onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                      >
                        <SelectTrigger>
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
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Imóvel Relacionado (opcional)</label>
                      <Input
                        value={formData.property_reference}
                        onChange={(e) => setFormData({ ...formData, property_reference: e.target.value })}
                        placeholder="Referência do imóvel"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Data</label>
                      <Input
                        type="date"
                        value={formData.activity_date}
                        onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <Textarea
                        value={formData.observations}
                        onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                        placeholder="Detalhes da atividade..."
                        rows={3}
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
                          {ACTIVITY_STATUS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingActivity ? 'Salvar' : 'Criar Atividade'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCloseForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atividades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-40">
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
                  <SelectTrigger className="w-full sm:w-40">
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
            </CardContent>
          </Card>

          {/* Activities Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Atividades ({filteredActivities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade encontrada</p>
                  {canCreateActivity && (
                    <p className="text-sm mt-2">
                      Clique em "Nova Atividade" para registrar a primeira
                    </p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Atividades;
