import React, { useState, useMemo } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Users, User, LayoutGrid, Calendar } from "lucide-react";
import { ProcessStage } from "@/hooks/useProcessStages";
import { BrokerTask, CreateTaskData } from "@/hooks/useBrokerTasks";
import KanbanColumn from "./KanbanColumn";
import CreateTaskDialog from "./CreateTaskDialog";
import TaskDetailsDialog from "./TaskDetailsDialog";
import { cn } from "@/lib/utils";

interface Broker {
  id: string;
  name: string;
  avatar_url?: string | null;
  team_id?: string | null;
}

interface BrokerKanbanBoardProps {
  stages: ProcessStage[];
  tasks: BrokerTask[];
  brokers: Broker[];
  onMoveTask: (taskId: string, newColumnId: string) => Promise<void>;
  onCreateTask: (data: CreateTaskData) => Promise<any>;
  onUpdateTask: (taskId: string, updates: Partial<BrokerTask>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<any>;
  fetchComments: (taskId: string) => Promise<any[]>;
  fetchHistory: (taskId: string) => Promise<any[]>;
  currentUserRole?: string;
  selectedBrokerId?: string;
  onBrokerChange?: (brokerId: string | undefined) => void;
}

const BrokerKanbanBoard: React.FC<BrokerKanbanBoardProps> = ({
  stages,
  tasks,
  brokers,
  onMoveTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  fetchComments,
  fetchHistory,
  currentUserRole,
  selectedBrokerId,
  onBrokerChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "broker">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BrokerTask | null>(null);
  const [preselectedColumnId, setPreselectedColumnId] = useState<string | undefined>();

  const canManage = currentUserRole === "admin" || currentUserRole === "diretor" || currentUserRole === "gerente";

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.broker?.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

      const matchesBroker = !selectedBrokerId || task.broker_id === selectedBrokerId;

      return matchesSearch && matchesPriority && matchesBroker;
    });
  }, [tasks, searchQuery, priorityFilter, selectedBrokerId]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, BrokerTask[]> = {};
    stages.forEach((stage) => {
      grouped[stage.id] = filteredTasks.filter((task) => task.column_id === stage.id);
    });
    return grouped;
  }, [filteredTasks, stages]);

  // Group tasks by broker then column
  const tasksByBroker = useMemo(() => {
    const grouped: Record<string, Record<string, BrokerTask[]>> = {};
    brokers.forEach((broker) => {
      grouped[broker.id] = {};
      stages.forEach((stage) => {
        grouped[broker.id][stage.id] = filteredTasks.filter(
          (task) => task.broker_id === broker.id && task.column_id === stage.id
        );
      });
    });
    return grouped;
  }, [filteredTasks, brokers, stages]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newColumnId = destination.droppableId;
    await onMoveTask(draggableId, newColumnId);
  };

  const handleAddTaskToColumn = (columnId: string) => {
    setPreselectedColumnId(columnId);
    setCreateDialogOpen(true);
  };

  const handleTaskClick = (task: BrokerTask) => {
    setSelectedTask(task);
  };

  // Count tasks by priority
  const priorityCounts = useMemo(() => {
    return {
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    };
  }, [tasks]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Broker filter */}
          {canManage && brokers.length > 1 && (
            <Select
              value={selectedBrokerId || "all"}
              onValueChange={(v) => onBrokerChange?.(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[180px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os corretores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os corretores</SelectItem>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={broker.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">{broker.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {broker.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Priority filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  Alta ({priorityCounts.high})
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  Média ({priorityCounts.medium})
                </span>
              </SelectItem>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  Baixa ({priorityCounts.low})
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Add task button */}
          {canManage && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* View mode toggle */}
      {canManage && brokers.length > 1 && (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="broker" className="gap-2">
              <User className="h-4 w-4" />
              Por Corretor
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-hidden">
          {viewMode === "all" || brokers.length <= 1 ? (
            // Standard Kanban view
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 h-full scrollbar-styled">
              {stages.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  tasks={tasksByColumn[stage.id] || []}
                  onTaskClick={handleTaskClick}
                  onAddTask={canManage ? () => handleAddTaskToColumn(stage.id) : undefined}
                  canAddTask={canManage}
                />
              ))}
            </div>
          ) : (
            // By broker view
            <div className="space-y-6 overflow-y-auto h-full pr-2 scrollbar-styled">
              {brokers.map((broker) => {
                const brokerTasks = tasksByBroker[broker.id] || {};
                const totalTasks = Object.values(brokerTasks).flat().length;

                return (
                  <Card key={broker.id} className="overflow-hidden">
                    <CardHeader className="py-3 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={broker.avatar_url || undefined} />
                            <AvatarFallback>{broker.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{broker.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{totalTasks} tarefas</p>
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onBrokerChange?.(broker.id);
                              setCreateDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tarefa
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-styled">
                        {stages.map((stage) => (
                          <div key={stage.id} className="min-w-[200px] flex-shrink-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="text-xs font-medium">{stage.title}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {brokerTasks[stage.id]?.length || 0}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {(brokerTasks[stage.id] || []).slice(0, 3).map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() => handleTaskClick(task)}
                                  className={cn(
                                    "p-2 bg-muted/50 rounded text-xs cursor-pointer hover:bg-muted transition-colors",
                                    task.priority === "high" && "border-l-2 border-l-red-500",
                                    task.priority === "medium" && "border-l-2 border-l-amber-500"
                                  )}
                                >
                                  <p className="font-medium truncate">{task.title}</p>
                                  {task.due_date && (
                                    <p className="text-muted-foreground mt-1 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(task.due_date).toLocaleDateString("pt-BR")}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {(brokerTasks[stage.id]?.length || 0) > 3 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-xs h-7"
                                  onClick={() => {
                                    onBrokerChange?.(broker.id);
                                    setViewMode("all");
                                  }}
                                >
                                  +{brokerTasks[stage.id].length - 3} mais
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={onCreateTask}
        stages={stages}
        brokers={brokers}
        preselectedBrokerId={selectedBrokerId}
        preselectedColumnId={preselectedColumnId}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        task={selectedTask}
        stages={stages}
        onUpdate={onUpdateTask}
        onDelete={onDeleteTask}
        onAddComment={onAddComment}
        fetchComments={fetchComments}
        fetchHistory={fetchHistory}
        canEdit={canManage || selectedTask?.broker?.id === selectedBrokerId}
        canDelete={canManage}
      />
    </div>
  );
};

export default BrokerKanbanBoard;
