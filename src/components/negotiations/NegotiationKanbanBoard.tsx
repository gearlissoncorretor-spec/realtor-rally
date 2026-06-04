import React, { useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, MoreVertical, Phone, FileText, Trash2, CheckCircle2, XCircle, Undo2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import { Negotiation } from "@/hooks/useNegotiations";
import { ProcessStage } from "@/hooks/useProcessStages";

interface NegotiationKanbanBoardProps {
  negotiations: Negotiation[];
  stages: ProcessStage[];
  getBrokerName: (brokerId: string) => string;
  isStalled: (n: Negotiation) => boolean;
  isApproved: (n: Negotiation) => boolean;
  onStageChange: (negotiationId: string, stageId: string) => Promise<void> | void;
  onEdit: (n: Negotiation) => void;
  onNotes: (n: Negotiation) => void;
  onSaleConversion: (n: Negotiation) => void;
  onLoss: (n: Negotiation) => void;
  onReturnFollowUp: (n: Negotiation) => void;
  onDelete: (id: string) => void;
}

const TEMP_EMOJI: Record<string, string> = {
  fria: "❄️",
  morna: "🌤️",
  quente: "🔥",
};

const daysSince = (date: string) => {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

export const NegotiationKanbanBoard: React.FC<NegotiationKanbanBoardProps> = ({
  negotiations,
  stages,
  getBrokerName,
  isStalled,
  isApproved,
  onStageChange,
  onEdit,
  onNotes,
  onSaleConversion,
  onLoss,
  onReturnFollowUp,
  onDelete,
}) => {
  const orderedStages = useMemo(
    () => [...stages].sort((a, b) => a.order_index - b.order_index),
    [stages]
  );

  const grouped = useMemo(() => {
    const map: Record<string, Negotiation[]> = {};
    orderedStages.forEach(s => { map[s.id] = []; });
    const unassigned: Negotiation[] = [];
    negotiations.forEach(n => {
      if (n.process_stage_id && map[n.process_stage_id]) {
        map[n.process_stage_id].push(n);
      } else {
        unassigned.push(n);
      }
    });
    return { map, unassigned };
  }, [negotiations, orderedStages]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    await onStageChange(draggableId, destination.droppableId);
  };

  const columns = orderedStages;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-styled">
        {columns.map(stage => {
          const items = grouped.map[stage.id] || [];
          const totalValue = items.reduce((sum, n) => sum + Number(n.negotiated_value || 0), 0);
          return (
            <div key={stage.id} className="flex flex-col min-w-[300px] max-w-[320px] flex-shrink-0">
              <Card className="mb-3 border-t-4" style={{ borderTopColor: stage.color }}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                      <h3 className="text-sm font-semibold truncate">{stage.title}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{items.length}</Badge>
                  </div>
                  {totalValue > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">{formatCurrency(totalValue)}</p>
                  )}
                </CardContent>
              </Card>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 space-y-2 p-2 rounded-lg border-2 border-dashed transition-all min-h-[200px] overflow-y-auto scrollbar-styled",
                      snapshot.isDraggingOver
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-muted-foreground/20"
                    )}
                    style={{ maxHeight: "calc(100vh - 380px)" }}
                  >
                    {items.map((n, index) => {
                      const stalled = isStalled(n);
                      const approved = isApproved(n);
                      const days = daysSince(n.updated_at);
                      const brokerName = getBrokerName(n.broker_id);
                      return (
                        <Draggable key={n.id} draggableId={n.id} index={index}>
                          {(prov, snap) => (
                            <Card
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={cn(
                                "cursor-grab active:cursor-grabbing transition-all group",
                                snap.isDragging ? "shadow-lg ring-2 ring-primary/30 rotate-1" : "hover:shadow-md",
                                stalled && "border-l-[3px] border-l-destructive",
                                approved && !stalled && "border-l-[3px] border-l-success"
                              )}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {n.temperature && (
                                      <span className="text-sm" title={n.temperature}>{TEMP_EMOJI[n.temperature]}</span>
                                    )}
                                    <h4 className="font-semibold text-sm text-foreground leading-tight truncate">
                                      {n.client_name}
                                    </h4>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="Ações"
                                      >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => onEdit(n)}>Editar</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => onNotes(n)}>
                                        <FileText className="w-4 h-4 mr-2" />Anotações
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onSaleConversion(n)}>
                                        <CheckCircle2 className="w-4 h-4 mr-2 text-success" />Converter em Venda
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => onReturnFollowUp(n)}>
                                        <Undo2 className="w-4 h-4 mr-2" />Voltar p/ Follow Up
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => onLoss(n)}>
                                        <XCircle className="w-4 h-4 mr-2 text-destructive" />Marcar como Perdida
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onDelete(n.id)} className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <p className="text-xs text-muted-foreground truncate">{n.property_address}</p>

                                {n.client_phone && (
                                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    <span className="truncate">{n.client_phone}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[9px]">{brokerName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-[11px] text-muted-foreground truncate">{brokerName}</span>
                                </div>

                                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-primary truncate">
                                    {formatCurrency(Number(n.negotiated_value) || 0)}
                                  </p>
                                  <div className={cn(
                                    "flex items-center gap-1 text-[10px] flex-shrink-0",
                                    stalled ? "text-destructive" : "text-muted-foreground"
                                  )}>
                                    {stalled ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    <span>{days}d</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center py-8 text-center">
                        <p className="text-xs text-muted-foreground">Nenhuma negociação</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}

        {grouped.unassigned.length > 0 && (
          <div className="flex flex-col min-w-[300px] max-w-[320px] flex-shrink-0">
            <Card className="mb-3 border-t-4 border-t-muted-foreground/40">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Sem etapa</h3>
                <Badge variant="outline" className="text-xs">{grouped.unassigned.length}</Badge>
              </CardContent>
            </Card>
            <div className="space-y-2 p-2">
              {grouped.unassigned.map(n => (
                <Card key={n.id} className="opacity-70">
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold truncate">{n.client_name}</p>
                    <p className="text-xs text-muted-foreground">Arraste para uma coluna para classificar</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default NegotiationKanbanBoard;
