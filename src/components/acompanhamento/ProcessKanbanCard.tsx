import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatting";
import { Clock, AlertTriangle, MoveRight, Building2, Home, LandPlot, Store, Trees } from "lucide-react";
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

interface StageOption {
  id: string;
  title: string;
  color: string;
}

interface ProcessKanbanCardProps {
  card: ProcessCardData;
  index: number;
  stages?: StageOption[];
  onMoveStage?: (cardId: string, stageId: string) => void;
  stageColor?: string;
}

const getDaysInStage = (saleDate: string) => {
  const sale = new Date(saleDate);
  const now = new Date();
  return Math.floor((now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24));
};

const getUrgencyLevel = (days: number): "normal" | "warning" | "critical" => {
  if (days > 30) return "critical";
  if (days > 14) return "warning";
  return "normal";
};

const PropertyIcon = ({ type }: { type: string }) => {
  const t = (type || "").toLowerCase();
  const cls = "h-3 w-3 shrink-0";
  if (t.includes("apart")) return <Building2 className={cls} />;
  if (t.includes("casa")) return <Home className={cls} />;
  if (t.includes("terreno")) return <LandPlot className={cls} />;
  if (t.includes("comerc")) return <Store className={cls} />;
  if (t.includes("rural")) return <Trees className={cls} />;
  return <Building2 className={cls} />;
};

const ProcessKanbanCard = ({ card, index, stages, onMoveStage, stageColor }: ProcessKanbanCardProps) => {
  const daysInStage = getDaysInStage(card.saleDate);
  const urgency = getUrgencyLevel(daysInStage);

  const statusLabel = card.status === "confirmada" ? "Confirmada" :
    card.status === "cancelada" ? "Cancelada" :
    card.status === "distrato" ? "Distrato" : "Pendente";

  const statusClass = card.status === "confirmada"
    ? "bg-success/10 text-success border-success/20"
    : card.status === "cancelada" || card.status === "distrato"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-muted text-muted-foreground border-border";

  const accentColor = stageColor || "hsl(var(--primary))";

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            borderLeft: `4px solid ${accentColor}`,
          }}
          className={`cursor-move group bg-card border border-border/70 transition-all duration-200 ease-out ${
            snapshot.isDragging
              ? "ring-2 ring-primary/30 shadow-lg"
              : "shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          }`}
        >
          <CardContent className="p-2.5 space-y-2">
            {/* Status */}
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={`text-[11px] px-1.5 py-0 h-5 font-medium ${statusClass}`}>
                {statusLabel}
              </Badge>
              {card.tipo === "captacao" && (
                <span className="text-[11px] font-medium text-primary">Captação</span>
              )}
            </div>

            {/* Cliente + empreendimento */}
            <div className="min-w-0">
              <h4 className="text-[16px] font-semibold text-foreground leading-tight truncate">{card.clientName}</h4>
              <p className="text-[12px] text-muted-foreground truncate">{card.propertyAddress || "—"}</p>
            </div>

            {/* Valores */}
            <div className="pt-1.5 border-t border-border/60">
              <p className="text-[22px] font-bold text-foreground leading-none tabular-nums tracking-tight">
                {formatCurrency(card.value)}
              </p>
              {card.vgc !== undefined && card.vgc > 0 && (
                <p className="text-[12px] font-medium text-success mt-0.5 tabular-nums">
                  VGC {formatCurrency(card.vgc)}
                </p>
              )}
            </div>

            {/* Corretor + tipo + dias */}
            <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={card.brokerAvatar} />
                  <AvatarFallback className="text-[10px]">{card.brokerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-[12px] text-muted-foreground truncate">{card.brokerName}</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] shrink-0 ${
                urgency === "critical" ? "text-destructive" :
                urgency === "warning" ? "text-amber-500" : "text-muted-foreground"
              }`}>
                {urgency === "critical" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                <span className="tabular-nums">{daysInStage}d</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground capitalize">
              <PropertyIcon type={card.propertyType} />
              <span className="truncate">{card.propertyType || "—"}</span>
            </div>

            {/* Ações */}
            {stages && stages.length > 0 && onMoveStage && (
              <div
                className="pt-1.5 border-t border-border/60"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Select
                  value={card.stageId}
                  onValueChange={(value) => {
                    if (value !== card.stageId) onMoveStage(card.id, value);
                  }}
                >
                  <SelectTrigger className="h-7 text-[12px] px-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MoveRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Mover para..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default ProcessKanbanCard;
export type { ProcessCardData };
