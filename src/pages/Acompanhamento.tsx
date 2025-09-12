import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from 'react-beautiful-dnd';
import { 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  User,
  MapPin
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { formatCurrency } from "@/utils/formatting";
import type { Sale } from "@/contexts/DataContext";

interface ProcessStage {
  id: string;
  title: string;
  color: string;
}

interface ProcessCard extends Sale {
  stageId: string;
}

const defaultStages: ProcessStage[] = [
  { id: 'aprovacao', title: 'APROVAÇÃO', color: 'bg-yellow-500' },
  { id: 'avaliacao', title: 'AGUARDANDO AVALIAÇÃO', color: 'bg-orange-500' },
  { id: 'formulario', title: 'FORMULÁRIO', color: 'bg-blue-500' },
  { id: 'verba', title: 'AGUARDANDO VERBA', color: 'bg-purple-500' },
  { id: 'cartorio', title: 'CARTÓRIO', color: 'bg-indigo-500' },
  { id: 'finalizado', title: 'FINALIZADO', color: 'bg-green-500' }
];

const Acompanhamento = () => {
  const { toast } = useToast();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const [stages, setStages] = useState<ProcessStage[]>(defaultStages);
  const [processCards, setProcessCards] = useState<ProcessCard[]>([]);
  const [isEditingStage, setIsEditingStage] = useState<string | null>(null);
  const [newStageTitle, setNewStageTitle] = useState('');

  // Convert sales to process cards with default stage
  useEffect(() => {
    const cards = sales.map(sale => ({
      ...sale,
      stageId: sale.status === 'confirmada' ? 'finalizado' : 'aprovacao'
    }));
    setProcessCards(cards);
  }, [sales]);

  const getBrokerName = (brokerId: string | null) => {
    if (!brokerId) return 'Sem corretor';
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.name || 'Corretor não encontrado';
  };

  const getBrokerAvatar = (brokerId: string | null) => {
    if (!brokerId) return undefined;
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.avatar_url;
  };

  const getCardsForStage = (stageId: string) => {
    return processCards.filter(card => card.stageId === stageId);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updatedCards = processCards.map(card => 
      card.id === draggableId 
        ? { ...card, stageId: destination.droppableId }
        : card
    );

    setProcessCards(updatedCards);
    
    toast({
      title: "Card movido",
      description: `Card movido para ${stages.find(s => s.id === destination.droppableId)?.title}`,
    });
  };

  const handleEditStage = (stageId: string, newTitle: string) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, title: newTitle } : stage
    ));
    setIsEditingStage(null);
    toast({
      title: "Etapa atualizada",
      description: "Nome da etapa atualizado com sucesso.",
    });
  };

  const handleAddStage = () => {
    if (!newStageTitle.trim()) return;
    
    const newStage: ProcessStage = {
      id: Date.now().toString(),
      title: newStageTitle.toUpperCase(),
      color: 'bg-gray-500'
    };
    
    setStages(prev => [...prev, newStage]);
    setNewStageTitle('');
    
    toast({
      title: "Nova etapa criada",
      description: `Etapa "${newStage.title}" adicionada com sucesso.`,
    });
  };

  const handleDeleteStage = (stageId: string) => {
    if (stages.length <= 1) {
      toast({
        title: "Erro",
        description: "Deve haver pelo menos uma etapa.",
        variant: "destructive",
      });
      return;
    }

    // Move cards from deleted stage to first stage
    const updatedCards = processCards.map(card => 
      card.stageId === stageId ? { ...card, stageId: stages[0].id } : card
    );
    
    setProcessCards(updatedCards);
    setStages(prev => prev.filter(stage => stage.id !== stageId));
    
    toast({
      title: "Etapa removida",
      description: "Etapa removida e cards movidos para a primeira etapa.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
              Acompanhamento de Processo
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Gerencie o progresso das vendas em cada etapa
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Etapa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Etapa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Nome da etapa"
                    value={newStageTitle}
                    onChange={(e) => setNewStageTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddStage} className="flex-1">
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6">
            {stages.map((stage, stageIndex) => (
              <div
                key={stage.id}
                className={`min-w-80 animate-fade-in`}
                style={{ animationDelay: `${stageIndex * 0.1}s` }}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    {isEditingStage === stage.id ? (
                      <Input
                        defaultValue={stage.title}
                        className="font-semibold text-sm"
                        onBlur={(e) => handleEditStage(stage.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditStage(stage.id, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                        <h3
                          className="font-semibold text-sm cursor-pointer hover:text-primary"
                          onClick={() => setIsEditingStage(stage.id)}
                        >
                          {stage.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {getCardsForStage(stage.id).length}
                        </Badge>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStage(stage.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-96 p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-accent/50' : 'bg-muted/20'
                      }`}
                    >
                      {getCardsForStage(stage.id).map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 mb-3 cursor-grab transition-all duration-200 hover:shadow-md ${
                                snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-sm text-foreground truncate">
                                    {card.client_name}
                                  </h4>
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${
                                      card.property_type === 'apartamento' ? 'bg-blue-100 text-blue-800' :
                                      card.property_type === 'casa' ? 'bg-green-100 text-green-800' :
                                      'bg-orange-100 text-orange-800'
                                    }`}
                                  >
                                    {card.property_type}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{card.property_address}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={getBrokerAvatar(card.broker_id)} />
                                    <AvatarFallback className="text-xs">
                                      {getBrokerName(card.broker_id).split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-muted-foreground truncate">
                                    {getBrokerName(card.broker_id)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-1 text-success">
                                    <DollarSign className="w-3 h-3" />
                                    <span className="font-medium">
                                      {formatCurrency(Number(card.property_value))}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {card.sale_date ? new Date(card.sale_date).toLocaleDateString('pt-BR') : 'Sem data'}
                                    </span>
                                  </div>
                                </div>
                              </div>
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