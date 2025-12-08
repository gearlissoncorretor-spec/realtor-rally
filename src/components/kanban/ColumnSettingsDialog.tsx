import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Settings,
  GripVertical,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { ProcessStage } from "@/hooks/useProcessStages";
import { cn } from "@/lib/utils";

interface ColumnSettingsDialogProps {
  stages: ProcessStage[];
  onCreateStage: (title: string, color: string) => Promise<any>;
  onUpdateStage: (id: string, updates: Partial<ProcessStage>) => Promise<any>;
  onDeleteStage: (id: string) => Promise<void>;
  onReorderStages?: (stages: ProcessStage[]) => Promise<void>;
}

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
];

const ColumnSettingsDialog: React.FC<ColumnSettingsDialogProps> = ({
  stages,
  onCreateStage,
  onUpdateStage,
  onDeleteStage,
  onReorderStages,
}) => {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(COLORS[6]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingColor, setEditingColor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddStage = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await onCreateStage(newTitle.trim(), newColor);
      setNewTitle("");
      setNewColor(COLORS[6]);
      setIsAdding(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (id: string) => {
    if (!editingTitle.trim()) return;
    setLoading(true);
    try {
      await onUpdateStage(id, { title: editingTitle.trim(), color: editingColor });
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStage = async (id: string) => {
    const stage = stages.find((s) => s.id === id);
    if (stage?.is_default) return;
    setLoading(true);
    try {
      await onDeleteStage(id);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !onReorderStages) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    await onReorderStages(updatedItems);
  };

  const startEditing = (stage: ProcessStage) => {
    setEditingId(stage.id);
    setEditingTitle(stage.title);
    setEditingColor(stage.color);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Colunas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Colunas do Kanban</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 pr-4"
                >
                  {stages.map((stage, index) => (
                    <Draggable key={stage.id} draggableId={stage.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center gap-2 p-3 bg-muted/50 rounded-lg border",
                            snapshot.isDragging && "shadow-lg"
                          )}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </div>

                          {editingId === stage.id ? (
                            <>
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="flex-1 h-8"
                              />
                              <div className="flex gap-1">
                                {COLORS.slice(0, 5).map((color) => (
                                  <button
                                    key={color}
                                    className={cn(
                                      "w-5 h-5 rounded-full border-2",
                                      editingColor === color
                                        ? "border-foreground"
                                        : "border-transparent"
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setEditingColor(color)}
                                  />
                                ))}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleUpdateStage(stage.id)}
                                disabled={loading}
                              >
                                {loading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="flex-1 text-sm font-medium">
                                {stage.title}
                              </span>
                              {stage.is_default && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  Padrão
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => startEditing(stage)}
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                              {!stage.is_default && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteStage(stage.id)}
                                  disabled={loading}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add new stage */}
          {isAdding ? (
            <div className="mt-4 p-3 border rounded-lg space-y-3 pr-4">
              <div className="space-y-2">
                <Label>Nome da Coluna</Label>
                <Input
                  placeholder="Ex: Análise de Crédito"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                        newColor === color ? "border-foreground" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddStage} disabled={loading || !newTitle.trim()} className="flex-1">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Adicionar
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Coluna
            </Button>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnSettingsDialog;
