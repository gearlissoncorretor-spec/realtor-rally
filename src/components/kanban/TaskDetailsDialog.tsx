import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarIcon,
  Loader2,
  Send,
  Trash2,
  Clock,
  ArrowRight,
  MessageSquare,
  History,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProcessStage } from "@/hooks/useProcessStages";
import { BrokerTask, TaskComment, TaskHistory } from "@/hooks/useBrokerTasks";
import { cn } from "@/lib/utils";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: BrokerTask | null;
  stages: ProcessStage[];
  onUpdate: (taskId: string, updates: Partial<BrokerTask>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<TaskComment | undefined>;
  fetchComments: (taskId: string) => Promise<TaskComment[]>;
  fetchHistory: (taskId: string) => Promise<TaskHistory[]>;
  canEdit?: boolean;
  canDelete?: boolean;
}

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-400" },
  medium: { label: "Média", color: "bg-amber-400" },
  high: { label: "Alta", color: "bg-red-400" },
};

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  open,
  onOpenChange,
  task,
  stages,
  onUpdate,
  onDelete,
  onAddComment,
  fetchComments,
  fetchHistory,
  canEdit = true,
  canDelete = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<Partial<BrokerTask>>({});
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (task && open) {
      setEditData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        column_id: task.column_id,
        property_reference: task.property_reference,
      });
      setDueDate(task.due_date ? parseISO(task.due_date) : undefined);
      loadComments();
      loadHistory();
    }
  }, [task, open]);

  const loadComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    const data = await fetchComments(task.id);
    setComments(data);
    setLoadingComments(false);
  };

  const loadHistory = async () => {
    if (!task) return;
    const data = await fetchHistory(task.id);
    setHistory(data);
  };

  const handleSave = async () => {
    if (!task) return;
    setLoading(true);
    try {
      await onUpdate(task.id, {
        ...editData,
        due_date: dueDate?.toISOString().split("T")[0] || null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    const comment = await onAddComment(task.id, newComment.trim());
    if (comment) {
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    await onDelete(task.id);
    onOpenChange(false);
  };

  const handleColumnChange = async (newColumnId: string) => {
    if (!task) return;
    setLoading(true);
    try {
      await onUpdate(task.id, { column_id: newColumnId });
      setEditData((prev) => ({ ...prev, column_id: newColumnId }));
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const currentStage = stages.find((s) => s.id === (editData.column_id || task.column_id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editData.title || ""}
                  onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                  className="text-lg font-semibold"
                />
              ) : (
                <DialogTitle className="text-lg">{task.title}</DialogTitle>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A tarefa será permanentemente removida.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="px-6 py-2 h-auto border-b w-full justify-start rounded-none bg-transparent">
              <TabsTrigger value="details" className="gap-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comentários ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-6 space-y-4 mt-0">
              {/* Status/Column */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={editData.column_id || task.column_id} onValueChange={handleColumnChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.description || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {task.description || <span className="text-muted-foreground italic">Sem descrição</span>}
                  </p>
                )}
              </div>

              {/* Broker */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Corretor</Label>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={task.broker?.avatar_url || undefined} />
                    <AvatarFallback>{task.broker?.name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.broker?.name || "Sem corretor"}</span>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                {isEditing ? (
                  <Select
                    value={editData.priority}
                    onValueChange={(v) => setEditData((p) => ({ ...p, priority: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", priority.color)} />
                    {priority.label}
                  </Badge>
                )}
              </div>

              {/* Due date */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Prazo</Label>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {task.due_date
                      ? format(parseISO(task.due_date), "PPP", { locale: ptBR })
                      : <span className="text-muted-foreground italic">Sem prazo definido</span>}
                  </p>
                )}
              </div>

              {/* Property reference */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Imóvel</Label>
                {isEditing ? (
                  <Input
                    value={editData.property_reference || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, property_reference: e.target.value }))}
                    placeholder="Ex: Apt 101 - Ed. Solar"
                  />
                ) : (
                  <p className="text-sm">
                    {task.property_reference || <span className="text-muted-foreground italic">Não vinculado</span>}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t space-y-1">
                <p className="text-xs text-muted-foreground">
                  Criada em {format(parseISO(task.created_at), "PPP 'às' HH:mm", { locale: ptBR })}
                </p>
                {task.updated_at !== task.created_at && (
                  <p className="text-xs text-muted-foreground">
                    Atualizada {formatDistanceToNow(parseISO(task.updated_at), { addSuffix: true, locale: ptBR })}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="p-6 space-y-4 mt-0">
              {/* New comment */}
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum comentário ainda
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar_url || undefined} />
                        <AvatarFallback>{comment.user?.full_name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.user?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-6 mt-0">
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum histórico registrado
                  </p>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {entry.action === "moved" ? (
                          <ArrowRight className="h-3 w-3" />
                        ) : entry.action === "commented" ? (
                          <MessageSquare className="h-3 w-3" />
                        ) : (
                          <Edit2 className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{entry.user?.full_name || "Sistema"}</span>
                        {entry.action === "created" && " criou esta tarefa"}
                        {entry.action === "moved" && (
                          <>
                            {" "}moveu de <Badge variant="outline" className="mx-1">{entry.old_value}</Badge>
                            para <Badge variant="outline" className="mx-1">{entry.new_value}</Badge>
                          </>
                        )}
                        {entry.action === "commented" && " adicionou um comentário"}
                        {entry.action === "updated" && " atualizou a tarefa"}
                        <span className="text-muted-foreground ml-2">
                          {formatDistanceToNow(parseISO(entry.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
