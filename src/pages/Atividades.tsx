import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trash2,
  Phone, 
  MapPin, 
  Users, 
  ClipboardList,
  Building2,
  Loader2,
  Save,
  Check,
  X
} from "lucide-react";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Weekly activity task structure
interface WeeklyTask {
  id: string;
  name: string;
  meta: number;
  realizado: number;
  category: 'captacao' | 'atendimento' | 'ligacao' | 'visita' | 'outro';
}

// State for each broker's activities
interface BrokerWeeklyData {
  brokerId: string;
  tasks: WeeklyTask[];
}

// Default task templates
const DEFAULT_TASKS: Omit<WeeklyTask, 'id'>[] = [
  { name: 'Captação de Imóveis', meta: 10, realizado: 0, category: 'captacao' },
  { name: 'Atendimento ao Cliente', meta: 20, realizado: 0, category: 'atendimento' },
  { name: 'Ligações Realizadas', meta: 30, realizado: 0, category: 'ligacao' },
  { name: 'Visitas Agendadas', meta: 15, realizado: 0, category: 'visita' },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const Atividades = () => {
  const { user, isCorretor, isGerente, isDiretor, isAdmin } = useAuth();
  const { brokers, loading: brokersLoading } = useBrokers();
  
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [brokerData, setBrokerData] = useState<Record<string, WeeklyTask[]>>({});
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: 'name' | 'meta' | 'realizado' } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingTasks, setSavingTasks] = useState<Record<string, boolean>>({});

  // Get current user's broker ID
  const currentBroker = brokers.find(b => b.user_id === user?.id);
  
  // Filter brokers based on role
  const accessibleBrokers = useMemo(() => {
    if (isDiretor() || isAdmin()) {
      return brokers;
    }
    if (isGerente()) {
      // Managers see their team brokers
      return brokers.filter(b => b.team_id === currentBroker?.team_id);
    }
    if (isCorretor() && currentBroker) {
      // Corretores only see themselves
      return [currentBroker];
    }
    return [];
  }, [brokers, currentBroker, isCorretor, isGerente, isDiretor, isAdmin]);

  // Initialize selected broker
  React.useEffect(() => {
    if (accessibleBrokers.length > 0 && !selectedBrokerId) {
      setSelectedBrokerId(accessibleBrokers[0].id);
    }
  }, [accessibleBrokers, selectedBrokerId]);

  // Initialize broker data with default tasks
  React.useEffect(() => {
    accessibleBrokers.forEach(broker => {
      if (!brokerData[broker.id]) {
        setBrokerData(prev => ({
          ...prev,
          [broker.id]: DEFAULT_TASKS.map(t => ({ ...t, id: generateId() }))
        }));
      }
    });
  }, [accessibleBrokers, brokerData]);

  // Get current broker's tasks
  const currentTasks = brokerData[selectedBrokerId] || [];

  // Calculate summary for current broker
  const summary = useMemo(() => {
    const captacoes = currentTasks
      .filter(t => t.category === 'captacao')
      .reduce((sum, t) => sum + t.realizado, 0);
    const atendimentos = currentTasks
      .filter(t => t.category === 'atendimento')
      .reduce((sum, t) => sum + t.realizado, 0);
    const ligacoes = currentTasks
      .filter(t => t.category === 'ligacao')
      .reduce((sum, t) => sum + t.realizado, 0);
    const visitas = currentTasks
      .filter(t => t.category === 'visita')
      .reduce((sum, t) => sum + t.realizado, 0);
    
    return { captacoes, atendimentos, ligacoes, visitas };
  }, [currentTasks]);

  const handleAddTask = () => {
    const newTask: WeeklyTask = {
      id: generateId(),
      name: 'Nova Tarefa',
      meta: 10,
      realizado: 0,
      category: 'outro'
    };
    setBrokerData(prev => ({
      ...prev,
      [selectedBrokerId]: [...(prev[selectedBrokerId] || []), newTask]
    }));
    toast.success("Nova tarefa adicionada!");
  };

  const handleDeleteTask = (taskId: string) => {
    setBrokerData(prev => ({
      ...prev,
      [selectedBrokerId]: prev[selectedBrokerId]?.filter(t => t.id !== taskId) || []
    }));
    toast.success("Tarefa removida!");
  };

  const startEditing = (taskId: string, field: 'name' | 'meta' | 'realizado', currentValue: string | number) => {
    setEditingCell({ taskId, field });
    setEditValue(String(currentValue));
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const { taskId, field } = editingCell;
    setSavingTasks(prev => ({ ...prev, [taskId]: true }));
    
    setBrokerData(prev => ({
      ...prev,
      [selectedBrokerId]: prev[selectedBrokerId]?.map(task => {
        if (task.id === taskId) {
          if (field === 'name') {
            return { ...task, name: editValue };
          } else {
            const numValue = Math.max(0, parseInt(editValue) || 0);
            return { ...task, [field]: numValue };
          }
        }
        return task;
      }) || []
    }));
    
    setTimeout(() => {
      setSavingTasks(prev => ({ ...prev, [taskId]: false }));
      toast.success("Alteração salva!");
    }, 300);
    
    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const getProgress = (meta: number, realizado: number) => {
    if (meta === 0) return 0;
    return Math.min(100, Math.round((realizado / meta) * 100));
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-emerald-500";
    if (progress >= 75) return "bg-emerald-400";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-400";
  };

  if (brokersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-3 sm:p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                Gestão de Atividades Semanais
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Acompanhe as metas e realizações semanais de cada corretor
              </p>
            </div>
          </div>

          {/* Broker Tabs */}
          {accessibleBrokers.length > 0 ? (
            <Tabs value={selectedBrokerId} onValueChange={setSelectedBrokerId} className="w-full">
              <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex h-12 sm:h-14 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 shadow-lg rounded-xl p-1.5 gap-1 min-w-max">
                  {accessibleBrokers.map((broker) => (
                    <TabsTrigger
                      key={broker.id}
                      value={broker.id}
                      className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-emerald-100 dark:data-[state=inactive]:hover:bg-emerald-900/30 whitespace-nowrap"
                    >
                      {broker.name.split(' ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {accessibleBrokers.map((broker) => (
                <TabsContent key={broker.id} value={broker.id} className="mt-4 space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Captações</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.captacoes}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Atendimentos</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.atendimentos}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Ligações</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.ligacoes}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Visitas</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.visitas}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weekly Tasks Table */}
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                    <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-emerald-600" />
                        Atividades de {broker.name}
                      </CardTitle>
                      <Button 
                        onClick={handleAddTask}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Nova Tarefa
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                      {/* Mobile Card View */}
                      <div className="block sm:hidden space-y-3 p-3">
                        {currentTasks.map((task) => {
                          const progress = getProgress(task.meta, task.realizado);
                          const progressColor = getProgressColor(progress);
                          
                          return (
                            <Card key={task.id} className="border border-emerald-200/50 dark:border-emerald-800/50">
                              <CardContent className="p-4 space-y-4">
                                {/* Task Name - Editable */}
                                <div className="flex items-start justify-between">
                                  {editingCell?.taskId === task.id && editingCell?.field === 'name' ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="h-9 text-base font-medium border-emerald-300 focus:ring-emerald-500"
                                        autoFocus
                                      />
                                      <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8 text-emerald-600">
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8 text-red-500">
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <p 
                                      className="font-semibold text-foreground text-base cursor-pointer hover:text-emerald-600 transition-colors"
                                      onClick={() => startEditing(task.id, 'name', task.name)}
                                    >
                                      {task.name}
                                    </p>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                {/* Meta and Realizado */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Meta Semanal</p>
                                    {editingCell?.taskId === task.id && editingCell?.field === 'meta' ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyDown={handleKeyDown}
                                          className="h-9 w-20 text-center border-emerald-300"
                                          autoFocus
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-emerald-600">
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <p 
                                        className="text-lg font-bold text-emerald-600 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-2 py-1 rounded transition-colors inline-block"
                                        onClick={() => startEditing(task.id, 'meta', task.meta)}
                                      >
                                        {task.meta}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Realizado</p>
                                    {editingCell?.taskId === task.id && editingCell?.field === 'realizado' ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyDown={handleKeyDown}
                                          className="h-9 w-20 text-center border-emerald-300"
                                          autoFocus
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-emerald-600">
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <p 
                                        className="text-lg font-bold text-foreground cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-2 py-1 rounded transition-colors inline-block"
                                        onClick={() => startEditing(task.id, 'realizado', task.realizado)}
                                      >
                                        {task.realizado}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-muted-foreground">Progresso</span>
                                    <span className={`text-sm font-bold ${progress >= 100 ? 'text-emerald-600' : 'text-foreground'}`}>
                                      {progress}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                      style={{ width: `${Math.min(100, progress)}%` }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-emerald-200/50 dark:border-emerald-800/50">
                              <TableHead className="font-semibold text-foreground">Tarefa</TableHead>
                              <TableHead className="font-semibold text-foreground text-center w-32">Meta Semanal</TableHead>
                              <TableHead className="font-semibold text-foreground text-center w-32">Realizado</TableHead>
                              <TableHead className="font-semibold text-foreground w-64">Progresso</TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentTasks.map((task) => {
                              const progress = getProgress(task.meta, task.realizado);
                              const progressColor = getProgressColor(progress);
                              
                              return (
                                <TableRow key={task.id} className="border-emerald-200/30 dark:border-emerald-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                                  {/* Task Name */}
                                  <TableCell className="font-medium">
                                    {editingCell?.taskId === task.id && editingCell?.field === 'name' ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyDown={handleKeyDown}
                                          className="h-9 border-emerald-300 focus:ring-emerald-500"
                                          autoFocus
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8 text-emerald-600">
                                          <Check className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8 text-red-500">
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span 
                                        className="cursor-pointer hover:text-emerald-600 transition-colors py-1 px-2 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                        onClick={() => startEditing(task.id, 'name', task.name)}
                                      >
                                        {task.name}
                                      </span>
                                    )}
                                  </TableCell>
                                  
                                  {/* Meta */}
                                  <TableCell className="text-center">
                                    {editingCell?.taskId === task.id && editingCell?.field === 'meta' ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyDown={handleKeyDown}
                                          className="h-9 w-20 text-center border-emerald-300"
                                          autoFocus
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-emerald-600">
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span 
                                        className="cursor-pointer font-semibold text-emerald-600 py-1 px-3 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                        onClick={() => startEditing(task.id, 'meta', task.meta)}
                                      >
                                        {task.meta}
                                      </span>
                                    )}
                                  </TableCell>
                                  
                                  {/* Realizado */}
                                  <TableCell className="text-center">
                                    {editingCell?.taskId === task.id && editingCell?.field === 'realizado' ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyDown={handleKeyDown}
                                          className="h-9 w-20 text-center border-emerald-300"
                                          autoFocus
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-emerald-600">
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span 
                                        className="cursor-pointer font-semibold py-1 px-3 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                        onClick={() => startEditing(task.id, 'realizado', task.realizado)}
                                      >
                                        {task.realizado}
                                      </span>
                                    )}
                                  </TableCell>
                                  
                                  {/* Progress */}
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                          style={{ width: `${Math.min(100, progress)}%` }}
                                        />
                                      </div>
                                      <span className={`text-sm font-bold min-w-[45px] text-right ${progress >= 100 ? 'text-emerald-600' : 'text-foreground'}`}>
                                        {progress}%
                                      </span>
                                    </div>
                                  </TableCell>
                                  
                                  {/* Actions */}
                                  <TableCell>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {currentTasks.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground px-4">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50 text-emerald-400" />
                          <p className="text-base">Nenhuma tarefa cadastrada</p>
                          <p className="text-sm mt-2">
                            Clique em "Adicionar Nova Tarefa" para começar
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 shadow-lg">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-emerald-400 opacity-50" />
                <p className="text-muted-foreground">Nenhum corretor disponível</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Atividades;
