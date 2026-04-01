import React, { useState, useMemo } from 'react';
import { OriginAnalyticsDashboard } from '@/components/dashboards/OriginAnalyticsDashboard';
import ConsolidatedAlerts from '@/components/dashboards/ConsolidatedAlerts';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useCalendarEvents, CalendarEvent as CalEvent } from '@/hooks/useCalendarEvents';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useData } from '@/contexts/DataContext';
import { format, getDaysInMonth, getDate, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatting';
import { getHotNegotiations, getProbabilityColor, getProbabilityProgressColor } from '@/utils/negotiationProbability';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import MonthlyGoalPanel from '@/components/goals/MonthlyGoalPanel';
import AnnualGoalPanel from '@/components/goals/AnnualGoalPanel';
import { motion } from 'framer-motion';
import {
  Zap, UserPlus, Phone, Target, Flame, Trophy, Clock,
  CheckSquare, Square, ChevronRight, ChevronDown, ChevronUp,
  Calendar, MapPin,
  Users, RotateCcw, FileText, BarChart3, TrendingUp,
  DollarSign, Lightbulb, X, AlertTriangle, Eye,
  MessageCircle, Award, Briefcase, Activity, Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

const GerenteDashboard = () => {
  const { profile, user, teamHierarchy } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { negotiations } = useNegotiations();
  const { followUps } = useFollowUps();
  const { targets } = useData();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [focusMode, setFocusMode] = useState(false);
  const [rankingExpanded, setRankingExpanded] = useState(false);

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
    (sales || []).filter(s => teamBrokerIds.has(s.broker_id || '') && s.status !== 'distrato' && s.status !== 'cancelada' && s.tipo !== 'captacao'),
    [sales, teamBrokerIds]);

  const monthSales = useMemo(() =>
    teamSales.filter(s => {
      const dateStr = s.sale_date || (s.created_at ? s.created_at.substring(0, 10) : '');
      if (!dateStr) return false;
      const parts = dateStr.substring(0, 10).split('-');
      return parseInt(parts[1], 10) === currentMonth && parseInt(parts[0], 10) === currentYear;
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
        title: ge.summary,
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

  // Team targets from the targets table
  const monthlyTarget = useMemo(() => {
    return (targets || []).find(t => 
      t.month === currentMonth && 
      t.year === currentYear &&
      (t.team_id === teamHierarchy?.team_id || (!t.team_id && !t.broker_id))
    );
  }, [targets, currentMonth, currentYear, teamHierarchy?.team_id]);

  // Load annual goal from month=0 target (independent from monthly)
  const annualTargetValue = useMemo(() => {
    const annualRecord = (targets || []).find(t => 
      t.year === currentYear &&
      t.month === 0 &&
      t.broker_id === null &&
      (t.team_id === teamHierarchy?.team_id || (!t.team_id && !t.broker_id))
    );
    return annualRecord?.target_value || 0;
  }, [targets, currentYear, teamHierarchy?.team_id]);

  // Calculate actual progress from sales data
  const monthlyAchieved = monthVGV;
  const monthlyTargetValue = monthlyTarget?.target_value || 0;
  const goalProgress = monthlyTargetValue > 0 ? Math.min((monthlyAchieved / monthlyTargetValue) * 100, 100) : 0;
  
  const yearVGV = useMemo(() => 
    teamSales.filter(s => {
      const dateStr = s.sale_date || (s.created_at ? s.created_at.substring(0, 10) : '');
      if (!dateStr) return false;
      return parseInt(dateStr.substring(0, 4), 10) === currentYear;
    }).reduce((sum, s) => sum + (s.vgv || 0), 0),
    [teamSales, currentYear]
  );
  const annualAchieved = yearVGV;
  const annualProgress = annualTargetValue > 0 ? Math.min((annualAchieved / annualTargetValue) * 100, 100) : 0;

  // Smart goal insights
  const goalInsights = useMemo(() => {
    if (monthlyTargetValue <= 0) return null;
    const now = new Date();
    const totalDays = getDaysInMonth(now);
    const daysPassed = getDate(now);
    const daysRemaining = totalDays - daysPassed;
    const remaining = Math.max(0, monthlyTargetValue - monthlyAchieved);
    const ticketMedioValue = monthSales.length > 0 ? monthVGV / monthSales.length : 0;
    const salesNeeded = ticketMedioValue > 0 ? Math.ceil(remaining / ticketMedioValue) : 0;
    const dailyAvg = daysPassed > 0 ? monthlyAchieved / daysPassed : 0;
    const projectedDate = dailyAvg > 0 && remaining > 0
      ? addDays(now, Math.ceil(remaining / dailyAvg))
      : null;
    const isGoalMet = monthlyAchieved >= monthlyTargetValue;

    return { salesNeeded, projectedDate, remaining, isGoalMet, ticketMedioValue, daysRemaining };
  }, [monthlyTargetValue, monthlyAchieved, monthSales, monthVGV]);

  // Broker performance ranking
  const brokerPerformance = useMemo(() => {
    return activeTeamBrokers.map(broker => {
      const bSales = monthSales.filter(s => s.broker_id === broker.id);
      const allBrokerSales = teamSales.filter(s => s.broker_id === broker.id);
      const vgv = bSales.reduce((sum, s) => sum + (s.vgv || 0), 0);
      const bNeg = activeNegotiations.filter(n => n.broker_id === broker.id);
      const bFollowUps = pendingFollowUps.filter(f => f.broker_id === broker.id);
      
      const lastSaleDate = allBrokerSales.length > 0
        ? Math.max(...allBrokerSales.map(s => new Date(s.sale_date || s.created_at || '').getTime()))
        : null;
      const daysSinceLastSale = lastSaleDate
        ? Math.floor((Date.now() - lastSaleDate) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: broker.id,
        name: broker.name,
        salesCount: bSales.length,
        vgv,
        negotiations: bNeg.length,
        followUps: bFollowUps.length,
        avatar_url: broker.avatar_url,
        daysSinceLastSale,
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [activeTeamBrokers, monthSales, teamSales, activeNegotiations, pendingFollowUps]);

  // Alerts data
  const brokersWithoutSalesData = brokerPerformance.filter(b => b.salesCount === 0 && b.negotiations === 0);
  const activeBrokersNoSales = brokerPerformance.filter(b => b.salesCount === 0 && b.negotiations > 0);
  const inactiveBrokers = brokerPerformance.filter(b => 
    b.daysSinceLastSale !== null && b.daysSinceLastSale >= 5
  );

  // Funnel data
  const funnelData = [
    { label: 'Leads', value: teamFollowUps.length, color: 'bg-primary' },
    { label: 'Atendimento', value: activeNegotiations.length, color: 'bg-info' },
    { label: 'Visitas', value: activeNegotiations.filter(n => n.status === 'visita_realizada' || n.status === 'em_negociacao').length, color: 'bg-success' },
    { label: 'Propostas', value: activeNegotiations.filter(n => n.status === 'proposta_enviada' || n.status === 'em_negociacao').length, color: 'bg-accent-foreground/60' },
    { label: 'Fechados', value: monthSales.length, color: 'bg-warning' },
  ];
  const maxFunnel = Math.max(...funnelData.map(f => f.value), 1);

  // Ticket médio
  const ticketMedio = monthSales.length > 0 ? monthVGV / monthSales.length : 0;
  const conversionRate = teamFollowUps.length > 0 ? Math.round((monthSales.length / teamFollowUps.length) * 100) : 0;

  // Sections
  const focusSections = ['kpis', 'alerts', 'goal', 'ranking', 'negotiations'];
  const allSections = ['kpis', 'alerts', 'goal', 'agenda', 'negotiations', 'ranking', 'funnel', 'metrics', 'opportunities'];
  const sections = focusMode ? focusSections : allSections;

  const kpiCards = [
    { label: 'Vendas do Mês', value: monthSales.length.toString(), sub: `VGV: ${formatCurrency(monthVGV)}`, icon: DollarSign, gradient: 'from-success/20 to-success/5', border: 'border-success/30', iconColor: 'text-success' },
    { label: 'Corretores Ativos', value: activeTeamBrokers.length.toString(), sub: `de ${teamBrokers.length} na equipe`, icon: Users, gradient: 'from-primary/20 to-primary/5', border: 'border-primary/30', iconColor: 'text-primary' },
    { label: 'Negociações Ativas', value: activeNegotiations.length.toString(), sub: `${hotNegotiations.length} quentes`, icon: Flame, gradient: 'from-warning/20 to-warning/5', border: 'border-warning/30', iconColor: 'text-warning' },
    { label: 'Follow-ups Pendentes', value: pendingFollowUps.length.toString(), sub: `${teamFollowUps.length} total`, icon: RotateCcw, gradient: 'from-accent-foreground/15 to-accent-foreground/5', border: 'border-accent-foreground/20', iconColor: 'text-accent-foreground/70' },
  ];

  const eventTypeColors: Record<string, string> = {
    visita: 'hsl(var(--success))', captacao: 'hsl(var(--success))', reuniao: 'hsl(var(--primary))', meta: 'hsl(var(--primary))',
    follow_up: 'hsl(var(--warning))', lembrete: 'hsl(var(--info))', venda: 'hsl(var(--info))', outro: 'hsl(var(--muted-foreground))',
  };

  const medalIcons = [Trophy, Award, Award];
  const medalColors = ['text-warning', 'text-muted-foreground', 'text-orange-600'];

  let sectionIndex = 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-5 max-w-7xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-3"
          >
            <div className="text-center sm:text-left w-full lg:w-auto">
              <h1 className="text-xl lg:text-3xl font-bold text-foreground">
                Central do Gestor
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                Equipe <strong className="text-foreground">{teamHierarchy?.team_name || 'Sua Equipe'}</strong> — {format(new Date(), "dd/MM/yyyy")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 w-full lg:w-auto">
              <Button
                variant={focusMode ? 'default' : 'outline'}
                size="sm"
                className={cn("gap-1.5 transition-all", focusMode && "bg-warning hover:bg-warning/90 text-warning-foreground")}
                onClick={() => setFocusMode(!focusMode)}
              >
                {focusMode ? <X className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                {focusMode ? 'Sair do Foco' : 'Modo Foco'}
              </Button>
              {!focusMode && (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 border-success/20 text-success hover:bg-success/10" onClick={() => navigate('/corretores')}>
                    <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Minha</span> Equipe
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 border-primary/20 text-primary hover:bg-primary/10" onClick={() => navigate('/negociacoes')}>
                    <Briefcase className="w-3.5 h-3.5" /> Negociações
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Mobile Quick Actions */}
          {isMobile && !focusMode && (
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}
              className="grid grid-cols-4 gap-2"
            >
              {[
                { icon: DollarSign, label: 'Venda', color: 'text-success bg-success/10 border-success/20', route: '/vendas' },
                { icon: Briefcase, label: 'Negociação', color: 'text-primary bg-primary/10 border-primary/20', route: '/negociacoes' },
                { icon: Calendar, label: 'Agenda', color: 'text-accent-foreground bg-accent/50 border-accent', route: '/agenda' },
                { icon: MessageCircle, label: 'Follow-up', color: 'text-warning bg-warning/10 border-warning/20', route: '/follow-up' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border transition-all active:scale-95", action.color)}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{action.label}</span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Focus mode banner */}
          {focusMode && (
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}
              className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-center gap-3"
            >
              <Zap className="w-5 h-5 text-warning shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Modo Foco ativo</strong> — KPIs, metas, alertas, ranking e negociações quentes.
              </p>
            </motion.div>
          )}

          {/* 1. KPI Cards */}
          {sections.includes('kpis') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
              {kpiCards.map((card, idx) => (
                <motion.div
                  key={card.label}
                  variants={fadeUp} initial="hidden" animate="visible" custom={idx}
                  className={`relative overflow-hidden rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-3 lg:p-4 transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] lg:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{card.label}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-foreground mt-0.5 lg:mt-1 tabular-nums">{card.value}</p>
                      <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 truncate">{card.sub}</p>
                    </div>
                    <card.icon className={`w-6 h-6 lg:w-8 lg:h-8 ${card.iconColor} opacity-80 shrink-0`} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 2. Consolidated Alerts */}
          {sections.includes('alerts') && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}>
              <ConsolidatedAlerts
                brokersWithoutActivity={brokersWithoutSalesData}
                brokersWithoutSales={activeBrokersNoSales}
                inactiveBrokers={inactiveBrokers}
              />
            </motion.div>
          )}

          {/* 3. Goal Panel — Monthly + Annual + Smart Insights */}
          {sections.includes('goal') && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++} className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <MonthlyGoalPanel
                  targetValue={monthlyTargetValue}
                  achievedValue={monthlyAchieved}
                />
                <AnnualGoalPanel
                  targetValue={annualTargetValue}
                  achievedValue={annualAchieved}
                  year={currentYear}
                />
              </div>

              {/* Smart Insights */}
              {goalInsights && monthlyTargetValue > 0 && (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Rocket className="w-4 h-4 text-primary" /> Inteligência de Meta
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {goalInsights.isGoalMet ? (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center col-span-full">
                        <p className="text-sm font-bold text-success flex items-center justify-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          Meta atingida! Superado em {formatCurrency(monthlyAchieved - monthlyTargetValue)}
                        </p>
                      </div>
                    ) : (
                      <>
                        {goalInsights.salesNeeded > 0 && goalInsights.ticketMedioValue > 0 && (
                          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                            <p className="text-xs text-muted-foreground">Vendas necessárias</p>
                            <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
                              <Flame className="w-4 h-4 text-warning" />
                              Faltam {goalInsights.salesNeeded} venda{goalInsights.salesNeeded > 1 ? 's' : ''}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Ticket médio atual: {formatCurrency(goalInsights.ticketMedioValue)}
                            </p>
                          </div>
                        )}
                        {goalInsights.projectedDate && (
                          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                            <p className="text-xs text-muted-foreground">Projeção de atingimento</p>
                            <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
                              <Rocket className="w-4 h-4 text-primary" />
                              {format(goalInsights.projectedDate, "dd/MM")}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {goalInsights.projectedDate.getMonth() === new Date().getMonth()
                                ? 'Mantendo o ritmo atual'
                                : <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warning" /> Projeção ultrapassa o mês</span>}
                            </p>
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                          <p className="text-xs text-muted-foreground">Valor restante</p>
                          <p className="text-lg font-bold text-foreground mt-1">
                            {formatCurrency(goalInsights.remaining)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {goalInsights.daysRemaining} dia{goalInsights.daysRemaining !== 1 ? 's' : ''} restante{goalInsights.daysRemaining !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 4. Agenda + Negociações Quentes */}
          <div className={cn("grid gap-4", sections.includes('negotiations') && sections.includes('agenda') ? "lg:grid-cols-2" : "lg:grid-cols-1")}>

            {/* Agenda do Dia */}
            {sections.includes('agenda') && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++} className="rounded-xl border border-border bg-card/50 p-4">
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
                      const color = eventTypeColors[event.event_type] || 'hsl(var(--primary))';
                      return (
                        <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate('/agenda')}>
                          <span className="text-xs font-mono text-muted-foreground w-12 shrink-0 tabular-nums">
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
              </motion.div>
            )}

            {/* Negociações Quentes */}
            {sections.includes('negotiations') && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++} className="rounded-xl border border-warning/20 bg-gradient-to-br from-warning/5 to-transparent p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-warning" /> Negociações Quentes
                  </h2>
                  <Button variant="ghost" size="sm" className="text-xs text-warning" onClick={() => navigate('/negociacoes')}>
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
                              <span className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(neg.negotiated_value)}</span>
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
              </motion.div>
            )}
          </div>

          {/* Funil da Equipe */}
          {!focusMode && sections.includes('funnel') && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++} className="rounded-xl border border-border bg-card/50 p-3 lg:p-5">
              <h2 className="text-xs lg:text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3 lg:mb-4">
                <BarChart3 className="w-4 h-4 text-primary" /> Funil de Vendas
              </h2>
              <div className="space-y-2 lg:space-y-3">
                {funnelData.map(item => (
                  <div key={item.label} className="flex items-center gap-2 lg:gap-3">
                    <span className="text-[10px] lg:text-xs text-muted-foreground w-16 lg:w-24 text-right shrink-0">{item.label}</span>
                    <div className="flex-1 bg-muted/30 rounded-full h-5 lg:h-6 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2 transition-all`}
                        style={{ width: `${Math.max((item.value / maxFunnel) * 100, 12)}%` }}
                      >
                        <span className="text-[10px] font-bold text-primary-foreground tabular-nums">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Metrics */}
          {!focusMode && sections.includes('metrics') && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++} className="rounded-xl border border-border bg-card/50 p-3 lg:p-5">
              <h2 className="text-xs lg:text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3 lg:mb-4">
                <Activity className="w-4 h-4 text-primary" /> Métricas Consolidadas
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                <div className="p-2.5 lg:p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-lg lg:text-2xl font-bold text-foreground tabular-nums">{formatCurrency(ticketMedio)}</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Ticket Médio</p>
                </div>
                <div className="p-2.5 lg:p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-lg lg:text-2xl font-bold text-foreground tabular-nums">
                    {activeTeamBrokers.length > 0 ? (monthSales.length / activeTeamBrokers.length).toFixed(1) : '0'}
                  </p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Vendas/Corretor</p>
                </div>
                <div className="p-2.5 lg:p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-lg lg:text-2xl font-bold text-foreground tabular-nums">{conversionRate}%</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Taxa de Conversão</p>
                </div>
                <div className="p-2.5 lg:p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                  <p className="text-lg lg:text-2xl font-bold text-foreground tabular-nums">{formatCurrency(monthVGC)}</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Comissões do Mês</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Opportunities */}
          {!focusMode && sections.includes('opportunities') && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++} className="rounded-xl border border-info/20 bg-gradient-to-br from-info/5 to-transparent p-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-info" /> Visão Geral
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{pendingFollowUps.length}</p>
                  <p className="text-xs text-muted-foreground">Leads pendentes</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{activeNegotiations.length}</p>
                  <p className="text-xs text-muted-foreground">Negociações ativas</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{todayEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Compromissos hoje</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{brokersWithoutSalesData.length}</p>
                  <p className="text-xs text-muted-foreground">Corretores parados</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. Ranking da Equipe */}
          {sections.includes('ranking') && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++} className="rounded-xl border border-warning/20 bg-gradient-to-br from-warning/5 to-transparent p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-warning" /> Ranking da Equipe — Mês Atual
                </h2>
                <Button variant="ghost" size="sm" className="text-xs text-warning" onClick={() => navigate('/ranking')}>
                  Ver ranking completo <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {brokerPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum corretor na equipe</p>
              ) : (
                <Collapsible open={rankingExpanded} onOpenChange={setRankingExpanded}>
                  {/* Top 3 always visible */}
                  <div className="space-y-1.5 lg:space-y-2">
                    {brokerPerformance.slice(0, 3).map((broker, idx) => {
                      const maxVGV = brokerPerformance[0]?.vgv || 1;
                      const barWidth = Math.max((broker.vgv / maxVGV) * 100, 5);
                      const MedalIcon = medalIcons[idx];
                      return (
                        <div key={broker.id} className={cn(
                          "flex items-center gap-2 lg:gap-3 p-2 lg:p-2.5 rounded-lg hover:bg-muted/20 transition-all",
                          idx === 0 && "bg-warning/5 border border-warning/10"
                        )}>
                          <div className="w-6 lg:w-8 flex items-center justify-center shrink-0">
                            <MedalIcon className={cn("w-5 h-5", medalColors[idx])} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5 lg:mb-1">
                              <span className="text-xs lg:text-sm font-medium text-foreground truncate">{broker.name}</span>
                              <div className="flex items-center gap-1.5 lg:gap-3 text-[10px] lg:text-xs text-muted-foreground shrink-0">
                                <span className="hidden sm:inline">{broker.salesCount} vendas</span>
                                <span className="sm:hidden">{broker.salesCount}v</span>
                                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(broker.vgv)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-muted/30 rounded-full h-1 lg:h-1.5 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-700",
                                  idx === 0 ? "bg-warning" : idx === 1 ? "bg-muted-foreground" : "bg-warning/60"
                                )}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded: 4th+ */}
                  {brokerPerformance.length > 3 && (
                    <>
                      <CollapsibleContent className="space-y-2 mt-2 animate-fade-in">
                        {brokerPerformance.slice(3).map((broker, idx) => {
                          const maxVGV = brokerPerformance[0]?.vgv || 1;
                          const barWidth = Math.max((broker.vgv / maxVGV) * 100, 5);
                          const position = idx + 4;
                          return (
                            <div key={broker.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-all">
                              <span className="text-sm w-8 text-center shrink-0 text-muted-foreground tabular-nums">{position}º</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground truncate">{broker.name}</span>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                    <span>{broker.salesCount} vendas</span>
                                    <span className="font-semibold text-foreground tabular-nums">{formatCurrency(broker.vgv)}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-full rounded-full bg-primary/50 transition-all duration-700" style={{ width: `${barWidth}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CollapsibleContent>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground">
                          {rankingExpanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                          {rankingExpanded ? 'Ver menos' : `Ver todos (${brokerPerformance.length - 3} restantes)`}
                        </Button>
                      </CollapsibleTrigger>
                    </>
                  )}
                </Collapsible>
              )}
            </motion.div>
          )}

          {/* Origin Analytics */}
          {!focusMode && <OriginAnalyticsDashboard />}
        </div>
      </main>
    </div>
  );
};

export default GerenteDashboard;
