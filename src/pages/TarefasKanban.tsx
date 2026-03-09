import React, { useState, useMemo, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBrokers } from "@/hooks/useBrokers";
import { useProcessStages } from "@/hooks/useProcessStages";
import { useBrokerTasks } from "@/hooks/useBrokerTasks";
import { useWeeklyActivities } from "@/hooks/useWeeklyActivities";
import BrokerKanbanBoard from "@/components/kanban/BrokerKanbanBoard";
import ColumnSettingsDialog from "@/components/kanban/ColumnSettingsDialog";
import { TarefasKanbanSkeleton } from "@/components/skeletons/TarefasKanbanSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Columns3, ClipboardList } from "lucide-react";
import WeeklyActivitiesView from "@/components/activities/WeeklyActivitiesView";

const TarefasKanban = () => {
  const { getUserRole, user, profile, isCorretor, isGerente, isDiretor, isAdmin } = useAuth();
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
  const [activeTab, setActiveTab] = useState("kanban");

  const canConfigureColumns = userRole === "admin" || userRole === "diretor" || userRole === "gerente";
  const isLoading = brokersLoading || stagesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 flex-1 overflow-hidden">
          <TarefasKanbanSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="w-full text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Gestão de Tarefas
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kanban e atividades dos corretores em um só lugar
            </p>
          </div>
          
          {canConfigureColumns && activeTab === "kanban" && (
            <ColumnSettingsDialog
              stages={stages}
              onCreateStage={createStage}
              onUpdateStage={updateStage}
              onDeleteStage={deleteStage}
            />
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full sm:w-auto self-start mb-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-border shadow-sm">
            <TabsTrigger value="kanban" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Columns3 className="w-4 h-4" />
              Quadro Kanban
            </TabsTrigger>
            <TabsTrigger value="atividades" className="gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4" />
              Atividades Semanais
            </TabsTrigger>
          </Tabs>

          <TabsContent value="kanban" className="flex-1 overflow-hidden mt-0">
            <div className="h-full">
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
          </TabsContent>

          <TabsContent value="atividades" className="flex-1 overflow-auto mt-0">
            <WeeklyActivitiesView brokers={brokers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TarefasKanban;
