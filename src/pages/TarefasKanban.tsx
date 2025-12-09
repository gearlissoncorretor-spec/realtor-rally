import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBrokers } from "@/hooks/useBrokers";
import { useProcessStages } from "@/hooks/useProcessStages";
import { useBrokerTasks } from "@/hooks/useBrokerTasks";
import BrokerKanbanBoard from "@/components/kanban/BrokerKanbanBoard";
import ColumnSettingsDialog from "@/components/kanban/ColumnSettingsDialog";
import { Loader2 } from "lucide-react";

const TarefasKanban = () => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { stages, loading: stagesLoading, createStage, updateStage, deleteStage } = useProcessStages();
  const { 
    tasks, 
    loading: tasksLoading, 
    createTask, 
    updateTask, 
    deleteTask, 
    moveTask,
    addComment,
    fetchComments,
    fetchHistory 
  } = useBrokerTasks();

  const [selectedBrokerId, setSelectedBrokerId] = useState<string | undefined>();

  const canConfigureColumns = userRole === "admin" || userRole === "diretor" || userRole === "gerente";
  const isLoading = brokersLoading || stagesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Navigation />
        <div className="lg:ml-64 pt-16 lg:pt-0 p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6 flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Tarefas dos Corretores
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Acompanhe e gerencie as tarefas de cada corretor
            </p>
          </div>
          
          {canConfigureColumns && (
            <ColumnSettingsDialog
              stages={stages}
              onCreateStage={createStage}
              onUpdateStage={updateStage}
              onDeleteStage={deleteStage}
            />
          )}
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <BrokerKanbanBoard
            stages={stages}
            tasks={tasks}
            brokers={brokers}
            onMoveTask={moveTask}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAddComment={addComment}
            fetchComments={fetchComments}
            fetchHistory={fetchHistory}
            currentUserRole={userRole || undefined}
            selectedBrokerId={selectedBrokerId}
            onBrokerChange={setSelectedBrokerId}
          />
        </div>
      </div>
    </div>
  );
};

export default TarefasKanban;
