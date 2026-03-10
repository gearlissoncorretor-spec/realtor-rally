import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2,
  Target,
  DollarSign,
  Phone,
  Mail,
  Loader2,
  Users,
  UserCircle,
  Search,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Award,
  BarChart3
} from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { BrokerForm } from "@/components/forms/BrokerForm";
import BrokerDetailsModal from "@/components/BrokerDetailsModal";
import { useBrokers } from "@/hooks/useBrokers";
import { useSales } from "@/hooks/useSales";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import type { Broker } from "@/contexts/DataContext";
import { CorretoresSkeleton } from "@/components/skeletons/CorretoresSkeleton";
import { formatCurrency } from "@/utils/formatting";

const BrokerCard = ({ 
  broker, 
  stats, 
  canDelete, 
  onEdit, 
  onDelete, 
  onDeleteDenied,
  onClick
}: { 
  broker: Broker; 
  stats: { salesCount: number; totalRevenue: number }; 
  canDelete: boolean;
  onEdit: (broker: Broker) => void;
  onDelete: (broker: Broker) => void;
  onDeleteDenied: () => void;
  onClick: (broker: Broker) => void;
}) => {
  const metaProgress = broker.meta_monthly ? Math.min((stats.salesCount / Number(broker.meta_monthly)) * 100, 100) : 0;

  return (
    <Card 
      className="overflow-hidden border-border/40 hover:border-primary/30 hover:shadow-xl transition-all duration-300 cursor-pointer group relative"
      onClick={() => onClick(broker)}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-0">
        {/* Mobile Layout */}
        <div className="flex flex-col lg:hidden">
          <div className="p-4 pb-3">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-14 w-14 shrink-0 ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300">
                  <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                    {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${broker.status === 'ativo' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground truncate">{broker.name}</h3>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{broker.email}</span>
                </div>
                {broker.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    {broker.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meta progress */}
          {broker.meta_monthly && Number(broker.meta_monthly) > 0 && (
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Meta mensal
                </span>
                <span className={`font-semibold ${metaProgress >= 80 ? 'text-emerald-500' : metaProgress >= 50 ? 'text-amber-500' : 'text-foreground'}`}>
                  {stats.salesCount}/{broker.meta_monthly} ({Math.round(metaProgress)}%)
                </span>
              </div>
              <Progress value={metaProgress} className="h-1.5" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-px bg-border/50">
            <div className="bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Vendas</p>
              <p className="text-lg font-bold text-foreground">{stats.salesCount}</p>
            </div>
            <div className="bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Faturamento</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>

          <div className="flex gap-2 p-3 bg-muted/30" onClick={e => e.stopPropagation()}>
            <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={() => onEdit(broker)}>
              <Edit className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={`h-9 ${canDelete ? 'text-destructive hover:text-destructive hover:bg-destructive/5' : 'opacity-40'}`}
              onClick={() => canDelete ? onDelete(broker) : onDeleteDenied()}
              disabled={!canDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center p-5 gap-6">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300 shadow-sm">
              <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${broker.status === 'ativo' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-lg font-semibold text-foreground truncate">{broker.name}</h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {broker.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{broker.email}</p>
            {broker.meta_monthly && Number(broker.meta_monthly) > 0 && (
              <div className="flex items-center gap-3 mt-2 max-w-[280px]">
                <Progress value={metaProgress} className="h-1.5 flex-1" />
                <span className={`text-xs font-semibold whitespace-nowrap ${metaProgress >= 80 ? 'text-emerald-500' : metaProgress >= 50 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {stats.salesCount}/{broker.meta_monthly} ({Math.round(metaProgress)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center min-w-[80px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Vendas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.salesCount}</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Faturamento</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onEdit(broker)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost"
              className={`h-9 w-9 ${canDelete ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "opacity-30"}`}
              onClick={() => canDelete ? onDelete(broker) : onDeleteDenied()}
              disabled={!canDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary ml-1 transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Corretores = () => {
  const { toast } = useToast();
  const { user, isGerente, isDiretor, isAdmin } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [detailsBroker, setDetailsBroker] = useState<Broker | null>(null);
  const [deleteConfirmBroker, setDeleteConfirmBroker] = useState<Broker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  
  const { brokers, loading: brokersLoading, createBroker, updateBroker, deleteBroker } = useBrokers();
  const { sales } = useSales();
  const { teams } = useTeams();

  const getBrokerStats = (brokerId: string) => {
    const brokerSales = sales.filter(sale => sale.broker_id === brokerId);
    const confirmedSales = brokerSales.filter(sale => sale.status === 'confirmada');
    const totalRevenue = confirmedSales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
    return { salesCount: confirmedSales.length, totalRevenue };
  };

  const filteredBrokers = useMemo(() => {
    return brokers.filter(broker => {
      const matchesSearch = broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || broker.status === statusFilter;
      const matchesTeam = teamFilter === "all" || 
        (teamFilter === "no-team" ? !broker.team_id : broker.team_id === teamFilter);
      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [brokers, searchTerm, statusFilter, teamFilter]);

  const kpis = useMemo(() => {
    const total = brokers.length;
    const ativos = brokers.filter(b => b.status === 'ativo').length;
    const totalRevenue = brokers.reduce((sum, b) => sum + getBrokerStats(b.id).totalRevenue, 0);
    const totalSales = brokers.reduce((sum, b) => sum + getBrokerStats(b.id).salesCount, 0);
    const brokersWithMeta = brokers.filter(b => b.meta_monthly && Number(b.meta_monthly) > 0);
    const avgMetaProgress = brokersWithMeta.length > 0 
      ? brokersWithMeta.reduce((sum, b) => {
          const stats = getBrokerStats(b.id);
          return sum + (stats.salesCount / Number(b.meta_monthly!)) * 100;
        }, 0) / brokersWithMeta.length
      : 0;
    return { total, ativos, totalRevenue, totalSales, avgMetaProgress };
  }, [brokers, sales]);

  const brokersByTeam = useMemo(() => {
    const grouped: Record<string, { teamName: string; brokers: Broker[] }> = {};
    teams.forEach(team => {
      grouped[team.id] = { teamName: team.name, brokers: [] };
    });
    grouped['no-team'] = { teamName: 'Sem Equipe', brokers: [] };
    filteredBrokers.forEach(broker => {
      const teamId = broker.team_id || 'no-team';
      if (!grouped[teamId]) {
        grouped[teamId] = { teamName: 'Equipe Desconhecida', brokers: [] };
      }
      grouped[teamId].brokers.push(broker);
    });
    return Object.entries(grouped)
      .filter(([_, group]) => group.brokers.length > 0)
      .sort((a, b) => {
        if (a[0] === 'no-team') return 1;
        if (b[0] === 'no-team') return -1;
        return a[1].teamName.localeCompare(b[1].teamName);
      });
  }, [filteredBrokers, teams]);

  const handleNewBroker = () => { setSelectedBroker(null); setIsFormOpen(true); };
  const handleEditBroker = (broker: Broker) => { setSelectedBroker(broker); setIsFormOpen(true); };

  const canDeleteBroker = (broker: Broker): boolean => {
    if (isAdmin() || isDiretor()) return true;
    if (isGerente()) return broker.created_by === user?.id;
    return false;
  };

  const handleDeleteBroker = async () => {
    if (!deleteConfirmBroker) return;
    if (!canDeleteBroker(deleteConfirmBroker)) {
      toast({ title: "Sem permissão", description: "Você só pode excluir corretores que você mesmo criou.", variant: "destructive" });
      setDeleteConfirmBroker(null);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteBroker(deleteConfirmBroker.id);
      setDeleteConfirmBroker(null);
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error?.message || "Não foi possível excluir o corretor.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBrokerSubmit = async (data: any) => {
    try {
      if (selectedBroker) {
        await updateBroker(selectedBroker.id, data);
      } else {
        await createBroker(data);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar corretor:', error);
    }
  };

  const handleDeleteDenied = () => {
    toast({ title: "Sem permissão", description: "Você só pode excluir corretores que você criou.", variant: "destructive" });
  };

  const isLoading = brokersLoading && brokers.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Corretores
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie e acompanhe a performance da sua equipe
            </p>
          </div>
          <Button className="w-full sm:w-auto h-10 shadow-sm" onClick={handleNewBroker}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Corretor
          </Button>
        </div>

        {/* KPI Strip */}
        {!isLoading && brokers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <Card className="p-4 border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-xl font-bold text-foreground">{kpis.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Ativos</p>
                  <p className="text-xl font-bold text-foreground">{kpis.ativos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Vendas</p>
                  <p className="text-xl font-bold text-foreground">{kpis.totalSales}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Faturamento</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatCurrency(kpis.totalRevenue)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border/40 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Meta Média</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">{Math.round(kpis.avgMetaProgress)}%</p>
                    <Progress value={kpis.avgMetaProgress} className="h-1.5 flex-1" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        {!isLoading && brokers.length > 0 && (
          <Card className="p-3 mb-6 border-border/40">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar corretor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-border/40 bg-background"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-border/40 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-[170px] border-border/40 bg-background">
                  <SelectValue placeholder="Equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas equipes</SelectItem>
                  <SelectItem value="no-team">Sem equipe</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {isLoading ? (
          <CorretoresSkeleton />
        ) : brokers.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-border/50">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum corretor cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece adicionando o primeiro corretor da sua equipe.
            </p>
            <Button onClick={handleNewBroker}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Corretor
            </Button>
          </Card>
        ) : filteredBrokers.length === 0 ? (
          <Card className="p-8 text-center border-border/40">
            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum corretor encontrado com os filtros aplicados.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {brokersByTeam.map(([teamId, group]) => (
              <div key={teamId}>
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${teamId === 'no-team' ? 'bg-muted' : 'bg-primary/10'}`}>
                    {teamId === 'no-team' ? (
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {group.teamName}
                  </h2>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                    {group.brokers.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {group.brokers.map(broker => (
                    <BrokerCard
                      key={broker.id}
                      broker={broker}
                      stats={getBrokerStats(broker.id)}
                      canDelete={canDeleteBroker(broker)}
                      onEdit={handleEditBroker}
                      onDelete={setDeleteConfirmBroker}
                      onDeleteDenied={handleDeleteDenied}
                      onClick={setDetailsBroker}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BrokerForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleBrokerSubmit}
        broker={selectedBroker}
        title={selectedBroker ? "Editar Corretor" : "Novo Corretor"}
      />

      {detailsBroker && (
        <BrokerDetailsModal
          broker={detailsBroker}
          isOpen={!!detailsBroker}
          onClose={() => setDetailsBroker(null)}
          sales={sales.filter(s => s.broker_id === detailsBroker.id)}
          onUpdateBroker={updateBroker}
        />
      )}

      <AlertDialog open={!!deleteConfirmBroker} onOpenChange={() => setDeleteConfirmBroker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Corretor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o corretor <strong>{deleteConfirmBroker?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBroker}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Excluindo...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />Excluir</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Corretores;
