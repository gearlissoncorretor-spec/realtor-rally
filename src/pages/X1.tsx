import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Navigation from '@/components/Navigation';
import { useBrokers } from '@/hooks/useBrokers';
import { BrokerKanbanCard } from '@/components/BrokerKanbanCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type KanbanStatus = 'agendar' | 'em_andamento' | 'concluido';

interface BrokerWithStatus {
  id: string;
  name: string;
  avatar_url?: string;
  kanban_status: KanbanStatus;
}

const columns = [
  { id: 'agendar', title: 'Agendar', color: 'bg-blue-500' },
  { id: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-500' },
  { id: 'concluido', title: 'Concluído', color: 'bg-green-500' },
] as const;

export default function X1() {
  const { brokers, loading } = useBrokers();
  const [brokersWithStatus, setBrokersWithStatus] = useState<BrokerWithStatus[]>([]);

  useEffect(() => {
    if (brokers) {
      setBrokersWithStatus(
        brokers.map(broker => ({
          id: broker.id,
          name: broker.name,
          avatar_url: broker.avatar_url || undefined,
          kanban_status: (broker.kanban_status as KanbanStatus) || 'agendar',
        }))
      );
    }
  }, [brokers]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as KanbanStatus;
    const brokerId = draggableId;

    // Update local state immediately for smooth UX
    setBrokersWithStatus(prev =>
      prev.map(broker =>
        broker.id === brokerId ? { ...broker, kanban_status: newStatus } : broker
      )
    );

    // Update in database
    try {
      const { error } = await supabase
        .from('brokers')
        .update({ kanban_status: newStatus })
        .eq('id', brokerId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'O status do corretor foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Error updating broker status:', error);
      
      // Revert local state on error
      setBrokersWithStatus(prev =>
        prev.map(broker =>
          broker.id === brokerId
            ? { ...broker, kanban_status: source.droppableId as KanbanStatus }
            : broker
        )
      );

      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do corretor.',
        variant: 'destructive',
      });
    }
  };

  const getBrokersForColumn = (columnId: string) => {
    return brokersWithStatus.filter(broker => broker.kanban_status === columnId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">X1 - Gestão de Corretores</h1>
          <p className="text-muted-foreground mt-2">
            Organize e acompanhe seus corretores através do Kanban
          </p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(column => {
              const columnBrokers = getBrokersForColumn(column.id);
              
              return (
                <div key={column.id} className="flex flex-col">
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                        <span className="text-lg">{column.title}</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          ({columnBrokers.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 rounded-lg p-4 transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-accent/50'
                            : 'bg-muted/20'
                        }`}
                        style={{ minHeight: '500px' }}
                      >
                        {columnBrokers.map((broker, index) => (
                          <Draggable
                            key={broker.id}
                            draggableId={broker.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging ? 'opacity-50' : ''
                                }`}
                              >
                                <BrokerKanbanCard broker={broker} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {columnBrokers.length === 0 && (
                          <div className="text-center text-muted-foreground text-sm py-8">
                            Arraste corretores para cá
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
