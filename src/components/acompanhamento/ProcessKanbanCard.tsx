import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatting";
import { Clock, AlertTriangle } from "lucide-react";
import { Draggable } from "react-beautiful-dnd";

interface ProcessCardData {
  id: string;
  clientName: string;
  propertyType: string;
  propertyAddress: string;
  brokerName: string;
  brokerAvatar?: string;
  value: number;
  vgc?: number;
  tipo?: string;
  saleDate: string;
  stageId: string;
  status?: string;
}

interface ProcessKanbanCardProps {
  card: ProcessCardData;
  index: number;
}

const getDaysInStage = (saleDate: string) => {
  const sale = new Date(saleDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getUrgencyLevel = (days: number): "normal" | "warning" | "critical" => {
  if (days > 30) return "critical";
  if (days > 14) return "warning";
  return "normal";
};

const ProcessKanbanCard = ({ card, index }: ProcessKanbanCardProps) => {
  const daysInStage = getDaysInStage(card.saleDate);
  const urgency = getUrgencyLevel(daysInStage);

  const statusLabel = card.status === "confirmada" ? "Confirmada" :
    card.status === "cancelada" ? "Cancelada" :
    card.status === "distrato" ? "Distrato" : "Pendente";

  const statusVariant = card.status === "confirmada" ? "default" :
    card.status === "cancelada" || card.status === "distrato" ? "destructive" : "secondary";

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`cursor-move transition-all group ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30 rotate-1" : "hover:shadow-md"
          } ${
            urgency === "critical" ? "border-l-[3px] border-l-destructive" :
            urgency === "warning" ? "border-l-[3px] border-l-amber-500" : ""
          }`}
        >
          <CardContent className="p-3.5">
            <div className="space-y-2">
              {/* Header: client + status */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-foreground leading-tight">{card.clientName}</h4>
                <Badge variant={statusVariant} className="text-[10px] px-1.5 py-0 shrink-0">
                  {statusLabel}
                </Badge>
              </div>

              {/* Property info */}
              <p className="text-xs text-muted-foreground capitalize">{card.propertyType}</p>
              <p className="text-xs text-muted-foreground truncate">{card.propertyAddress}</p>

              {/* Broker */}
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={card.brokerAvatar} />
                  <AvatarFallback className="text-[10px]">{card.brokerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">{card.brokerName}</span>
              </div>

              {/* Footer: value + time */}
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <p className="text-sm font-bold text-primary">{formatCurrency(card.value)}</p>
                <div className={`flex items-center gap-1 text-[10px] ${
                  urgency === "critical" ? "text-destructive" :
                  urgency === "warning" ? "text-amber-500" : "text-muted-foreground"
                }`}>
                  {urgency === "critical" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  <span>{daysInStage}d</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default ProcessKanbanCard;
export type { ProcessCardData };
