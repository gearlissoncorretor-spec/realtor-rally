import React, { useState, useEffect, useMemo, useRef } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, X, Check, Search, BarChart3, DollarSign, Layers, TrendingUp } from "lucide-react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import { useProcessStages } from "@/hooks/useProcessStages";
import { formatCurrency } from "@/utils/formatting";
import KPICard from "@/components/KPICard";
import PeriodFilter from "@/components/PeriodFilter";
import AcompanhamentoSkeleton from "@/components/skeletons/AcompanhamentoSkeleton";
import ProcessKanbanCard, { type ProcessCardData } from "@/components/acompanhamento/ProcessKanbanCard";

const Acompanhamento = () => {
  const { toast } = useToast();
  const { sales, loading: salesLoading, updateSale, refreshSales } = useSales();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { stages, loading: stagesLoading, createStage, updateStage, deleteStage } = useProcessStages();

  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [newStageTitle, setNewStageTitle] = useState("");
  const [newStageColor, setNewStageColor] = useState("#3b82f6");
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const topScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [showTopScroll, setShowTopScroll] = useState(false);

  const getBrokerName = (brokerId: string | null) => {
    if (!brokerId) return "Não atribuído";
    return brokers.find(b => b.id === brokerId)?.name || "Não encontrado";
  };

  const getBrokerAvatar = (brokerId: string | null) => {
    if (!brokerId) return undefined;
    return brokers.find(b => b.id === brokerId)?.avatar_url || undefined;
  };

  // Build and filter process cards
  const processCards = useMemo<ProcessCardData[]>(() => {
    if (!sales || !brokers) return [];
    const search = searchTerm.toLowerCase();

    return sales
      .filter(sale => {
        // Period filter
        const d = sale.sale_date ? new Date(sale.sale_date) : null;
        if (d) {
          if (d.getMonth() + 1 !== selectedMonth || d.getFullYear() !== selectedYear) return false;
        }
        // Search filter
        if (search) {
          const brokerName = getBrokerName(sale.broker_id).toLowerCase();
          return sale.client_name.toLowerCase().includes(search) || brokerName.includes(search);
        }
        return true;
      })
      .map(sale => ({
        id: sale.id,
        clientName: sale.client_name,
        propertyType: sale.property_type,
        propertyAddress: sale.property_address,
        brokerName: getBrokerName(sale.broker_id),
        brokerAvatar: getBrokerAvatar(sale.broker_id),
        value: sale.property_value,
        saleDate: sale.sale_date || new Date().toISOString().split("T")[0],
        stageId: sale.process_stage_id || (stages[0]?.id || ""),
        status: sale.status || "pendente",
      }));
  }, [sales, brokers, stages, searchTerm, selectedMonth, selectedYear]);

  const getCardsForStage = (stageId: string) => processCards.filter(c => c.stageId === stageId);

  // KPI calculations
  const totalVGV = processCards.reduce((sum, c) => sum + c.value, 0);
  const totalCards = processCards.length;
  const avgTicket = totalCards > 0 ? totalVGV / totalCards : 0;
  const confirmedCount = processCards.filter(c => c.status === "confirmada").length;

  // Scroll sync
  useEffect(() => {
    const mainScroll = mainScrollRef.current;
    const topScroll = topScrollRef.current;
    if (!mainScroll || !topScroll) return;

    const checkScrollNeeded = () => {
      const needsScroll = mainScroll.scrollWidth > mainScroll.clientWidth;
      setShowTopScroll(needsScroll);
      if (needsScroll && topScroll.firstElementChild) {
        (topScroll.firstElementChild as HTMLElement).style.width = `${mainScroll.scrollWidth}px`;
      }
    };

    const syncScroll = (source: HTMLElement, target: HTMLElement) => { target.scrollLeft = source.scrollLeft; };
    const handleMainScroll = () => syncScroll(mainScroll, topScroll);
    const handleTopScroll = () => syncScroll(topScroll, mainScroll);

    mainScroll.addEventListener("scroll", handleMainScroll);
    topScroll.addEventListener("scroll", handleTopScroll);
    checkScrollNeeded();
    window.addEventListener("resize", checkScrollNeeded);

    return () => {
      mainScroll.removeEventListener("scroll", handleMainScroll);
      topScroll.removeEventListener("scroll", handleTopScroll);
      window.removeEventListener("resize", checkScrollNeeded);
    };
  }, [stages, processCards]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination || result.source.droppableId === result.destination.droppableId) return;
    const { source, destination, draggableId } = result;

    try {
      await updateSale(draggableId, { process_stage_id: destination.droppableId });
      await refreshSales();
    } catch (error) {
      console.error("Error updating sale stage:", error);
    }
  };

  const handleEditStage = async (stageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      await updateStage(stageId, { title: newTitle.trim() });
      setEditingStage(null);
      setEditingTitle("");
      toast({ title: "Sucesso", description: "Etapa atualizada!" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar", variant: "destructive" });
    }
  };

  const handleAddStage = async () => {
    if (!newStageTitle.trim()) return;
    try {
      await createStage(newStageTitle.trim(), newStageColor);
      setNewStageTitle("");
      setNewStageColor("#3b82f6");
      setIsAddingStage(false);
    } catch {}
  };

  const handleDeleteStage = async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (stage?.is_default) {
      toast({ title: "Erro", description: "Não é possível excluir etapas padrão", variant: "destructive" });
      return;
    }
    try { await deleteStage(stageId); } catch {}
  };

  if (salesLoading || brokersLoading || stagesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
          <AcompanhamentoSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 flex-1 max-w-full overflow-hidden flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Status Vendas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe o progresso de cada venda no pipeline</p>
          </div>
          <Dialog open={isAddingStage} onOpenChange={setIsAddingStage}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nova Etapa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Nova Etapa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título da Etapa</label>
                  <Input value={newStageTitle} onChange={e => setNewStageTitle(e.target.value)} placeholder="Ex: Análise de Crédito" />
                </div>
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex gap-2 mt-2">
                    {["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${newStageColor === color ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewStageColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddStage} className="flex-1">Adicionar</Button>
                  <Button variant="outline" onClick={() => setIsAddingStage(false)} className="flex-1">Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard title="Total no Pipeline" value={String(totalCards)} icon={<Layers className="h-5 w-5 text-primary" />} />
          <KPICard title="VGV Total" value={formatCurrency(totalVGV)} icon={<DollarSign className="h-5 w-5 text-primary" />} />
          <KPICard title="Ticket Médio" value={formatCurrency(avgTicket)} icon={<BarChart3 className="h-5 w-5 text-primary" />} />
          <KPICard title="Confirmadas" value={String(confirmedCount)} icon={<TrendingUp className="h-5 w-5 text-primary" />} trend={confirmedCount > 0 ? "up" : "neutral"} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente ou corretor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <PeriodFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="relative flex-1 flex flex-col overflow-hidden">
            {showTopScroll && (
              <div ref={topScrollRef} className="overflow-x-auto scrollbar-styled mb-2" style={{ height: "12px" }}>
                <div style={{ height: "1px" }} />
              </div>
            )}

            <div ref={mainScrollRef} className="flex flex-row gap-4 overflow-x-auto overflow-y-hidden scrollbar-styled pb-4 flex-1">
              {stages.map(stage => {
                const stageCards = getCardsForStage(stage.id);
                const stageVGV = stageCards.reduce((s, c) => s + c.value, 0);
                const pct = totalVGV > 0 ? (stageVGV / totalVGV) * 100 : 0;

                return (
                  <div key={stage.id} className="flex flex-col min-w-[270px] md:min-w-[290px] max-w-[320px] flex-shrink-0 h-full">
                    <Card className="mb-3">
                      <CardHeader className="p-4 pb-3">
                        <div className="flex items-center justify-between">
                          {editingStage === stage.id ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <Input value={editingTitle} onChange={e => setEditingTitle(e.target.value)} className="h-7 text-sm" onKeyDown={e => e.key === "Enter" && handleEditStage(stage.id, editingTitle)} />
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditStage(stage.id, editingTitle)}><Check className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStage(null)}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                                <CardTitle className="text-sm">{stage.title}</CardTitle>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingStage(stage.id); setEditingTitle(stage.title); }}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                {!stage.is_default && (
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteStage(stage.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary" className="text-xs">{stageCards.length} vendas</Badge>
                          <span className="text-[10px] text-muted-foreground font-medium">{formatCurrency(stageVGV)}</span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                        </div>
                      </CardHeader>
                    </Card>

                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 space-y-2.5 p-2 rounded-lg border-2 border-dashed transition-colors overflow-y-auto scrollbar-styled ${
                            snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-transparent"
                          }`}
                        >
                          {stageCards.map((card, index) => (
                            <ProcessKanbanCard key={card.id} card={card} index={index} />
                          ))}
                          {provided.placeholder}
                          {stageCards.length === 0 && (
                            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                              Nenhuma venda nesta etapa
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-0 left-0 w-6 h-full bg-gradient-to-r from-background to-transparent pointer-events-none opacity-60" />
            <div className="absolute top-0 right-0 w-6 h-full bg-gradient-to-l from-background to-transparent pointer-events-none opacity-60" />
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Acompanhamento;
