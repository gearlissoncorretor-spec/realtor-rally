import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";
import { ProcessStage } from "@/hooks/useProcessStages";
import { BrokerTask } from "@/hooks/useBrokerTasks";
import TaskCard from "./TaskCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  stage: ProcessStage;
  tasks: BrokerTask[];
  onTaskClick: (task: BrokerTask) => void;
  onAddTask?: () => void;
  targetCount?: number;
  canAddTask?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  tasks,
  onTaskClick,
  onAddTask,
  targetCount = 0,
  canAddTask = true,
}) => {
  const completedCount = tasks.length;
  const progress = targetCount > 0 ? Math.min((completedCount / targetCount) * 100, 100) : 0;

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0 h-full">
      {/* Column Header */}
      <Card className="mb-3 border-t-4" style={{ borderTopColor: stage.color }}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <CardTitle className="text-sm font-semibold">{stage.title}</CardTitle>
            </div>
            {canAddTask && onAddTask && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onAddTask}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Task count badge */}
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" className="text-xs">
              {completedCount} {completedCount === 1 ? 'tarefa' : 'tarefas'}
            </Badge>
            
            {/* Weekly target progress */}
            {targetCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Meta: {completedCount}/{targetCount}
              </span>
            )}
          </div>

          {/* Progress bar for targets */}
          {targetCount > 0 && (
            <div className="mt-2">
              <Progress 
                value={progress} 
                className={cn(
                  "h-1.5",
                  progress >= 100 && "bg-green-100 dark:bg-green-900/30",
                )}
              />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Droppable area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "flex-1 space-y-2 p-2 rounded-lg border-2 border-dashed transition-all duration-200 overflow-y-auto scrollbar-styled",
              snapshot.isDraggingOver
                ? "border-primary bg-primary/5 shadow-inner"
                : "border-transparent hover:border-muted-foreground/20"
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick(task)}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Empty state */}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Nenhuma tarefa
                </p>
                {canAddTask && onAddTask && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={onAddTask}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
