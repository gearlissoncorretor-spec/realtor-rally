import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { RankingSkeleton } from "@/components/skeletons/RankingSkeleton";
import PeriodFilter from "@/components/PeriodFilter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Trophy, TrendingUp, Tv, Flame, Star, X,
  Volume2, VolumeX, Crown, Sparkles, Building2, Settings,
  Activity, BarChart3, ChevronUp, ChevronDown,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { formatCurrency, formatCurrencyCompact } from "@/utils/formatting";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useSpotlightBroker } from "@/hooks/useSpotlightBroker";
import { useActivityRanking, saveActivityWeights } from "@/hooks/useActivityRanking";

// Extracted components
import { BrokerRanking, TeamRanking, RankingType, SortField, TVRankingMode } from "@/components/ranking/types";
import ParticleEffect from "@/components/ranking/ParticleEffect";
import PositionBadge from "@/components/ranking/PositionBadge";
import SpotlightBrokerSidebar from "@/components/ranking/SpotlightBrokerSidebar";
import TeamRankingSection from "@/components/ranking/TeamRankingSection";
import AnimatedPodium from "@/components/ranking/AnimatedPodium";
import StatsHeader from "@/components/ranking/StatsHeader";
import LeaderboardCard from "@/components/ranking/LeaderboardCard";
import { TeamFilter, QuickPeriodButtons } from "@/components/ranking/RankingFilters";
import { ConfettiCanvas, useRankingSounds } from "@/components/ranking/RankingEffects";
import RankingTVMode from "@/components/ranking/RankingTVMode";

const Ranking = () => {
  const { brokers, sales, brokersLoading, salesLoading } = useData();
  const { user, isDiretor, isAdmin, isGerente, isCorretor, getUserRole, profile, teamHierarchy } = useAuth();
  const { teams } = useTeams();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [isTVMode, setIsTVMode] = useState(false);
  const [quickPeriod, setQuickPeriod] = useState('month');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [rankingType, setRankingType] = useState<RankingType>('vendas');
  const [sortField, setSortField] = useState<SortField>('vgv');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tvRankingMode, setTVRankingMode] = useState<TVRankingMode>('alternate');
  const [tvSlideInterval, setTVSlideInterval] = useState<number>(() => {
    const saved = localStorage.getItem('tv-slide-interval');
    return saved ? Number(saved) : 20;
  });
  const handleSlideIntervalChange = (val: string) => {
    const num = Number(val);
    setTVSlideInterval(num);
    localStorage.setItem('tv-slide-interval', String(num));
  };
  const { soundEnabled, setSoundEnabled, playVictory, stopCustomSound } = useRankingSounds();
  const { settings } = useOrganizationSettings();
  const { spotlightBrokerId, setSpotlightBroker, isUpdating: spotlightUpdating } = useSpotlightBroker();
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [activityPeriod, setActivityPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showWeightConfig, setShowWeightConfig] = useState(false);

  // Fetch manager user_ids to exclude from ranking
  const { data: managerUserIds = [] } = useQuery({
    queryKey: ['manager-user-ids'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_manager_user_ids');
      if (error) { console.error('Error fetching manager ids:', error); return []; }
      return (data as string[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Activity ranking hook  
  const teamsForActivity = useMemo(() => teams.map(t => ({ id: t.id, name: t.name })), [teams]);
  const { rankings: activityRankings, activityNames, activityWeights, isLoading: activityLoading, insight: activityInsight } = useActivityRanking(
    brokers, teamsForActivity, activityPeriod, selectedActivityType, selectedTeam, managerUserIds,
  );

  // Role-based header
  const headerInfo = useMemo(() => {
    const role = getUserRole();
    if (role === 'diretor' || role === 'admin' || role === 'super_admin') {
      return { title: settings?.organization_name || 'Ranking de Vendas', subtitle: 'Visão geral de todas as equipes' };
    }
    if (role === 'gerente' && profile?.team_id) {
      const team = teams.find(t => t.id === profile.team_id);
      return { title: team?.name || 'Ranking da Equipe', subtitle: 'Performance da sua equipe' };
    }
    return { title: 'Ranking de Vendas', subtitle: 'Performance e classificação' };
  }, [getUserRole, settings, profile, teams]);

  const canManageSpotlight = isDiretor() || isAdmin() || isGerente();

  const effectiveTeamFilter = useMemo(() => {
    if (isGerente() || isCorretor()) {
      return profile?.team_id || teamHierarchy?.team_id || 'none';
    }
    return selectedTeam;
  }, [isGerente, isCorretor, profile, teamHierarchy, selectedTeam]);

  const teamsForFilter = useMemo(() => teams.map(t => ({ id: t.id, name: t.name })), [teams]);

  // Filter sales by quick period or month/year
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      if (quickPeriod === 'today') return saleDate.toDateString() === now.toDateString();
      if (quickPeriod === 'week') { const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7); return saleDate >= weekAgo; }
      if (quickPeriod === 'quarter') { const cq = Math.floor(now.getMonth() / 3); return saleDate.getFullYear() === now.getFullYear() && Math.floor(saleDate.getMonth() / 3) === cq; }
      if (quickPeriod === 'year') return saleDate.getFullYear() === now.getFullYear();
      if (quickPeriod === 'all') return true;
      const filterMonth = selectedMonth > 0 ? selectedMonth : now.getMonth() + 1;
      const filterYear = selectedYear > 0 ? selectedYear : now.getFullYear();
      return saleDate.getMonth() + 1 === filterMonth && saleDate.getFullYear() === filterYear;
    });
  }, [sales, selectedMonth, selectedYear, quickPeriod]);

  // Previous period sales for comparison
  const previousPeriodSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      if (quickPeriod === 'today') { const y = new Date(now); y.setDate(y.getDate() - 1); return saleDate.toDateString() === y.toDateString(); }
      if (quickPeriod === 'week') { const t = new Date(now); t.setDate(t.getDate() - 14); const o = new Date(now); o.setDate(o.getDate() - 7); return saleDate >= t && saleDate < o; }
      if (quickPeriod === 'quarter') { const cq = Math.floor(now.getMonth() / 3); if (cq === 0) return saleDate.getFullYear() === now.getFullYear() - 1 && Math.floor(saleDate.getMonth() / 3) === 3; return saleDate.getFullYear() === now.getFullYear() && Math.floor(saleDate.getMonth() / 3) === cq - 1; }
      if (quickPeriod === 'year') return saleDate.getFullYear() === now.getFullYear() - 1;
      if (quickPeriod === 'all') return false;
      const fm = selectedMonth > 0 ? selectedMonth : now.getMonth() + 1;
      const fy = selectedYear > 0 ? selectedYear : now.getFullYear();
      const pm = fm === 1 ? 12 : fm - 1;
      const py = fm === 1 ? fy - 1 : fy;
      return saleDate.getMonth() + 1 === pm && saleDate.getFullYear() === py;
    });
  }, [sales, selectedMonth, selectedYear, quickPeriod]);

  // All brokers including managers - used for summary stats
  const allBrokerRankings: BrokerRanking[] = useMemo(() => {
    let filteredBrokers = brokers;
    if (effectiveTeamFilter !== 'all') filteredBrokers = brokers.filter(b => b.team_id === effectiveTeamFilter);

    const rankings = filteredBrokers.filter(b => b.status === 'ativo').map(broker => {
      const brokerSales = filteredSales.filter(s => 
        s.broker_id === broker.id && 
        s.status !== 'cancelada' && 
        s.status !== 'distrato' &&
        s.tipo === 'venda' &&
        s.parceria_tipo !== 'Agência'
      );
      const totalRevenue = brokerSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const ticketMedio = brokerSales.length > 0 ? totalRevenue / brokerSales.length : 0;
      const team = teams.find(t => t.id === broker.team_id);
      const prevBrokerSales = previousPeriodSales.filter(s => 
        s.broker_id === broker.id && 
        s.status !== 'cancelada' && 
        s.status !== 'distrato' &&
        s.tipo === 'venda' &&
        s.parceria_tipo !== 'Agência'
      );
      const prevRevenue = prevBrokerSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
      return { id: broker.id, name: broker.name, avatar: broker.avatar_url || '', sales: brokerSales.length, revenue: totalRevenue, position: 0, growth, email: broker.email, userId: broker.user_id, teamId: broker.team_id, teamName: team?.name || null, ticketMedio, participationPct: 0 };
    });

    const totalVGV = rankings.reduce((sum, b) => sum + b.revenue, 0);
    rankings.forEach(b => { b.participationPct = totalVGV > 0 ? (b.revenue / totalVGV) * 100 : 0; });
    return rankings.sort((a, b) => b.revenue - a.revenue || b.sales - a.sales).map((b, i) => ({ ...b, position: i + 1 }));
  }, [brokers, filteredSales, previousPeriodSales, effectiveTeamFilter, teams]);

  const activeBrokerCount = useMemo(() => brokers.filter(b => b.status === 'ativo').length, [brokers]);

  // Brokers excluding managers
  const brokerRankings: BrokerRanking[] = useMemo(() => {
    const filtered = allBrokerRankings.filter(b => !b.userId || !managerUserIds.includes(b.userId));
    const sorted = [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'sales': return b.sales - a.sales || b.revenue - a.revenue;
        case 'ticket': return (b.ticketMedio || 0) - (a.ticketMedio || 0);
        case 'growth': return (b.growth || -Infinity) - (a.growth || -Infinity);
        default: return b.revenue - a.revenue || b.sales - a.sales;
      }
    });
    return sorted.map((b, i) => ({ ...b, position: i + 1 }));
  }, [allBrokerRankings, managerUserIds, sortField]);

  // Captação rankings
  const captacaoRankings: BrokerRanking[] = useMemo(() => {
    const captadorMap = new Map<string, { name: string; count: number; vgv: number }>();
    const teamBrokerIds = effectiveTeamFilter !== 'all' ? new Set(brokers.filter(b => b.team_id === effectiveTeamFilter).map(b => b.id)) : null;
    filteredSales.forEach(sale => {
      if (!sale.captador || sale.captador.trim() === '') return;
      if (sale.status === 'cancelada' || sale.status === 'distrato') return;
      if (teamBrokerIds && sale.broker_id && !teamBrokerIds.has(sale.broker_id)) return;
      const captador = sale.captador.trim();
      const existing = captadorMap.get(captador) || { name: captador, count: 0, vgv: 0 };
      existing.count += 1;
      existing.vgv += Number(sale.vgv || sale.property_value || 0);
      captadorMap.set(captador, existing);
    });
    return Array.from(captadorMap.values()).sort((a, b) => b.vgv - a.vgv || b.count - a.count).map((cap, i) => {
      const matchedBroker = brokers.find(b => b.name.toLowerCase() === cap.name.toLowerCase());
      return { id: matchedBroker?.id || cap.name, name: cap.name, avatar: matchedBroker?.avatar_url || '', sales: cap.count, revenue: cap.vgv, position: i + 1, growth: null, email: matchedBroker?.email || '', userId: matchedBroker?.user_id || null, teamId: matchedBroker?.team_id || null };
    });
  }, [filteredSales, brokers, effectiveTeamFilter]);

  // Team rankings
  const teamRankings: TeamRanking[] = useMemo(() => {
    if (!isDiretor() && !isAdmin()) return [];
    return teams.map(team => {
      const teamBrokers = brokers.filter(b => b.team_id === team.id);
      const teamBrokerIds = teamBrokers.map(b => b.id);
      const teamSales = filteredSales.filter(s => 
        teamBrokerIds.includes(s.broker_id || '') && 
        s.status !== 'cancelada' && 
        s.status !== 'distrato' &&
        s.tipo === 'venda' &&
        s.parceria_tipo !== 'Agência'
      );
      const totalVGV = teamSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      return { id: team.id, name: team.name, totalVGV, totalSales: teamSales.length, brokerCount: teamBrokers.length, position: 0 };
    }).filter(t => t.totalSales > 0 || t.brokerCount > 0).sort((a, b) => b.totalVGV - a.totalVGV).map((t, i) => ({ ...t, position: i + 1 }));
  }, [teams, brokers, filteredSales, isDiretor, isAdmin]);

  const allBrokersForSpotlight = useMemo(() => brokers.map(b => ({ id: b.id, name: b.name })), [brokers]);
  const spotlightBroker = useMemo(() => {
    if (!spotlightBrokerId) return null;
    const ranked = brokerRankings.find(b => b.id === spotlightBrokerId);
    if (ranked) return ranked;
    const broker = brokers.find(b => b.id === spotlightBrokerId);
    if (!broker) return null;
    return { id: broker.id, name: broker.name, avatar: broker.avatar_url || '', sales: 0, revenue: 0, position: 0 };
  }, [spotlightBrokerId, brokerRankings, brokers]);

  const periodLabel = useMemo(() => {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const now = new Date();
    if (quickPeriod === 'today') return `Hoje — ${now.toLocaleDateString('pt-BR')}`;
    if (quickPeriod === 'week') return 'Última Semana';
    if (quickPeriod === 'quarter') return `${Math.floor(now.getMonth() / 3) + 1}º Trimestre ${now.getFullYear()}`;
    if (quickPeriod === 'year') return `Ano ${now.getFullYear()}`;
    if (quickPeriod === 'all') return 'Todos os Períodos';
    const month = selectedMonth > 0 ? selectedMonth : now.getMonth() + 1;
    const year = selectedYear > 0 ? selectedYear : now.getFullYear();
    return `${monthNames[month - 1]} ${year}`;
  }, [quickPeriod, selectedMonth, selectedYear]);

  const openTVMode = () => { setIsTVMode(true); document.documentElement.requestFullscreen?.().catch(() => {}); };
  const closeTVMode = () => { setIsTVMode(false); stopCustomSound(); document.exitFullscreen?.().catch(() => {}); };

  useEffect(() => {
    const handleFullscreenChange = () => { if (!document.fullscreenElement && isTVMode) setIsTVMode(false); };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isTVMode]);

  const handleQuickPeriod = (period: string) => {
    setQuickPeriod(period);
    if (period !== 'month') { setSelectedMonth(0); setSelectedYear(0); }
  };

  if (brokersLoading || salesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6"><RankingSkeleton /></div>
      </div>
    );
  }

  if (isTVMode) {
    return <RankingTVMode brokerRankings={brokerRankings} captacaoRankings={captacaoRankings} allBrokerRankings={allBrokerRankings} onClose={closeTVMode} sales={sales} tvRankingMode={tvRankingMode} periodLabel={periodLabel} spotlightBroker={spotlightBroker} slideInterval={tvSlideInterval} />;
  }

  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ConfettiCanvas active={showConfetti} />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-24 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            {effectiveLogo ? (
              <img src={effectiveLogo} alt={headerInfo.title} className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-xl lg:text-2xl font-black text-foreground flex items-center gap-2">
                {headerInfo.title}
                <Sparkles className="w-5 h-5 text-warning" />
              </h1>
              <p className="text-sm font-bold text-primary">{periodLabel}</p>
              <p className="text-xs text-muted-foreground">{headerInfo.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <Button variant={rankingType === 'vendas' ? 'default' : 'ghost'} size="sm" onClick={() => setRankingType('vendas')} className="text-xs h-7 px-3 rounded-md">Vendas</Button>
              <Button variant={rankingType === 'captacao' ? 'default' : 'ghost'} size="sm" onClick={() => setRankingType('captacao')} className="text-xs h-7 px-3 rounded-md">Captação</Button>
              {(isDiretor() || isAdmin()) && (
                <Button variant={rankingType === 'equipes' ? 'default' : 'ghost'} size="sm" onClick={() => setRankingType('equipes')} className="text-xs h-7 px-3 rounded-md">
                  <Building2 className="w-3.5 h-3.5 mr-1" />Equipes
                </Button>
              )}
              <Button variant={rankingType === 'atividades' ? 'default' : 'ghost'} size="sm" onClick={() => setRankingType('atividades')} className="text-xs h-7 px-3 rounded-md">
                <Activity className="w-3.5 h-3.5 mr-1" />Atividades
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className="h-9 w-9" title={soundEnabled ? "Desativar sons" : "Ativar sons"}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <div className="flex items-center gap-1">
              <Select value={tvRankingMode} onValueChange={(v) => setTVRankingMode(v as TVRankingMode)}>
                <SelectTrigger className="h-9 w-[140px] text-xs border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alternate">Alternar rankings</SelectItem>
                  <SelectItem value="vendas">Só Vendas</SelectItem>
                  <SelectItem value="captacao">Só Captação</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(tvSlideInterval)} onValueChange={handleSlideIntervalChange}>
                <SelectTrigger className="h-9 w-[90px] text-xs border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10s</SelectItem>
                  <SelectItem value="15">15s</SelectItem>
                  <SelectItem value="20">20s</SelectItem>
                  <SelectItem value="30">30s</SelectItem>
                  <SelectItem value="45">45s</SelectItem>
                  <SelectItem value="60">60s</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openTVMode} className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg text-sm h-9">
                <Tv className="w-4 h-4" />Modo TV
              </Button>
            </div>
          </div>
        </div>

        <QuickPeriodButtons activePeriod={quickPeriod} onPeriodChange={handleQuickPeriod} />

        {quickPeriod === 'month' && (
          <PeriodFilter selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} />
        )}

        {(isDiretor() || isAdmin()) && teamsForFilter.length > 0 && (
          <TeamFilter teams={teamsForFilter} selectedTeam={selectedTeam} onTeamChange={setSelectedTeam} />
        )}

        {rankingType !== 'atividades' && (
          <StatsHeader brokers={rankingType === 'captacao' ? captacaoRankings : allBrokerRankings} activeBrokerCount={activeBrokerCount} />
        )}

        {/* Activity ranking filters */}
        {rankingType === 'atividades' && (
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {([{ key: 'week' as const, label: 'Semanal' }, { key: 'month' as const, label: 'Mensal' }, { key: 'year' as const, label: 'Anual' }]).map(p => (
                <Button key={p.key} variant={activityPeriod === p.key ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-3" onClick={() => setActivityPeriod(p.key)}>{p.label}</Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={selectedActivityType === 'all' ? 'default' : 'outline'} size="sm" className="text-xs h-8" onClick={() => setSelectedActivityType('all')}>
                <BarChart3 className="w-3 h-3 mr-1" />Todas
              </Button>
              {activityNames.map(name => {
                const icons: Record<string, string> = { 'Ligações': '📞', 'Visitas': '🏠', 'Atendimentos': '🤝', 'Captações': '📋', 'Follow-ups': '🔄', 'Propostas': '📄' };
                return (
                  <Button key={name} variant={selectedActivityType === name ? 'default' : 'outline'} size="sm" className="text-xs h-8" onClick={() => setSelectedActivityType(name)}>
                    <span className="mr-1">{icons[name] || '📊'}</span>{name}
                  </Button>
                );
              })}
            </div>
            {activityInsight && (
              <Card className="p-4 border-warning/20 bg-warning/5">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-warning" />
                  <span className="text-xs font-bold text-warning uppercase tracking-wider">🔥 Corretor {activityPeriod === 'week' ? 'da Semana' : activityPeriod === 'month' ? 'do Mês' : 'do Ano'}</span>
                </div>
                <p className="text-sm text-foreground">{activityInsight.message}</p>
              </Card>
            )}
            {(isDiretor() || isAdmin() || isGerente()) && (
              <div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowWeightConfig(!showWeightConfig)}>
                  <Settings className="w-3 h-3 mr-1" />Configurar pesos
                </Button>
                {showWeightConfig && (
                  <Card className="p-4 mt-2 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Peso de cada atividade no ranking:</p>
                    {activityWeights.map((w, i) => (
                      <div key={w.name} className="flex items-center gap-3">
                        <span className="text-sm w-24">{w.icon} {w.name}</span>
                        <Select value={String(w.weight)} onValueChange={(v) => { const updated = [...activityWeights]; updated[i] = { ...w, weight: Number(v) }; saveActivityWeights(updated); }}>
                          <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {rankingType === 'atividades' ? (
              <>
                {activityRankings.length >= 1 && (
                  <Card className="p-4 md:p-6 mb-6 border-border/30 overflow-hidden relative bg-gradient-to-br from-card via-card to-primary/[0.03]">
                    <div className="relative mb-8">
                      <ParticleEffect />
                      <div className="flex items-end justify-center gap-4 md:gap-8 pt-8">
                        {(() => {
                          const top3 = activityRankings.slice(0, 3);
                          const podiumOrder = [top3.find(b => b.position === 2), top3.find(b => b.position === 1), top3.find(b => b.position === 3)].filter(Boolean);
                          const podiumConfig = [
                            { height: "h-32 md:h-40", avatarSize: "w-14 h-14 md:w-16 md:h-16", nameSize: "text-sm md:text-base", valueSize: "text-lg md:text-xl", ring: "ring-slate-300/60", numColor: "text-slate-300/70", numSize: "text-4xl md:text-5xl", glowColor: "rgba(15,78,216,0.35)", pedestalBg: "linear-gradient(180deg, #0F4ED8 0%, #0B3C8C 100%)", border: "border-[#0F4ED8]/40" },
                            { height: "h-44 md:h-56", avatarSize: "w-18 h-18 md:w-22 md:h-22", nameSize: "text-base md:text-lg", valueSize: "text-xl md:text-2xl", ring: "ring-yellow-400/70", numColor: "text-yellow-400/60", numSize: "text-5xl md:text-6xl", glowColor: "rgba(250,204,21,0.4)", pedestalBg: "linear-gradient(180deg, #0F4ED8 0%, #0B3C8C 100%)", border: "border-yellow-400/40" },
                            { height: "h-24 md:h-32", avatarSize: "w-12 h-12 md:w-14 md:h-14", nameSize: "text-xs md:text-sm", valueSize: "text-base md:text-lg", ring: "ring-orange-400/50", numColor: "text-slate-300/60", numSize: "text-3xl md:text-4xl", glowColor: "rgba(15,78,216,0.3)", pedestalBg: "linear-gradient(180deg, #0F4ED8 0%, #0B3C8C 100%)", border: "border-[#0F4ED8]/35" },
                          ];
                          return podiumOrder.map((entry: any, index: number) => {
                            const config = podiumConfig[index];
                            const isFirst = entry.position === 1;
                            const initials = entry.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
                            return (
                              <div key={entry.id} className="flex flex-col items-center animate-fade-in group">
                                {isFirst && <div className="relative mb-1 animate-medal-pulse"><Crown className="w-8 h-8 md:w-10 md:h-10 text-warning drop-shadow-[0_0_14px_rgba(250,204,21,0.7)]" /></div>}
                                <div className="relative mb-3">
                                  {isFirst && <div className="absolute -inset-5 rounded-full blur-2xl animate-spotlight-pulse" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 60%)` }} />}
                                  <Avatar className={cn(isFirst ? "w-16 h-16 md:w-20 md:h-20" : config.avatarSize, "ring-4 shadow-2xl relative z-10", config.ring)}>
                                    <AvatarImage src={entry.avatar} className="object-cover" />
                                    <AvatarFallback className={cn("font-black", isFirst ? "bg-gradient-to-br from-yellow-500 to-amber-700 text-yellow-100 text-xl" : "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100 text-sm")}>{initials}</AvatarFallback>
                                  </Avatar>
                                </div>
                                <p className={cn("font-bold text-center leading-tight text-foreground mb-0.5", config.nameSize)}>{entry.name.split(' ').slice(0, 2).join(' ')}</p>
                                <p className="text-[11px] text-muted-foreground mb-0.5">{entry.activityCount} atividades</p>
                                <p className={cn("font-black mb-2 tracking-tight", config.valueSize, isFirst ? "text-warning" : "text-foreground")}>{entry.weightedScore} pts</p>
                                <div className={cn("w-26 md:w-36 rounded-2xl border flex items-center justify-center relative overflow-hidden glass-pedestal pedestal-reflection", config.height, config.border)} style={{ boxShadow: `0 12px 40px -4px ${config.glowColor}`, background: config.pedestalBg }}>
                                  {isFirst && <div className="absolute inset-0 shimmer-effect" />}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-transparent rounded-2xl" />
                                  <span className={cn("font-black relative z-10", config.numColor, config.numSize)}>{entry.position}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="overflow-hidden border-border/50">
                  <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground text-sm">Classificação por Atividades</h2>
                    <Badge variant="secondary" className="ml-auto text-xs">{activityRankings.length} corretores</Badge>
                  </div>
                  <div className="p-3 space-y-2">
                    {activityRankings.length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">Nenhuma atividade registrada no período</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Registre atividades na tela de Atividades Semanais</p>
                      </div>
                    ) : (
                      activityRankings.map((entry) => {
                        const initials = entry.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                        const maxScore = activityRankings[0]?.weightedScore || 1;
                        const progressPct = (entry.weightedScore / maxScore) * 100;
                        const isCurrentUser = entry.userId === user?.id;
                        return (
                          <div key={entry.id} className={cn("flex flex-col gap-2 p-3 md:p-4 rounded-xl border transition-all group", isCurrentUser ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : entry.position <= 3 ? "bg-card/80 border-border/60 hover:border-primary/30" : "bg-card/50 border-border/50 hover:border-primary/20")}>
                            <div className="flex items-center gap-3">
                              <PositionBadge position={entry.position} />
                              <Avatar className="h-10 w-10 ring-2 ring-border/50"><AvatarImage src={entry.avatar} className="object-cover" /><AvatarFallback className="text-xs font-bold bg-muted">{initials}</AvatarFallback></Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-foreground truncate">{entry.name}</p>
                                  {isCurrentUser && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">⭐ VOCÊ</Badge>}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">{entry.activityCount} atividades</span>
                                  {entry.teamName && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/60">{entry.teamName}</Badge>}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-sm text-foreground">{entry.weightedScore} pts</p>
                                {entry.position === 1 && <span className="text-[10px] text-warning font-bold">🔥 Top 1</span>}
                              </div>
                            </div>
                            <div className="ml-[52px]"><Progress value={progressPct} className="h-1.5" /></div>
                            {selectedActivityType === 'all' && Object.keys(entry.breakdown).length > 0 && (
                              <div className="ml-[52px] flex flex-wrap gap-1">
                                {Object.entries(entry.breakdown).map(([name, count]) => {
                                  const icons: Record<string, string> = { 'Ligações': '📞', 'Visitas': '🏠', 'Atendimentos': '🤝', 'Captações': '📋', 'Follow-ups': '🔄', 'Propostas': '📄' };
                                  return <span key={name} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{icons[name] || '📊'} {name}: {count}</span>;
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </>
            ) : rankingType === 'equipes' ? (
              <>
                {teamRankings.length > 0 ? (
                  <>
                    <Card className="p-4 md:p-6 mb-6 border-border/30 overflow-hidden relative bg-gradient-to-br from-card via-card to-primary/[0.03]">
                      <div className="relative mb-6">
                        <ParticleEffect />
                        <div className="flex items-end justify-center gap-4 md:gap-8 pt-8">
                          {(() => {
                            const top3Teams = teamRankings.slice(0, 3);
                            const podiumTeams = [top3Teams.find(t => t.position === 2), top3Teams.find(t => t.position === 1), top3Teams.find(t => t.position === 3)].filter(Boolean) as TeamRanking[];
                            const podiumConfigs = [
                              { height: "h-32 md:h-40", avatarSize: "w-16 h-16 md:w-20 md:h-20", gradient: "from-slate-400/25 via-slate-400/15 to-transparent", border: "border-slate-300/40", ring: "ring-slate-300/60", numColor: "text-slate-300/60", numSize: "text-4xl md:text-5xl" },
                              { height: "h-40 md:h-52", avatarSize: "w-20 h-20 md:w-28 md:h-28", gradient: "from-yellow-500/25 via-yellow-500/10 to-transparent", border: "border-yellow-400/40", ring: "ring-yellow-400/70", numColor: "text-yellow-400/50", numSize: "text-5xl md:text-6xl" },
                              { height: "h-24 md:h-32", avatarSize: "w-14 h-14 md:w-16 md:h-16", gradient: "from-orange-500/20 via-orange-500/8 to-transparent", border: "border-orange-400/30", ring: "ring-orange-400/50", numColor: "text-orange-400/50", numSize: "text-3xl md:text-4xl" },
                            ];
                            return podiumTeams.map((team, index) => {
                              const config = podiumConfigs[index];
                              const isFirst = team.position === 1;
                              return (
                                <div key={team.id} className="flex flex-col items-center animate-fade-in">
                                  {isFirst && <div className="mb-1 animate-bounce" style={{ animationDuration: '2.5s' }}><Crown className="w-8 h-8 md:w-10 md:h-10 text-warning drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" /></div>}
                                  <div className="relative mb-2">
                                    {isFirst && <div className="absolute -inset-3 rounded-full bg-warning/15 blur-xl animate-pulse" />}
                                    <div className={cn(config.avatarSize, "rounded-full ring-4 shadow-2xl relative z-10 flex items-center justify-center", config.ring, isFirst ? "bg-gradient-to-br from-yellow-600 to-amber-800" : team.position === 2 ? "bg-gradient-to-br from-slate-500 to-slate-700" : "bg-gradient-to-br from-orange-600 to-orange-800")}>
                                      <Building2 className={cn("text-white/80", isFirst ? "w-8 h-8 md:w-10 md:h-10" : team.position === 2 ? "w-6 h-6 md:w-8 md:h-8" : "w-5 h-5 md:w-6 md:h-6")} />
                                    </div>
                                  </div>
                                  <p className={cn("font-bold text-center leading-tight text-foreground", isFirst ? "text-base md:text-lg" : "text-sm md:text-base")}>{team.name}</p>
                                  <p className="text-xs text-muted-foreground mb-0.5">{team.totalSales} vendas · {team.brokerCount} corretores</p>
                                  <p className={cn("font-black mb-2", isFirst ? "text-lg md:text-xl text-warning" : "text-base md:text-lg text-foreground")}>{formatCurrencyCompact(team.totalVGV)}</p>
                                  <div className={cn("w-24 md:w-32 rounded-t-xl border-2 flex items-center justify-center relative overflow-hidden", config.height, `bg-gradient-to-t ${config.gradient} ${config.border}`)}>
                                    {isFirst && <div className="absolute inset-0 shimmer-effect" />}
                                    <span className={cn("font-black relative z-10", config.numSize, config.numColor)}>{team.position}</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </Card>
                    <TeamRankingSection teamRankings={teamRankings} />
                  </>
                ) : (
                  <Card className="p-12 border-border/50 text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Nenhuma equipe encontrada no período</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Tente alterar o filtro de período</p>
                  </Card>
                )}
              </>
            ) : (
              <>
                {rankingType === 'vendas' && (isDiretor() || isAdmin()) && teamRankings.length > 0 && selectedTeam === 'all' && (
                  <TeamRankingSection teamRankings={teamRankings} />
                )}
                {(rankingType === 'captacao' ? captacaoRankings : brokerRankings).length >= 1 && (
                  <Card className="p-4 md:p-6 mb-6 border-border/30 overflow-hidden relative bg-gradient-to-br from-card via-card to-primary/[0.03]">
                    <AnimatedPodium brokers={rankingType === 'captacao' ? captacaoRankings : brokerRankings} currentUserId={user?.id} />
                  </Card>
                )}
                <div className="gradient-separator my-6 mx-8 rounded-full" />
                <Card className="overflow-hidden border-border/50">
                  <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Flame className="w-5 h-5 text-warning animate-medal-pulse" />
                      <h2 className="font-semibold text-foreground text-sm">{rankingType === 'captacao' ? 'Classificação Captadores' : 'Classificação Completa'}</h2>
                      <Badge variant="secondary" className="text-xs">{(rankingType === 'captacao' ? captacaoRankings : brokerRankings).length} {rankingType === 'captacao' ? 'captadores' : 'corretores'}</Badge>
                    </div>
                    {rankingType === 'vendas' && (
                      <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                        <SelectTrigger className="h-8 w-[160px] text-xs border-border/50 hover:border-primary/40 transition-colors backdrop-blur-sm bg-background/80">
                          <TrendingUp className="w-3 h-3 mr-1.5 text-muted-foreground" /><SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vgv">Ordenar por VGV</SelectItem>
                          <SelectItem value="sales">Ordenar por Vendas</SelectItem>
                          <SelectItem value="ticket">Ordenar por Ticket</SelectItem>
                          <SelectItem value="growth">Ordenar por Crescimento</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    {(() => {
                      const currentList = rankingType === 'captacao' ? captacaoRankings : brokerRankings;
                      const displayList = isExpanded ? currentList : currentList.slice(0, 10);
                      const hasMore = currentList.length > 10;
                      return (
                        <>
                          {displayList.map((broker) => (
                            <LeaderboardCard key={broker.id} broker={broker} allBrokers={currentList} currentUserId={user?.id} showProgressBar={broker.position > 1} />
                          ))}
                          {hasMore && !isExpanded && (
                            <Button variant="ghost" className="w-full mt-2 text-sm text-primary hover:text-primary/80" onClick={() => setIsExpanded(true)}>
                              <ChevronDown className="w-4 h-4 mr-1" />Ver ranking completo ({currentList.length - 10} restantes)
                            </Button>
                          )}
                          {isExpanded && hasMore && (
                            <Button variant="ghost" className="w-full mt-2 text-sm text-muted-foreground" onClick={() => setIsExpanded(false)}>
                              <ChevronUp className="w-4 h-4 mr-1" />Recolher
                            </Button>
                          )}
                          {currentList.length === 0 && (
                            <div className="text-center py-12">
                              <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                              <p className="text-muted-foreground font-medium">{rankingType === 'captacao' ? 'Nenhuma captação encontrada no período' : 'Nenhum corretor encontrado no período'}</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">Tente alterar o filtro de período</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </Card>
              </>
            )}
          </div>

          {rankingType !== 'equipes' && rankingType !== 'atividades' && (
            <div className="w-full lg:w-72 shrink-0">
              <SpotlightBrokerSidebar broker={spotlightBroker} allBrokers={brokerRankings} canManage={canManageSpotlight} availableBrokers={allBrokersForSpotlight} onChangeBroker={setSpotlightBroker} isUpdating={spotlightUpdating} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.5; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .shimmer-effect {
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.1) 37%, transparent 63%);
          background-size: 200% 100%;
          animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .glass-pedestal {
          backdrop-filter: blur(16px);
        }
        .pedestal-reflection::after {
          content: '';
          position: absolute;
          bottom: -40%;
          left: 10%;
          right: 10%;
          height: 40%;
          border-radius: 50%;
          background: inherit;
          opacity: 0.15;
          filter: blur(8px);
          transform: scaleY(-1);
        }
        .gradient-separator {
          height: 2px;
          background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), hsl(var(--warning) / 0.3), hsl(var(--primary) / 0.3), transparent);
        }
      `}</style>
    </div>
  );
};

export default Ranking;
