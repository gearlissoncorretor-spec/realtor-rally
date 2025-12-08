import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Paperclip,
  GripVertical 
} from "lucide-react";
import { format, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BrokerTask } from "@/hooks/useBrokerTasks";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: BrokerTask;
  onClick?: () => void;
  isDragging?: boolean;
  commentsCount?: number;
  attachmentsCount?: number;
}

const priorityConfig = {
  low: { label: "Baixa", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  medium: { label: "Média", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  high: { label: "Alta", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  isDragging,
  commentsCount = 0,
  attachmentsCount = 0,
}) => {
  const isOverdue = task.due_date && !task.completed_at && 
    isBefore(parseISO(task.due_date), new Date()) && !isToday(parseISO(task.due_date));
  
  const isDueToday = task.due_date && !task.completed_at && isToday(parseISO(task.due_date));
  
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-200 group hover:shadow-md border-l-4",
        isDragging && "shadow-lg ring-2 ring-primary/20 rotate-2",
        isOverdue && "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
        isDueToday && !isOverdue && "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
        !isOverdue && !isDueToday && "border-l-transparent hover:border-l-primary/50"
      )}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header with priority and grip */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="font-medium text-sm text-foreground truncate">{task.title}</h4>
          </div>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priority.className)}>
            {priority.label}
          </Badge>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Property reference */}
        {task.property_reference && (
          <p className="text-xs text-muted-foreground/80 italic truncate">
            🏠 {task.property_reference}
          </p>
        )}

        {/* Due date */}
        {task.due_date && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            isOverdue && "text-red-600 dark:text-red-400",
            isDueToday && !isOverdue && "text-amber-600 dark:text-amber-400",
            !isOverdue && !isDueToday && "text-muted-foreground"
          )}>
            {isOverdue ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span>
              {isOverdue && "Atrasada • "}
              {isDueToday && "Hoje • "}
              {format(parseISO(task.due_date), "dd MMM", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Footer with broker and metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.broker?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {task.broker?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {task.broker?.name || "Sem corretor"}
            </span>
          </div>

          {/* Metadata counts */}
          <div className="flex items-center gap-2 text-muted-foreground">
            {commentsCount > 0 && (
              <div className="flex items-center gap-0.5 text-xs">
                <MessageSquare className="h-3 w-3" />
                <span>{commentsCount}</span>
              </div>
            )}
            {attachmentsCount > 0 && (
              <div className="flex items-center gap-0.5 text-xs">
                <Paperclip className="h-3 w-3" />
                <span>{attachmentsCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
