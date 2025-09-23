import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useProcessStages, ProcessStage } from "@/hooks/useProcessStages";
import { formatCurrency } from "@/utils/formatting";

interface ProcessCard {
  id: string;
  clientName: string;
  propertyType: string;
  propertyAddress: string;
  brokerName: string;
  brokerAvatar?: string;
  value: number;
  saleDate: string;
  stageId: string;
}

const Acompanhamento = () => {
  const { toast } = useToast();
  const { sales, loading: salesLoading } = useSales();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { 
    stages, 
    loading: stagesLoading, 
    createStage, 
    updateStage, 
    deleteStage, 
    updateSaleStage 
  } = useProcessStages();
  
  const [processCards, setProcessCards] = useState<ProcessCard[]>([]);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [newStageTitle, setNewStageTitle] = useState("");
  const [newStageColor, setNewStageColor] = useState("#3b82f6");
  const [isAddingStage, setIsAddingStage] = useState(false);

  // Convert sales data to process cards
  useEffect(() => {
    if (sales && brokers) {
      const cards: ProcessCard[] = sales.map(sale => ({
        id: sale.id,
        clientName: sale.client_name,
        propertyType: sale.property_type,
        propertyAddress: sale.property_address,
        brokerName: getBrokerName(sale.broker_id),
        brokerAvatar: getBrokerAvatar(sale.broker_id),
        value: sale.property_value,
        saleDate: sale.sale_date || new Date().toISOString().split('T')[0],
        stageId: sale.process_stage_id || (stages[0]?.id || ''),
      }));
      setProcessCards(cards);
    }
  }, [sales, brokers, stages]);

  const getBrokerName = (brokerId: string | null) => {
    if (!brokerId) return "Não atribuído";
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.name || "Corretor não encontrado";
  };

  const getBrokerAvatar = (brokerId: string | null) => {
    if (!brokerId) return undefined;
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.avatar_url || undefined;
  };

  const getCardsForStage = (stageId: string) => {
    return processCards.filter(card => card.stageId === stageId);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    // Update local state immediately for better UX
    setProcessCards(prev => prev.map(card => 
      card.id === draggableId 
        ? { ...card, stageId: destination.droppableId }
        : card
    ));

    // Update in database
    try {
      await updateSaleStage(draggableId, destination.droppableId);
    } catch (error) {
      // Revert local state on error
      setProcessCards(prev => prev.map(card => 
        card.id === draggableId 
          ? { ...card, stageId: source.droppableId }
          : card
      ));
    }
  };

  const handleEditStage = async (stageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      await updateStage(stageId, { title: newTitle.trim() });
      setEditingStage(null);
      setEditingTitle("");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleAddStage = async () => {
    if (!newStageTitle.trim()) return;
    
    try {
      await createStage(newStageTitle.trim(), newStageColor);
      setNewStageTitle("");
      setNewStageColor("#3b82f6");
      setIsAddingStage(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (stage?.is_default) {
      toast({
        title: "Erro",
        description: "Não é possível excluir etapas padrão",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteStage(stageId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (salesLoading || brokersLoading || stagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Acompanhamento de Vendas</h1>
          <Dialog open={isAddingStage} onOpenChange={setIsAddingStage}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Etapa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Etapa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título da Etapa</label>
                  <Input
                    value={newStageTitle}
                    onChange={(e) => setNewStageTitle(e.target.value)}
                    placeholder="Ex: Análise de Crédito"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex gap-2 mt-2">
                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${newStageColor === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewStageColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddStage} className="flex-1">
                    Adicionar
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingStage(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-row gap-6 overflow-x-auto overflow-y-hidden pb-4">
            {stages.map((stage) => (
              <div key={stage.id} className="flex flex-col min-w-[280px]">
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      {editingStage === stage.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="h-8"
                            onKeyPress={(e) => e.key === 'Enter' && handleEditStage(stage.id, editingTitle)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStage(stage.id, editingTitle)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingStage(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <CardTitle className="text-sm">{stage.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingStage(stage.id);
                                setEditingTitle(stage.title);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {!stage.is_default && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteStage(stage.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {getCardsForStage(stage.id).length} vendas
                    </Badge>
                  </CardHeader>
                </Card>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver
                          ? "border-primary bg-primary/5"
                          : "border-transparent"
                      }`}
                    >
                      {getCardsForStage(stage.id).map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-move transition-shadow ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">{card.clientName}</h4>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {card.propertyType}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {card.propertyAddress}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={card.brokerAvatar} />
                                      <AvatarFallback className="text-xs">
                                        {card.brokerName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {card.brokerName}
                                    </span>
                                  </div>
                                   <div className="pt-2 border-t">
                                     <p className="text-sm font-medium text-primary">
                                       VGV: {formatCurrency(card.value)}
                                     </p>
                                     <p className="text-xs text-muted-foreground">
                                       {new Date(card.saleDate).toLocaleDateString('pt-BR')}
                                     </p>
                                   </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Acompanhamento;