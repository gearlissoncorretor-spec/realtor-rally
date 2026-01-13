import React, { useState, useMemo, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2,
  Phone, 
  MapPin, 
  Users, 
  ClipboardList,
  Building2,
  Loader2,
  Check,
  X,
  PlusCircle,
  Pencil,
  MinusCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ListTodo
} from "lucide-react";
import { useBrokers } from "@/hooks/useBrokers";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyActivities } from "@/hooks/useWeeklyActivities";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Generate week options (current week + 8 past weeks)
const getWeekOptions = () => {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 9; i++) {
    const weekDate = subWeeks(today, i);
    const weekStartDate = startOfWeek(weekDate, { weekStartsOn: 1 });
    const weekEndDate = endOfWeek(weekDate, { weekStartsOn: 1 });
    const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
    const label = `${format(weekStartDate, "dd/MM", { locale: ptBR })} - ${format(weekEndDate, "dd/MM/yyyy", { locale: ptBR })}`;
    options.push({ value: weekStartStr, label, isCurrent: i === 0 });
  }
  return options;
};

const Atividades = () => {
  const { user, profile, isCorretor, isGerente, isDiretor, isAdmin } = useAuth();
  const { brokers, loading: brokersLoading } = useBrokers();
  
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const now = new Date();
    return format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: 'task_name' | 'meta_semanal' | 'realizado' } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const weekOptions = useMemo(() => getWeekOptions(), []);

  const { 
    activities, 
    loading: activitiesLoading,
    createActivity,
    createDefaultTasks,
    updateActivity,
    incrementRealizado,
    deleteActivity,
    currentWeekStart
  } = useWeeklyActivities(selectedBrokerId, selectedWeek);

  // Get current user's broker record (if they are a broker)
  const currentBroker = brokers.find(b => b.user_id === user?.id);
  
  // Get the user's team_id - either from profile (for managers) or from broker record
  const userTeamId = profile?.team_id || currentBroker?.team_id;
  
  // Filter brokers based on role
  const accessibleBrokers = useMemo(() => {
    if (isDiretor() || isAdmin()) {
      return brokers;
    }
    if (isGerente() && userTeamId) {
      return brokers.filter(b => b.team_id === userTeamId);
    }
    if (isCorretor() && currentBroker) {
      return [currentBroker];
    }
    return [];
  }, [brokers, currentBroker, userTeamId, isCorretor, isGerente, isDiretor, isAdmin]);

  // Initialize selected broker
  useEffect(() => {
    if (accessibleBrokers.length > 0 && !selectedBrokerId) {
      setSelectedBrokerId(accessibleBrokers[0].id);
    }
  }, [accessibleBrokers, selectedBrokerId]);

  // Initialize default tasks if broker has none for this week
  useEffect(() => {
    if (selectedBrokerId && !activitiesLoading && activities.length === 0) {
      createDefaultTasks(selectedBrokerId).catch(console.error);
    }
  }, [selectedBrokerId, activitiesLoading, activities.length, createDefaultTasks]);

  // Format week range for display
  const weekRange = useMemo(() => {
    const start = parseISO(selectedWeek);
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`;
  }, [selectedWeek]);

  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    const currentDate = parseISO(selectedWeek);
    const prevWeek = subWeeks(currentDate, 1);
    setSelectedWeek(format(prevWeek, 'yyyy-MM-dd'));
  };

  const goToNextWeek = () => {
    const currentDate = parseISO(selectedWeek);
    const nextWeek = addWeeks(currentDate, 1);
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    // Don't allow going beyond current week
    if (nextWeek <= currentWeekStart) {
      setSelectedWeek(format(nextWeek, 'yyyy-MM-dd'));
    }
  };

  const isCurrentWeek = selectedWeek === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Get current broker's tasks
  const currentTasks = activities;

  // Get unique categories from tasks for dynamic summary cards
  const taskSummaries = useMemo(() => {
    // Group tasks by category and calculate totals
    const summaryMap = new Map<string, { name: string; realizado: number; meta: number; icon: string }>();
    
    currentTasks.forEach(task => {
      const key = task.category || 'outro';
      const existing = summaryMap.get(key);
      if (existing) {
        existing.realizado += task.realizado;
        existing.meta += task.meta_semanal;
      } else {
        summaryMap.set(key, {
          name: task.task_name,
          realizado: task.realizado,
          meta: task.meta_semanal,
          icon: key
        });
      }
    });
    
    return Array.from(summaryMap.values());
  }, [currentTasks]);

  const handleAddTask = async () => {
    if (!selectedBrokerId) return;
    
    try {
      await createActivity({
        broker_id: selectedBrokerId,
        task_name: 'Nova Tarefa',
        category: 'outro',
        meta_semanal: 10,
        realizado: 0,
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    
    try {
      await deleteActivity(deleteTaskId);
      setDeleteTaskId(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleIncrement = async (taskId: string, currentValue: number) => {
    try {
      await incrementRealizado({ id: taskId, currentValue });
    } catch (error) {
      console.error('Error incrementing:', error);
    }
  };

  const handleDecrement = async (taskId: string, currentValue: number) => {
    if (currentValue <= 0) return;
    try {
      await updateActivity({ id: taskId, realizado: currentValue - 1 });
    } catch (error) {
      console.error('Error decrementing:', error);
    }
  };

  const startEditing = (taskId: string, field: 'task_name' | 'meta_semanal' | 'realizado', currentValue: string | number) => {
    setEditingCell({ taskId, field });
    setEditValue(String(currentValue));
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    const { taskId, field } = editingCell;
    
    try {
      if (field === 'task_name') {
        await updateActivity({ id: taskId, task_name: editValue });
      } else {
        const numValue = Math.max(0, parseInt(editValue) || 0);
        await updateActivity({ id: taskId, [field]: numValue });
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }
    
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

  const selectedBroker = accessibleBrokers.find(b => b.id === selectedBrokerId);

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
          {/* Header with Week Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                Gestão de Atividades Semanais
              </h1>
            </div>
            
            {/* Week Selector */}
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 rounded-xl p-2 shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousWeek}
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-[200px]">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="border-0 bg-transparent focus:ring-0 font-semibold text-emerald-600 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} {option.isCurrent && "(Atual)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextWeek}
                disabled={isCurrentWeek}
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
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
                  {/* Dynamic Summary Cards - One per task */}
                  {currentTasks.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {currentTasks.map((task) => {
                        const progress = getProgress(task.meta_semanal, task.realizado);
                        const progressColor = progress >= 100 ? 'text-emerald-600' : progress >= 50 ? 'text-yellow-600' : 'text-red-500';
                        
                        // Get icon based on category
                        const getIcon = (category: string | null) => {
                          switch (category) {
                            case 'captacao': return <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />;
                            case 'atendimento': return <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />;
                            case 'ligacao': return <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />;
                            case 'visita': return <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />;
                            default: return <ListTodo className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />;
                          }
                        };
                        
                        return (
                          <Card 
                            key={task.id} 
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl shrink-0">
                                  {getIcon(task.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate" title={task.task_name}>
                                    {task.task_name}
                                  </p>
                                  <div className="flex items-baseline gap-1">
                                    <p className={`text-lg sm:text-xl font-bold ${progressColor}`}>
                                      {task.realizado}
                                    </p>
                                    <span className="text-xs text-muted-foreground">/ {task.meta_semanal}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                      style={{ width: `${Math.min(100, progress)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

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
                        Nova Tarefa
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                      {activitiesLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                      ) : (
                        <>
                          {/* Mobile Card View */}
                          <div className="block sm:hidden space-y-3 p-3">
                            {currentTasks.map((task) => {
                              const progress = getProgress(task.meta_semanal, task.realizado);
                              const progressColor = getProgressColor(progress);
                              
                              return (
                                <Card key={task.id} className="border border-emerald-200/50 dark:border-emerald-800/50">
                                  <CardContent className="p-4 space-y-4">
                                    {/* Task Name - Editable */}
                                    <div className="flex items-start justify-between gap-2">
                                      {editingCell?.taskId === task.id && editingCell?.field === 'task_name' ? (
                                        <div className="flex items-center gap-2 flex-1">
                                          <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="h-9 text-base font-medium border-emerald-300 focus:ring-emerald-500"
                                            autoFocus
                                          />
                                          <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8 text-emerald-600 shrink-0">
                                            <Check className="w-4 h-4" />
                                          </Button>
                                          <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8 text-red-500 shrink-0">
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 flex-1">
                                          <p className="font-semibold text-foreground text-base">
                                            {task.task_name}
                                          </p>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => startEditing(task.id, 'task_name', task.task_name)}
                                            className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setDeleteTaskId(task.id)}
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 shrink-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    
                                    {/* Meta and Realizado */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Meta Semanal</p>
                                        {editingCell?.taskId === task.id && editingCell?.field === 'meta_semanal' ? (
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
                                          <div className="flex items-center gap-1">
                                            <p className="text-lg font-bold text-emerald-600">
                                              {task.meta_semanal}
                                            </p>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => startEditing(task.id, 'meta_semanal', task.meta_semanal)}
                                              className="h-6 w-6 text-muted-foreground hover:text-emerald-600"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Realizado</p>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => handleDecrement(task.id, task.realizado)}
                                            disabled={task.realizado <= 0}
                                            className="h-8 w-8 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                          >
                                            <MinusCircle className="w-4 h-4" />
                                          </Button>
                                          <span className="text-lg font-bold text-foreground min-w-[2rem] text-center">
                                            {task.realizado}
                                          </span>
                                          <Button
                                            size="icon"
                                            variant="default"
                                            onClick={() => handleIncrement(task.id, task.realizado)}
                                            className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                                          >
                                            <PlusCircle className="w-4 h-4" />
                                          </Button>
                                        </div>
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
                                  <TableHead className="font-semibold text-foreground text-center w-36">Meta Semanal</TableHead>
                                  <TableHead className="font-semibold text-foreground text-center w-48">Realizado</TableHead>
                                  <TableHead className="font-semibold text-foreground w-64">Progresso</TableHead>
                                  <TableHead className="w-16"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentTasks.map((task) => {
                                  const progress = getProgress(task.meta_semanal, task.realizado);
                                  const progressColor = getProgressColor(progress);
                                  
                                  return (
                                    <TableRow key={task.id} className="border-emerald-200/30 dark:border-emerald-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                                      {/* Task Name */}
                                      <TableCell className="font-medium">
                                        {editingCell?.taskId === task.id && editingCell?.field === 'task_name' ? (
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
                                          <div className="flex items-center gap-2">
                                            <span>{task.task_name}</span>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => startEditing(task.id, 'task_name', task.task_name)}
                                              className="h-7 w-7 text-muted-foreground hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                      </TableCell>
                                      
                                      {/* Meta */}
                                      <TableCell className="text-center">
                                        {editingCell?.taskId === task.id && editingCell?.field === 'meta_semanal' ? (
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
                                          <div className="flex items-center justify-center gap-1">
                                            <span className="font-semibold text-emerald-600">
                                              {task.meta_semanal}
                                            </span>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => startEditing(task.id, 'meta_semanal', task.meta_semanal)}
                                              className="h-6 w-6 text-muted-foreground hover:text-emerald-600"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </TableCell>
                                      
                                      {/* Realizado with +/- buttons */}
                                      <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => handleDecrement(task.id, task.realizado)}
                                            disabled={task.realizado <= 0}
                                            className="h-8 w-8 border-emerald-300 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                          >
                                            <MinusCircle className="w-4 h-4" />
                                          </Button>
                                          
                                          {editingCell?.taskId === task.id && editingCell?.field === 'realizado' ? (
                                            <div className="flex items-center gap-1">
                                              <Input
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                className="h-9 w-16 text-center border-emerald-300"
                                                autoFocus
                                              />
                                              <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-emerald-600">
                                                <Check className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span 
                                              className="font-bold text-lg min-w-[3rem] text-center cursor-pointer hover:text-emerald-600 transition-colors"
                                              onClick={() => startEditing(task.id, 'realizado', task.realizado)}
                                            >
                                              {task.realizado}
                                            </span>
                                          )}
                                          
                                          <Button
                                            size="icon"
                                            variant="default"
                                            onClick={() => handleIncrement(task.id, task.realizado)}
                                            className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                                          >
                                            <PlusCircle className="w-4 h-4" />
                                          </Button>
                                        </div>
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
                                          onClick={() => setDeleteTaskId(task.id)}
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

                          {currentTasks.length === 0 && !activitiesLoading && (
                            <div className="text-center py-12 text-muted-foreground px-4">
                              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50 text-emerald-400" />
                              <p className="text-base">Nenhuma tarefa cadastrada</p>
                              <p className="text-sm mt-2">
                                Clique em "Nova Tarefa" para começar
                              </p>
                            </div>
                          )}
                        </>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Atividades;
