import React, { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useCalendarEvents, CalendarEvent as CalEvent } from '@/hooks/useCalendarEvents';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useGoals } from '@/hooks/useGoals';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatting';
import { getHotNegotiations, getProbabilityColor, getProbabilityProgressColor } from '@/utils/negotiationProbability';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import {
  Zap, UserPlus, Phone, Target, Flame, Trophy, Clock,
  CheckSquare, Square, ChevronRight, Calendar, MapPin,
  Users, RotateCcw, FileText, BarChart3, TrendingUp,
  DollarSign, Lightbulb, X, AlertTriangle, Eye,
  MessageCircle, Award, Briefcase, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GerenteDashboard = () => {
  const { profile, user, teamHierarchy } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { negotiations } = useNegotiations();
  const { followUps } = useFollowUps();
  const { goals } = useGoals();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [focusMode, setFocusMode] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const { events } = useCalendarEvents(today, today);
  const { googleEvents, isConnected } = useGoogleCalendar(today, today);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Team brokers
  const teamBrokers = useMemo(() =>
    (brokers || []).filter(b =>
      teamHierarchy?.team_members?.includes(b.user_id || '') || b.team_id === teamHierarchy?.team_id
    ), [brokers, teamHierarchy]);

  const activeTeamBrokers = teamBrokers.filter(b => b.status === 'ativo');

  // Team sales this month
  const teamBrokerIds = useMemo(() => new Set(teamBrokers.map(b => b.id)), [teamBrokers]);

  const teamSales = useMemo(() =>
    (sales || []).filter(s => teamBrokerIds.has(s.broker_id || '') && s.status !== 'distrato'),
    [sales, teamBrokerIds]);

  const monthSales = useMemo(() =>
    teamSales.filter(s => {
      const d = new Date(s.sale_date || s.created_at || '');
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }), [teamSales, currentMonth, currentYear]);

  const monthVGV = monthSales.reduce((sum, s) => sum + (s.vgv || 0), 0);
  const monthVGC = monthSales.reduce((sum, s) => sum + (s.vgc || 0), 0);

  // Team negotiations
  const teamNegotiations = useMemo(() =>
    (negotiations || []).filter(n => teamBrokerIds.has(n.broker_id)), [negotiations, teamBrokerIds]);
  const activeNegotiations = teamNegotiations.filter(n => !['perdida', 'cancelada', 'ganha'].includes(n.status));
  const hotNegotiations = getHotNegotiations(activeNegotiations, 5);

  // Team follow-ups
  const teamFollowUps = useMemo(() =>
    (followUps || []).filter(f => teamBrokerIds.has(f.broker_id)), [followUps, teamBrokerIds]);
  const pendingFollowUps = teamFollowUps.filter(f => f.status !== 'convertido' && f.status !== 'perdido');

  // Today events - merge internal + Google Calendar
  const todayEvents: CalEvent[] = useMemo(() => {
    const internal = events || [];
    const mappedGoogle: CalEvent[] = googleEvents.map((ge) => {
      const startDate = ge.start.includes('T') ? ge.start.substring(0, 10) : ge.start;
      const startTime = ge.start.includes('T') ? ge.start.substring(11, 16) : null;
      const endTime = ge.end.includes('T') ? ge.end.substring(11, 16) : null;
      return {
        id: `google-${ge.id}`,
        user_id: '',
        company_id: null,
        title: `📅 ${ge.summary}`,
        description: ge.description || null,
        event_date: startDate,
        start_time: startTime,
        end_time: endTime,
        event_type: 'outro',
        responsible_id: null,
        client_name: ge.location || null,
        property_reference: null,
        is_private: false,
        is_all_day: !ge.start.includes('T'),
        color: '#4285F4',
        created_at: '',
        updated_at: '',
      };
    });
    return [...internal, ...mappedGoogle].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [events, googleEvents]);

  // Team goals - filter active goals belonging to this team
  const teamGoals = useMemo(() => {
    const nowStr = format(new Date(), 'yyyy-MM-dd');
    console.log('[GerenteDashboard] All goals:', goals?.length, 'teamId:', teamHierarchy?.team_id, 'userId:', user?.id);
    const filtered = (goals || []).filter(g => {
      if (g.status !== 'active') return false;
      // Must belong to this team OR be assigned to the manager OR created by the manager
      const belongsToTeam = g.team_id && g.team_id === teamHierarchy?.team_id;
      const assignedToManager = g.assigned_to === user?.id;
      const createdByManager = g.created_by === user?.id;
      if (!belongsToTeam && !assignedToManager && !createdByManager) return false;
      // Must be within the goal's date range
      if (g.start_date > nowStr || g.end_date < nowStr) return false;
      return true;
    });
    console.log('[GerenteDashboard] Filtered goals:', filtered.map(g => ({ id: g.id, title: g.title, team_id: g.team_id, start: g.start_date, end: g.end_date, type: g.target_type, period: g.period_type })));
    return filtered;
  }, [goals, teamHierarchy, user?.id]);

  // Separate monthly and annual goals
  const monthlyGoal = useMemo(() => {
    const monthly = teamGoals.filter(g => g.period_type === 'monthly');
    return monthly.find(g => g.target_type === 'vgv') || monthly[0] || null;
  }, [teamGoals]);

  const annualGoal = useMemo(() => {
    const annual = teamGoals.filter(g => g.period_type === 'yearly');
    return annual.find(g => g.target_type === 'vgv') || annual[0] || null;
  }, [teamGoals]);

  // Fallback: if no monthly/annual split, use any goal as primary
  const primaryGoal = monthlyGoal || teamGoals.find(g => g.target_type === 'vgv') || teamGoals[0] || null;
  const goalProgress = primaryGoal ? Math.min((primaryGoal.current_value / primaryGoal.target_value) * 100, 100) : 0;
  const annualProgress = annualGoal ? Math.min((annualGoal.current_value / annualGoal.target_value) * 100, 100) : 0;

  // Broker performance ranking
  const brokerPerformance = useMemo(() => {
    return activeTeamBrokers.map(broker => {
      const bSales = monthSales.filter(s => s.broker_id === broker.id);
      const vgv = bSales.reduce((sum, s) => sum + (s.vgv || 0), 0);
      const bNeg = activeNegotiations.filter(n => n.broker_id === broker.id);
      const bFollowUps = pendingFollowUps.filter(f => f.broker_id === broker.id);
      return {
        id: broker.id,
        name: broker.name,
        salesCount: bSales.length,
        vgv,
        negotiations: bNeg.length,
        followUps: bFollowUps.length,
        avatar_url: broker.avatar_url,
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [activeTeamBrokers, monthSales, activeNegotiations, pendingFollowUps]);

  // Alerts: brokers with no activity
  const brokersWithoutSales = brokerPerformance.filter(b => b.salesCount === 0 && b.negotiations === 0);

  // Funnel data (team-wide)
  const funnelData = [
    { label: 'Leads', value: teamFollowUps.length, color: 'bg-blue-500' },
    { label: 'Atendimento', value: activeNegotiations.length, color: 'bg-cyan-500' },
    { label: 'Visitas', value: activeNegotiations.filter(n => n.status === 'visita_realizada' || n.status === 'em_negociacao').length, color: 'bg-emerald-500' },
    { label: 'Propostas', value: activeNegotiations.filter(n => n.status === 'proposta_enviada' || n.status === 'em_negociacao').length, color: 'bg-purple-500' },
    { label: 'Fechados', value: monthSales.length, color: 'bg-amber-500' },
  ];
  const maxFunnel = Math.max(...funnelData.map(f => f.value), 1);

  // Ticket médio
  const ticketMedio = monthSales.length > 0 ? monthVGV / monthSales.length : 0;
  const conversionRate = teamFollowUps.length > 0 ? Math.round((monthSales.length / teamFollowUps.length) * 100) : 0;

  // Sections
  const focusSections = ['kpis', 'alerts', 'ranking', 'negotiations'];
  const allSections = ['kpis', 'alerts', 'agenda', 'ranking', 'negotiations', 'goal', 'funnel', 'metrics', 'opportunities'];
  const sections = focusMode ? focusSections : allSections;

  const kpiCards = [
    { label: 'Vendas do Mês', value: monthSales.length.toString(), sub: `VGV: ${formatCurrency(monthVGV)}`, icon: DollarSign, gradient: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30', iconColor: 'text-emerald-400' },
    { label: 'Corretores Ativos', value: activeTeamBrokers.length.toString(), sub: `de ${teamBrokers.length} na equipe`, icon: Users, gradient: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30', iconColor: 'text-blue-400' },
    { label: 'Negociações Ativas', value: activeNegotiations.length.toString(), sub: `${hotNegotiations.length} quentes`, icon: Flame, gradient: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/30', iconColor: 'text-orange-400' },
    { label: 'Follow-ups Pendentes', value: pendingFollowUps.length.toString(), sub: `${teamFollowUps.length} total`, icon: RotateCcw, gradient: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30', iconColor: 'text-purple-400' },
  ];

  const eventTypeColors: Record<string, string> = {
    visita: '#10b981', captacao: '#10b981', reuniao: '#8b5cf6', meta: '#8b5cf6',
    follow_up: '#f59e0b', lembrete: '#3b82f6', venda: '#06b6d4', outro: '#6b7280',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-5 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Central do Gestor
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestão da equipe <strong className="text-foreground">{teamHierarchy?.team_name || 'Sua Equipe'}</strong> — {format(new Date(), "dd/MM/yyyy")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={focusMode ? 'default' : 'outline'}
                size="sm"
                className={cn("gap-1.5 transition-all", focusMode && "bg-amber-500 hover:bg-amber-600 text-white")}
                onClick={() => setFocusMode(!focusMode)}
              >
                {focusMode ? <X className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                {focusMode ? 'Sair do Foco' : 'Modo Foco'}
              </Button>
              {!focusMode && (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => navigate('/corretores')}>
                    <Users className="w-3.5 h-3.5" /> Minha Equipe
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 border-blue-500/20 text-blue-400 hover:bg-blue-500/10" onClick={() => navigate('/negociacoes')}>
                    <Briefcase className="w-3.5 h-3.5" /> Negociações
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Focus mode banner */}
          {focusMode && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-200">
                <strong>Modo Foco ativo</strong> — KPIs, alertas, ranking da equipe e negociações quentes.
              </p>
            </div>
          )}

          {/* KPI Cards */}
          {sections.includes('kpis') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpiCards.map(card => (
                <div key={card.label} className={`relative overflow-hidden rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4 transition-all hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                    </div>
                    <card.icon className={`w-8 h-8 ${card.iconColor} opacity-80`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alerts: Brokers without activity */}
          {sections.includes('alerts') && brokersWithoutSales.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Atenção — Corretores sem atividade
              </h2>
              <div className="flex flex-wrap gap-2">
                {brokersWithoutSales.map(b => (
                  <Badge key={b.id} variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 py-1 px-3">
                    {b.name.split(' ')[0]} — 0 vendas, 0 negociações
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Alert: Brokers with negotiations but no sales this month */}
          {sections.includes('alerts') && (() => {
            const activeBrokersNoSales = brokerPerformance.filter(b => b.salesCount === 0 && b.negotiations > 0);
            return activeBrokersNoSales.length > 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-amber-400" /> Atenção — Corretores sem vendas no mês
                </h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Estes corretores possuem negociações ativas mas ainda não fecharam vendas este mês.
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeBrokersNoSales.map(b => (
                    <Badge key={b.id} variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 py-1 px-3">
                      {b.name.split(' ')[0]} — {b.negotiations} negociação(ões)
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          <div className={cn("grid gap-4", sections.includes('negotiations') && sections.includes('agenda') ? "lg:grid-cols-2" : "lg:grid-cols-1")}>

            {/* Agenda do Dia */}
            {sections.includes('agenda') && (
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Agenda do Dia
                  </h2>
                  <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate('/agenda')}>
                    Ver tudo <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                {todayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum compromisso hoje</p>
                ) : (
                  <div className="space-y-2">
                    {todayEvents.slice(0, 5).map(event => {
                      const color = eventTypeColors[event.event_type] || '#3b82f6';
                      return (
                        <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate('/agenda')}>
                          <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                            {event.start_time?.slice(0, 5) || '—'}
                          </span>
                          <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color }}>{event.title}</p>
                            {event.client_name && <p className="text-xs text-muted-foreground truncate">{event.client_name}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Negociações Quentes da Equipe */}
            {sections.includes('negotiations') && (
              <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" /> Negociações Quentes
                  </h2>
                  <Button variant="ghost" size="sm" className="text-xs text-orange-400" onClick={() => navigate('/negociacoes')}>
                    Ver todas <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                {hotNegotiations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma negociação ativa</p>
                ) : (
                  <div className="space-y-2">
                    {hotNegotiations.map((neg) => {
                      const broker = teamBrokers.find(b => b.id === neg.broker_id);
                      const chance = neg.closingProbability;
                      return (
                        <div key={neg.id} className="p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-all cursor-pointer" onClick={() => navigate('/negociacoes')}>
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{neg.client_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {broker?.name?.split(' ')[0] || '—'} • {neg.property_address}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-foreground">{formatCurrency(neg.negotiated_value)}</span>
                              <Badge variant="outline" className={`text-[10px] ${getProbabilityColor(chance)}`}>
                                {chance}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={chance} className={`h-1.5 mt-2 ${getProbabilityProgressColor(chance)}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ranking da Equipe */}
          {sections.includes('ranking') && (
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Ranking da Equipe — Mês Atual
                </h2>
                <Button variant="ghost" size="sm" className="text-xs text-amber-400" onClick={() => navigate('/ranking')}>
                  Ver ranking completo <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {brokerPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum corretor na equipe</p>
              ) : (
                <div className="space-y-2">
                  {brokerPerformance.map((broker, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const maxVGV = brokerPerformance[0]?.vgv || 1;
                    const barWidth = Math.max((broker.vgv / maxVGV) * 100, 5);
                    return (
                      <div key={broker.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-all">
                        <span className="text-sm w-6 text-center shrink-0">{idx < 3 ? medals[idx] : `${idx + 1}º`}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground truncate">{broker.name}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span>{broker.salesCount} vendas</span>
                              <span>{broker.negotiations} neg.</span>
                              <span className="font-semibold text-foreground">{formatCurrency(broker.vgv)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-600" : "bg-primary/50"
                              )}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Goal Row - Monthly + Annual */}
          {!focusMode && sections.includes('goal') && (
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Meta Mensal */}
              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-primary" /> Meta Mensal
                </h2>
                {primaryGoal ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{primaryGoal.title}</p>
                      <p className="text-3xl font-bold text-foreground">{formatCurrency(primaryGoal.current_value)}</p>
                      <p className="text-xs text-muted-foreground">de {formatCurrency(primaryGoal.target_value)}</p>
                    </div>
                    <Progress value={goalProgress} className="h-3" />
                    <div className="flex justify-between text-xs">
                      <span className="text-primary font-semibold">{Math.round(goalProgress)}% concluído</span>
                      <span className="text-muted-foreground">
                        Faltam: {formatCurrency(Math.max(primaryGoal.target_value - primaryGoal.current_value, 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(monthVGV)}</p>
                    <p className="text-xs text-muted-foreground">VGV da equipe no mês • {monthSales.length} vendas</p>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 border-primary/30 text-primary" onClick={() => navigate('/meta-gestao')}>
                      <Target className="w-3 h-3" /> Cadastrar meta em Meta Gestão
                    </Button>
                  </div>
                )}
              </div>

              {/* Meta Anual */}
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-5">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Meta Anual
                </h2>
                {annualGoal ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{annualGoal.title}</p>
                      <p className="text-3xl font-bold text-foreground">{formatCurrency(annualGoal.current_value)}</p>
                      <p className="text-xs text-muted-foreground">de {formatCurrency(annualGoal.target_value)}</p>
                    </div>
                    <Progress value={annualProgress} className="h-3" />
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-semibold">{Math.round(annualProgress)}% concluído</span>
                      <span className="text-muted-foreground">
                        Faltam: {formatCurrency(Math.max(annualGoal.target_value - annualGoal.current_value, 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-3xl font-bold text-foreground">
                      {formatCurrency(teamSales.filter(s => {
                        const d = new Date(s.sale_date || s.created_at || '');
                        return d.getFullYear() === currentYear;
                      }).reduce((sum, s) => sum + (s.vgv || 0), 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">VGV acumulado em {currentYear}</p>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 border-emerald-500/30 text-emerald-400" onClick={() => navigate('/meta-gestao')}>
                      <TrendingUp className="w-3 h-3" /> Cadastrar meta anual
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Funil da Equipe */}
          {!focusMode && sections.includes('funnel') && (
            <div className="rounded-xl border border-border bg-card/50 p-5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" /> Funil de Vendas da Equipe
              </h2>
              <div className="space-y-3">
                {funnelData.map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 text-right">{item.label}</span>
                    <div className="flex-1 bg-muted/30 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2 transition-all`}
                        style={{ width: `${Math.max((item.value / maxFunnel) * 100, 8)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {!focusMode && sections.includes('metrics') && (
            <div className="rounded-xl border border-border bg-card/50 p-5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" /> Métricas Consolidadas
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(ticketMedio)}</p>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {activeTeamBrokers.length > 0 ? (monthSales.length / activeTeamBrokers.length).toFixed(1) : '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">Vendas/Corretor</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(monthVGC)}</p>
                  <p className="text-xs text-muted-foreground">Comissões do Mês</p>
                </div>
              </div>
            </div>
          )}

          {/* Opportunities */}
          {!focusMode && sections.includes('opportunities') && (
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-cyan-400" /> Visão Geral
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{pendingFollowUps.length}</p>
                  <p className="text-xs text-muted-foreground">Leads pendentes</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{activeNegotiations.length}</p>
                  <p className="text-xs text-muted-foreground">Negociações ativas</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{todayEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Compromissos hoje</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{brokersWithoutSales.length}</p>
                  <p className="text-xs text-muted-foreground">Corretores parados</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GerenteDashboard;
