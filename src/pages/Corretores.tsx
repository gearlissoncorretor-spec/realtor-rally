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
  UserX
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
import KPICard from "@/components/KPICard";

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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => onClick(broker)}>
      <CardContent className="p-4 sm:p-6">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-4 lg:hidden">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
              <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">{broker.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{broker.email}</span>
              </div>
              {broker.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3 shrink-0" />
                  {broker.phone}
                </div>
              )}
            </div>
            <Badge 
              variant="secondary" 
              className={broker.status === 'ativo' 
                ? "bg-green-500/10 text-green-600 border-green-500/20 shrink-0" 
                : "bg-muted/10 text-muted-foreground shrink-0"
              }
            >
              {broker.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Meta progress */}
          {broker.meta_monthly && Number(broker.meta_monthly) > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Meta mensal</span>
                <span className="font-medium text-foreground">{Math.round(metaProgress)}%</span>
              </div>
              <Progress value={metaProgress} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Vendas</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {stats.salesCount}/{broker.meta_monthly || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Faturamento</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <Button variant="outline" className="flex-1 h-10" onClick={() => onEdit(broker)}>
              <Edit className="w-4 h-4 mr-1" /> Editar
            </Button>
            <Button 
              variant="outline" 
              className={`h-10 ${canDelete ? 'text-destructive hover:text-destructive' : 'opacity-50'}`}
              onClick={() => canDelete ? onDelete(broker) : onDeleteDenied()}
              disabled={!canDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-16 w-16 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
              <AvatarImage src={broker.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-foreground">{broker.name}</h3>
              <p className="text-muted-foreground mb-2">{broker.email}</p>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className={broker.status === 'ativo' 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-muted/10 text-muted-foreground"
                  }
                >
                  {broker.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
                {/* Meta progress inline */}
                {broker.meta_monthly && Number(broker.meta_monthly) > 0 && (
                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <Progress value={metaProgress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{Math.round(metaProgress)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-8 mx-4">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Vendas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.salesCount}/{broker.meta_monthly || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Faturamento</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => onEdit(broker)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className={canDelete ? "text-destructive hover:text-destructive" : "opacity-50"}
              onClick={() => canDelete ? onDelete(broker) : onDeleteDenied()}
              disabled={!canDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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
  const { teams, loading: teamsLoading } = useTeams();

  const getBrokerStats = (brokerId: string) => {
    const brokerSales = sales.filter(sale => sale.broker_id === brokerId);
    const confirmedSales = brokerSales.filter(sale => sale.status === 'confirmada');
    const totalRevenue = confirmedSales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
    return { salesCount: confirmedSales.length, totalRevenue };
  };

  // Filtered brokers
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

  // KPI calculations
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

  // Group filtered brokers by team
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

  const handleNewBroker = () => {
    setSelectedBroker(null);
    setIsFormOpen(true);
  };

  const handleEditBroker = (broker: Broker) => {
    setSelectedBroker(broker);
    setIsFormOpen(true);
  };

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
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="w-full text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              👥 Corretores
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie sua equipe de vendas
            </p>
          </div>
          <Button className="w-full sm:w-auto h-11" onClick={handleNewBroker}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Corretor
          </Button>
        </div>

        {/* KPI Cards */}
        {!isLoading && brokers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <KPICard
              title="Total Corretores"
              value={String(kpis.total)}
              icon={<Users className="w-5 h-5 text-primary" />}
            />
            <KPICard
              title="Ativos"
              value={String(kpis.ativos)}
              icon={<UserCheck className="w-5 h-5 text-primary" />}
              change={kpis.total > 0 ? Math.round((kpis.ativos / kpis.total) * 100) : 0}
              trend="up"
            />
            <KPICard
              title="Vendas Totais"
              value={String(kpis.totalSales)}
              icon={<Target className="w-5 h-5 text-primary" />}
            />
            <KPICard
              title="Meta Média"
              value={`${Math.round(kpis.avgMetaProgress)}%`}
              icon={<TrendingUp className="w-5 h-5 text-primary" />}
              trend={kpis.avgMetaProgress >= 70 ? "up" : kpis.avgMetaProgress >= 40 ? "neutral" : "down"}
            />
          </div>
        )}

        {/* Filters */}
        {!isLoading && brokers.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
        )}

        {isLoading ? (
          <CorretoresSkeleton />
        ) : brokers.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Nenhum corretor encontrado. Clique em "Adicionar Corretor" para começar.
            </p>
          </Card>
        ) : filteredBrokers.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Nenhum corretor encontrado com os filtros aplicados.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {brokersByTeam.map(([teamId, group]) => (
              <div key={teamId}>
                <div className="flex items-center gap-3 mb-4">
                  {teamId === 'no-team' ? (
                    <UserCircle className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Users className="w-5 h-5 text-primary" />
                  )}
                  <h2 className="text-lg font-semibold text-foreground">
                    {group.teamName}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {group.brokers.length} {group.brokers.length === 1 ? 'corretor' : 'corretores'}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:gap-6">
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
              Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
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
