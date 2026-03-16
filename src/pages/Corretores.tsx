// Corretores - Lista de corretores com abas Ativos/Inativos
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  BarChart3,
  LayoutGrid,
  LayoutList,
  AlertTriangle,
  Flame,
  Star,
  MessageCircle,
  Eye,
  UserX,
  Trophy,
  ArrowUpDown,
  XCircle
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
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

// ─── Performance Badges ──────────────────────────────────────
const getPerformanceBadges = (salesCount: number, metaProgress: number, totalRevenue: number) => {
  const badges: { icon: React.ReactNode; label: string; color: string }[] = [];
  if (salesCount >= 3) badges.push({ icon: <Star className="w-3 h-3" />, label: `${salesCount} vendas`, color: "bg-primary/15 text-primary border-primary/20" });
  if (metaProgress >= 70) badges.push({ icon: <Flame className="w-3 h-3" />, label: "Em alta", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" });
  if (metaProgress > 0 && metaProgress < 30) badges.push({ icon: <AlertTriangle className="w-3 h-3" />, label: "Abaixo da meta", color: "bg-destructive/15 text-destructive border-destructive/20" });
  return badges;
};

// ─── Activity Indicator ──────────────────────────────────────
const ActivityDot = ({ lastLogin }: { lastLogin?: string | null }) => {
  const getDaysAgo = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  
  if (!lastLogin) return <div className="w-3 h-3 rounded-full bg-muted-foreground/40 border-2 border-card" title="Sem acesso registrado" />;
  
  const days = getDaysAgo(lastLogin);
  if (days === 0) return <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-card animate-pulse" title="Ativo hoje" />;
  if (days <= 3) return <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-card" title={`Último acesso há ${days} dia(s)`} />;
  return <div className="w-3 h-3 rounded-full bg-destructive border-2 border-card" title={`Inativo há ${days} dias`} />;
};

// ─── KPI Card Component ──────────────────────────────────────
const KPICard = ({ icon, label, value, subValue, iconBg }: { icon: React.ReactNode; label: string; value: string | number; subValue?: string; iconBg: string }) => (
  <Card className="p-4 border-border/40 hover:border-border/60 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-foreground truncate">{value}</p>
        {subValue && <p className="text-[10px] text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  </Card>
);

// ─── Smart Alerts ──────────────────────────────────────────
const SmartAlerts = ({ alerts }: { alerts: { message: string; type: 'warning' | 'danger' }[] }) => {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
          alert.type === 'danger' 
            ? 'bg-destructive/5 border-destructive/20 text-destructive' 
            : 'bg-amber-500/5 border-amber-500/20 text-amber-500'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Broker Card (Cards View) ─────────────────────────────────
const BrokerCardView = ({ 
  broker, stats, allTimeStats, metaProgress, rank, badges, canDelete, lastLogin, teamName,
  onEdit, onDelete, onDeleteDenied, onClick
}: { 
  broker: Broker; stats: { salesCount: number; totalRevenue: number }; allTimeStats: { salesCount: number; totalRevenue: number }; metaProgress: number; rank: number;
  badges: { icon: React.ReactNode; label: string; color: string }[];
  canDelete: boolean; lastLogin?: string | null; teamName?: string;
  onEdit: (broker: Broker) => void; onDelete: (broker: Broker) => void;
  onDeleteDenied: () => void; onClick: (broker: Broker) => void;
}) => {
  return (
    <Card 
      className="overflow-hidden border-border/40 hover:border-primary/30 hover:shadow-xl transition-all duration-300 cursor-pointer group relative"
      onClick={() => onClick(broker)}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300">
              <AvatarImage src={broker.avatar_url || undefined} />
              <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5">
              <ActivityDot lastLogin={lastLogin} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{broker.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{broker.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={broker.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                {broker.status === 'ativo' ? 'Ativo' : broker.status === 'ferias' ? 'Férias' : 'Inativo'}
              </Badge>
              {teamName && (
                <span className="text-[10px] text-muted-foreground">{teamName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Performance Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {badges.map((badge, i) => (
              <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.icon} {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* Meta Progress */}
        {broker.meta_monthly && Number(broker.meta_monthly) > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Meta mensal</span>
              <span className={`font-semibold ${metaProgress >= 70 ? 'text-emerald-400' : metaProgress >= 30 ? 'text-amber-400' : 'text-destructive'}`}>
                {Math.round(metaProgress)}%
              </span>
            </div>
            <Progress value={metaProgress} className="h-1.5" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendas Mês</p>
            <p className="text-lg font-bold text-foreground">{stats.salesCount}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendas Total</p>
            <p className="text-lg font-bold text-foreground">{allTimeStats.salesCount}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGV Mês</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGV Total</p>
            <p className="text-sm font-bold text-muted-foreground">{formatCurrency(allTimeStats.totalRevenue)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1.5 pt-2 border-t border-border/40" onClick={e => e.stopPropagation()}>
          <TooltipProvider delayDuration={200}>
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 flex-1" onClick={() => onClick(broker)}>
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Ver perfil</TooltipContent></Tooltip>
            
            {broker.phone && (
              <Tooltip><TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 flex-1 text-emerald-500 hover:text-emerald-400" 
                  onClick={() => window.open(`https://wa.me/55${broker.phone?.replace(/\D/g, '')}`, '_blank')}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger><TooltipContent>WhatsApp</TooltipContent></Tooltip>
            )}
            
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 flex-1" onClick={() => onEdit(broker)}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
            
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" 
                className={`h-8 w-8 flex-1 ${canDelete ? "text-muted-foreground hover:text-destructive" : "opacity-30"}`}
                onClick={() => canDelete ? onDelete(broker) : onDeleteDenied()} disabled={!canDelete}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{canDelete ? 'Excluir' : 'Sem permissão'}</TooltipContent></Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Broker Table Row (Professional Table) ───────────────────
const BrokerTableRow = ({ 
  broker, stats, allTimeStats, metaProgress, rank, badges, canDelete, lastLogin, teamName,
  onEdit, onDelete, onDeleteDenied, onClick
}: { 
  broker: Broker; stats: { salesCount: number; totalRevenue: number }; allTimeStats: { salesCount: number; totalRevenue: number }; metaProgress: number; rank: number;
  badges: { icon: React.ReactNode; label: string; color: string }[];
  canDelete: boolean; lastLogin?: string | null; teamName?: string;
  onEdit: (broker: Broker) => void; onDelete: (broker: Broker) => void;
  onDeleteDenied: () => void; onClick: (broker: Broker) => void;
}) => (
  <TableRow 
    className="cursor-pointer hover:bg-muted/30 transition-colors group"
    onClick={() => onClick(broker)}
  >

    {/* Corretor */}
    <TableCell>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 ring-1 ring-border">
            <AvatarImage src={broker.avatar_url || undefined} />
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5">
            <ActivityDot lastLogin={lastLogin} />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">{broker.name}</p>
          <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{broker.email}</p>
        </div>
      </div>
    </TableCell>

    {/* Status */}
    <TableCell>
      <Badge variant={broker.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
        {broker.status === 'ativo' ? 'Ativo' : broker.status === 'ferias' ? 'Férias' : 'Inativo'}
      </Badge>
    </TableCell>

    {/* Equipe */}
    <TableCell className="text-sm text-muted-foreground">
      {teamName || <span className="text-muted-foreground/40">—</span>}
    </TableCell>

    {/* Vendas Mês */}
    <TableCell className="text-center">
      <span className="text-sm font-bold text-foreground">{stats.salesCount}</span>
    </TableCell>

    {/* Vendas Total */}
    <TableCell className="text-center">
      <span className="text-sm text-muted-foreground">{allTimeStats.salesCount}</span>
    </TableCell>

    {/* VGV Mês */}
    <TableCell className="text-right">
      <span className="text-sm font-semibold text-foreground">{formatCurrency(stats.totalRevenue)}</span>
    </TableCell>

    {/* VGV Total */}
    <TableCell className="text-right hidden lg:table-cell">
      <span className="text-sm text-muted-foreground">{formatCurrency(allTimeStats.totalRevenue)}</span>
    </TableCell>

    {/* Meta */}
    <TableCell className="min-w-[140px]">
      {broker.meta_monthly && Number(broker.meta_monthly) > 0 ? (
        <div className="flex items-center gap-2">
          <Progress value={metaProgress} className="h-1.5 flex-1" />
          <span className={`text-xs font-bold min-w-[36px] text-right ${
            metaProgress >= 70 ? 'text-emerald-400' : metaProgress >= 30 ? 'text-amber-400' : 'text-destructive'
          }`}>
            {Math.round(metaProgress)}%
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/40">Sem meta</span>
      )}
    </TableCell>

    {/* Badges */}
    <TableCell className="hidden xl:table-cell">
      <div className="flex flex-wrap gap-1">
        {badges.slice(0, 2).map((badge, i) => (
          <span key={i} className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${badge.color}`}>
            {badge.icon} {badge.label}
          </span>
        ))}
      </div>
    </TableCell>

    {/* Ações */}
    <TableCell onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-0.5 justify-end">
        <TooltipProvider delayDuration={200}>
          {broker.phone && (
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:text-emerald-400"
                onClick={() => window.open(`https://wa.me/55${broker.phone?.replace(/\D/g, '')}`, '_blank')}>
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>WhatsApp</TooltipContent></Tooltip>
          )}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(broker)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost"
              className={`h-7 w-7 ${canDelete ? "text-muted-foreground hover:text-destructive" : "opacity-30"}`}
              onClick={() => canDelete ? onDelete(broker) : onDeleteDenied()} disabled={!canDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>{canDelete ? 'Excluir' : 'Sem permissão'}</TooltipContent></Tooltip>
        </TooltipProvider>
      </div>
    </TableCell>
  </TableRow>
);

// ─── Main Page ───────────────────────────────────────────────
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
  const [activeTab, setActiveTab] = useState<'ativos' | 'inativos'>('ativos');
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  
  const { brokers, loading: brokersLoading, createBroker, updateBroker, deleteBroker } = useBrokers();
  const { sales } = useSales();
  const { teams } = useTeams();

  // Fetch profiles for last_login_at
  const [profilesMap, setProfilesMap] = useState<Record<string, { last_login_at: string | null }>>({});
  
  // Load profiles for activity indicators
  useEffect(() => {
    const loadProfiles = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('profiles').select('id, last_login_at');
      if (data) {
        const map: Record<string, { last_login_at: string | null }> = {};
        data.forEach(p => { map[p.id] = { last_login_at: p.last_login_at }; });
        setProfilesMap(map);
      }
    };
    loadProfiles();
  }, []);

  const getBrokerStats = useCallback((brokerId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const brokerSales = sales.filter(sale => sale.broker_id === brokerId);
    const confirmedSales = brokerSales.filter(sale => {
      if (sale.status === 'cancelada' || sale.status === 'distrato') return false;
      const d = new Date(sale.sale_date || sale.created_at || '');
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
    const totalRevenue = confirmedSales.reduce((sum, sale) => sum + Number(sale.vgv || sale.property_value || 0), 0);
    return { salesCount: confirmedSales.length, totalRevenue };
  }, [sales]);

  const getAllTimeBrokerStats = useCallback((brokerId: string) => {
    const brokerSales = sales.filter(sale => sale.broker_id === brokerId);
    const confirmedSales = brokerSales.filter(sale => sale.status !== 'cancelada' && sale.status !== 'distrato');
    const totalRevenue = confirmedSales.reduce((sum, sale) => sum + Number(sale.vgv || sale.property_value || 0), 0);
    return { salesCount: confirmedSales.length, totalRevenue };
  }, [sales]);

  const getMetaProgress = useCallback((broker: Broker, revenue: number) => {
    if (!broker.meta_monthly || Number(broker.meta_monthly) <= 0) return 0;
    return Math.min((revenue / Number(broker.meta_monthly)) * 100, 100);
  }, []);

  // Ranking by revenue
  const brokerRanks = useMemo(() => {
    const ranked = brokers
      .filter(b => b.status === 'ativo')
      .map(b => ({ id: b.id, revenue: getBrokerStats(b.id).totalRevenue }))
      .sort((a, b) => b.revenue - a.revenue);
    const map: Record<string, number> = {};
    ranked.forEach((b, i) => { map[b.id] = i + 1; });
    return map;
  }, [brokers, getBrokerStats]);

  // Current month stats for performance filters
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const map: Record<string, { monthlySales: number; monthlyRevenue: number }> = {};
    brokers.forEach(b => {
      const bSales = sales.filter(s => 
        s.broker_id === b.id && 
        s.status !== 'cancelada' && s.status !== 'distrato'
      );
      const monthly = bSales.filter(s => {
        const d = new Date(s.sale_date || s.created_at || '');
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      const rev = monthly.reduce((sum, s) => sum + Number(s.vgv || s.property_value || 0), 0);
      map[b.id] = { monthlySales: monthly.length, monthlyRevenue: rev };
    });
    return map;
  }, [brokers, sales]);

  // Split brokers by active tab first
  const activeBrokers = useMemo(() => brokers.filter(b => b.status !== 'inativo'), [brokers]);
  const inactiveBrokers = useMemo(() => brokers.filter(b => b.status === 'inativo'), [brokers]);
  const tabBrokers = activeTab === 'ativos' ? activeBrokers : inactiveBrokers;

  const filteredBrokers = useMemo(() => {
    let result = tabBrokers.filter(broker => {
      const matchesSearch = broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || broker.status === statusFilter;
      const matchesTeam = teamFilter === "all" || 
        (teamFilter === "no-team" ? !broker.team_id : broker.team_id === teamFilter);
      
      // Performance filter
      let matchesPerformance = true;
      if (performanceFilter === "top") {
        matchesPerformance = (brokerRanks[broker.id] || 999) <= 5;
      } else if (performanceFilter === "below-meta") {
        const ms = currentMonthStats[broker.id];
        if (broker.meta_monthly && Number(broker.meta_monthly) > 0 && ms) {
          matchesPerformance = (ms.monthlyRevenue / Number(broker.meta_monthly)) * 100 < 50;
        }
      } else if (performanceFilter === "no-sales") {
        const ms = currentMonthStats[broker.id];
        matchesPerformance = !ms || ms.monthlySales === 0;
      }

      return matchesSearch && matchesStatus && matchesTeam && matchesPerformance;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'revenue': return getBrokerStats(b.id).totalRevenue - getBrokerStats(a.id).totalRevenue;
        case 'sales': return getBrokerStats(b.id).salesCount - getBrokerStats(a.id).salesCount;
        case 'meta': return getMetaProgress(b, getBrokerStats(b.id).totalRevenue) - getMetaProgress(a, getBrokerStats(a.id).totalRevenue);
        case 'recent': return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default: return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [tabBrokers, searchTerm, statusFilter, teamFilter, performanceFilter, sortBy, brokerRanks, currentMonthStats, getBrokerStats, getMetaProgress]);

  const kpis = useMemo(() => {
    const total = brokers.length;
    const ativos = brokers.filter(b => b.status === 'ativo').length;
    const allStats = brokers.map(b => getBrokerStats(b.id));
    const totalRevenue = allStats.reduce((s, st) => s + st.totalRevenue, 0);
    const totalSales = allStats.reduce((s, st) => s + st.salesCount, 0);
    const noSalesThisMonth = brokers.filter(b => b.status === 'ativo' && (!currentMonthStats[b.id] || currentMonthStats[b.id].monthlySales === 0)).length;
    const ticketMedio = totalSales > 0 ? totalRevenue / totalSales : 0;
    const brokersWithMeta = brokers.filter(b => b.meta_monthly && Number(b.meta_monthly) > 0);
    const avgMetaProgress = brokersWithMeta.length > 0 
      ? brokersWithMeta.reduce((sum, b) => {
          const ms = currentMonthStats[b.id];
          return sum + (ms ? (ms.monthlyRevenue / Number(b.meta_monthly!)) * 100 : 0);
        }, 0) / brokersWithMeta.length
      : 0;
    return { total, ativos, totalRevenue, totalSales, noSalesThisMonth, ticketMedio, avgMetaProgress };
  }, [brokers, sales, currentMonthStats, getBrokerStats]);

  // Smart alerts
  const smartAlerts = useMemo(() => {
    const alerts: { message: string; type: 'warning' | 'danger' }[] = [];
    if (kpis.noSalesThisMonth > 0) {
      alerts.push({ message: `${kpis.noSalesThisMonth} corretor(es) sem vendas este mês`, type: 'warning' });
    }
    const belowMeta = brokers.filter(b => {
      if (!b.meta_monthly || Number(b.meta_monthly) <= 0 || b.status !== 'ativo') return false;
      const ms = currentMonthStats[b.id];
      return ms ? (ms.monthlyRevenue / Number(b.meta_monthly)) * 100 < 20 : true;
    }).length;
    if (belowMeta > 0) {
      alerts.push({ message: `${belowMeta} corretor(es) abaixo de 20% da meta`, type: 'danger' });
    }
    return alerts;
  }, [brokers, kpis, currentMonthStats]);

  const teamsMap = useMemo(() => {
    const m: Record<string, string> = {};
    teams.forEach(t => { m[t.id] = t.name; });
    return m;
  }, [teams]);

  const brokersByTeam = useMemo(() => {
    const grouped: Record<string, { teamName: string; brokers: Broker[] }> = {};
    teams.forEach(team => { grouped[team.id] = { teamName: team.name, brokers: [] }; });
    grouped['no-team'] = { teamName: 'Sem Equipe', brokers: [] };
    filteredBrokers.forEach(broker => {
      const teamId = broker.team_id || 'no-team';
      if (!grouped[teamId]) grouped[teamId] = { teamName: 'Equipe Desconhecida', brokers: [] };
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
    if (isAdmin() || isDiretor() || isGerente()) return true;
    return false;
  };

  const handleDeleteBroker = async () => {
    if (!deleteConfirmBroker) return;
    if (!canDeleteBroker(deleteConfirmBroker)) {
      toast({ title: "Sem permissão", description: "Você não tem permissão para excluir este corretor.", variant: "destructive" });
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
    if (selectedBroker) {
      await updateBroker(selectedBroker.id, data);
    } else {
      await createBroker(data);
    }
    setIsFormOpen(false);
  };

  const handleDeleteDenied = () => {
    toast({ title: "Sem permissão", description: "Você não tem permissão para excluir este corretor.", variant: "destructive" });
  };

  const hasActiveFilters = statusFilter !== 'all' || teamFilter !== 'all' || performanceFilter !== 'all' || searchTerm;
  const clearFilters = () => { setStatusFilter('all'); setTeamFilter('all'); setPerformanceFilter('all'); setSearchTerm(''); };

  const isLoading = brokersLoading && brokers.length === 0;

  const renderBrokerItem = (broker: Broker) => {
    const stats = getBrokerStats(broker.id);
    const allTimeStats = getAllTimeBrokerStats(broker.id);
    const metaProgress = getMetaProgress(broker, currentMonthStats[broker.id]?.monthlyRevenue || 0);
    const badges = getPerformanceBadges(stats.salesCount, metaProgress, stats.totalRevenue);
    const lastLogin = broker.user_id ? profilesMap[broker.user_id]?.last_login_at : null;
    const teamName = broker.team_id ? teamsMap[broker.team_id] : undefined;
    
    const commonProps = {
      broker, stats, allTimeStats, metaProgress, rank: 0, badges, lastLogin, teamName,
      canDelete: canDeleteBroker(broker),
      onEdit: handleEditBroker,
      onDelete: setDeleteConfirmBroker,
      onDeleteDenied: handleDeleteDenied,
      onClick: setDetailsBroker,
    };

    return viewMode === 'cards' 
      ? <BrokerCardView key={broker.id} {...commonProps} />
      : <BrokerTableRow key={broker.id} {...commonProps} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Corretores</h1>
            <p className="text-sm text-muted-foreground mt-1">Painel estratégico de gestão e performance da equipe</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="hidden sm:flex items-center border border-border/40 rounded-lg p-0.5">
              <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setViewMode('list')}>
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button size="icon" variant={viewMode === 'cards' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setViewMode('cards')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button className="flex-1 sm:flex-none h-10 shadow-sm" onClick={handleNewBroker}>
              <Plus className="w-4 h-4 mr-2" /> Novo Corretor
            </Button>
          </div>
        </div>

        {/* Smart Alerts */}
        {!isLoading && <SmartAlerts alerts={smartAlerts} />}

        {/* KPI Strip */}
        {!isLoading && brokers.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <KPICard icon={<Users className="w-4 h-4 text-primary" />} label="Total" value={kpis.total} iconBg="bg-primary/10" />
            <KPICard icon={<UserCheck className="w-4 h-4 text-emerald-500" />} label="Ativos" value={kpis.ativos} iconBg="bg-emerald-500/10" />
            <KPICard icon={<UserX className="w-4 h-4 text-destructive" />} label="Sem vendas no mês" value={kpis.noSalesThisMonth} iconBg="bg-destructive/10" />
            <KPICard icon={<DollarSign className="w-4 h-4 text-emerald-500" />} label="Faturamento" value={formatCurrency(kpis.totalRevenue)} iconBg="bg-emerald-500/10" />
            <KPICard icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Ticket Médio" value={formatCurrency(kpis.ticketMedio)} iconBg="bg-primary/10" />
            <KPICard icon={<BarChart3 className="w-4 h-4 text-amber-500" />} label="Meta Média" value={`${Math.round(kpis.avgMetaProgress)}%`} iconBg="bg-amber-500/10" subValue="da equipe" />
          </div>
        )}

        {/* Filters */}
        {!isLoading && brokers.length > 0 && (
          <Card className="p-3 mb-6 border-border/40">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar corretor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-border/40 bg-background" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] border-border/40 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[160px] border-border/40 bg-background"><SelectValue placeholder="Equipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas equipes</SelectItem>
                    <SelectItem value="no-team">Sem equipe</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger className="w-[170px] border-border/40 bg-background"><SelectValue placeholder="Performance" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="top">Top vendedores</SelectItem>
                    <SelectItem value="below-meta">Abaixo da meta</SelectItem>
                    <SelectItem value="no-sales">Sem vendas no mês</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[170px] border-border/40 bg-background">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3 h-3" />
                      <SelectValue placeholder="Ordenar" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="revenue">Maior faturamento</SelectItem>
                    <SelectItem value="sales">Mais vendas</SelectItem>
                    <SelectItem value="meta">Melhor meta</SelectItem>
                    <SelectItem value="recent">Mais recente</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-muted-foreground hover:text-foreground">
                    <XCircle className="w-4 h-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Content */}
        {isLoading ? (
          <CorretoresSkeleton />
        ) : brokers.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-border/50">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum corretor cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece adicionando o primeiro corretor da sua equipe.</p>
            <Button onClick={handleNewBroker}><Plus className="w-4 h-4 mr-2" /> Adicionar Corretor</Button>
          </Card>
        ) : filteredBrokers.length === 0 ? (
          <Card className="p-8 text-center border-border/40">
            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum corretor encontrado com os filtros aplicados.</p>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">Limpar filtros</Button>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBrokers.map(renderBrokerItem)}
          </div>
        ) : (
          <Card className="border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Corretor</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[130px]">Equipe</TableHead>
                  <TableHead className="w-[80px] text-center">Vendas Mês</TableHead>
                  <TableHead className="w-[80px] text-center">Vendas Total</TableHead>
                  <TableHead className="w-[130px] text-right">VGV Mês</TableHead>
                  <TableHead className="w-[130px] text-right hidden lg:table-cell">VGV Total</TableHead>
                  <TableHead className="w-[160px]">Meta</TableHead>
                  <TableHead className="hidden xl:table-cell w-[160px]">Badges</TableHead>
                  <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrokers.map(renderBrokerItem)}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <BrokerForm 
        isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}
        onSubmit={handleBrokerSubmit} broker={selectedBroker}
        title={selectedBroker ? "Editar Corretor" : "Novo Corretor"}
      />

      {detailsBroker && (
        <BrokerDetailsModal
          broker={detailsBroker} isOpen={!!detailsBroker} onClose={() => setDetailsBroker(null)}
          sales={sales.filter(s => s.broker_id === detailsBroker.id)} onUpdateBroker={updateBroker}
        />
      )}

      <AlertDialog open={!!deleteConfirmBroker} onOpenChange={() => setDeleteConfirmBroker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Corretor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o corretor <strong>{deleteConfirmBroker?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBroker} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Excluindo...</> : <><Trash2 className="w-4 h-4 mr-2" />Excluir</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Corretores;
