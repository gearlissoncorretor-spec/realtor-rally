import React, { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useGoals } from '@/hooks/useGoals';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatting';
import { getHotNegotiations, getProbabilityColor, getProbabilityProgressColor } from '@/utils/negotiationProbability';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import {
  Zap, UserPlus, Phone, Target, Flame, Trophy, Clock,
  CheckSquare, Square, Eye, MessageCircle, ChevronRight,
  Calendar, MapPin, Users, RotateCcw, FileText, BarChart3,
  TrendingUp, DollarSign, Lightbulb, Focus, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CorretorDashboard = () => {
  const { profile, user } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { negotiations } = useNegotiations();
  const { followUps } = useFollowUps();
  const { goals } = useGoals();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [focusMode, setFocusMode] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  const today = format(new Date(), 'yyyy-MM-dd');
  const { events } = useCalendarEvents(today, today);

  // Current broker
  const currentBroker = brokers?.find(b => b.user_id === user?.id);
  const brokerId = currentBroker?.id;

  // Current month sales
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const brokerSales = useMemo(() =>
    (sales || []).filter(s => s.broker_id === brokerId && s.status !== 'distrato'), [sales, brokerId]);
  const monthSales = useMemo(() =>
    brokerSales.filter(s => {
      const d = new Date(s.sale_date || s.created_at || '');
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }), [brokerSales, currentMonth, currentYear]);

  // Broker negotiations
  const brokerNegotiations = useMemo(() =>
    (negotiations || []).filter(n => n.broker_id === brokerId), [negotiations, brokerId]);
  const activeNegotiations = brokerNegotiations.filter(n => !['perdida', 'cancelada', 'ganha'].includes(n.status));
  const hotNegotiations = getHotNegotiations(activeNegotiations, 4);

  // Follow-ups
  const brokerFollowUps = useMemo(() =>
    (followUps || []).filter(f => f.broker_id === brokerId), [followUps, brokerId]);
  const pendingFollowUps = brokerFollowUps.filter(f => f.status !== 'convertido' && f.status !== 'perdido');

  // Today events
  const todayEvents = events || [];

  // Goal progress
  const brokerGoals = useMemo(() =>
    (goals || []).filter(g => g.status === 'active' && (g.assigned_to === user?.id || g.broker_id === brokerId)),
    [goals, user?.id, brokerId]);
  const primaryGoal = brokerGoals[0];
  const goalProgress = primaryGoal ? Math.min((primaryGoal.current_value / primaryGoal.target_value) * 100, 100) : 0;

  // Activity counts
  const callEvents = todayEvents.filter(e => e.event_type === 'lembrete' || e.event_type === 'outro').length;
  const visitEvents = todayEvents.filter(e => e.event_type === 'visita' || e.event_type === 'captacao').length;
  const followUpCount = pendingFollowUps.length;
  const proposalCount = activeNegotiations.filter(n => n.status === 'proposta_enviada' || n.status === 'em_negociacao').length;

  // Funnel data
  const funnelData = [
    { label: 'Leads', value: brokerFollowUps.length, color: 'bg-blue-500' },
    { label: 'Atendimento', value: activeNegotiations.length, color: 'bg-cyan-500' },
    { label: 'Visitas', value: activeNegotiations.filter(n => n.status === 'visita_realizada' || n.status === 'em_negociacao').length, color: 'bg-emerald-500' },
    { label: 'Propostas', value: proposalCount, color: 'bg-purple-500' },
    { label: 'Fechados', value: monthSales.length, color: 'bg-amber-500' },
  ];
  const maxFunnel = Math.max(...funnelData.map(f => f.value), 1);

  // Mini ranking
  const brokerRankings = useMemo(() => {
    if (!brokers || !sales) return [];
    const activeBrokers = brokers.filter(b => b.status === 'ativo');
    return activeBrokers.map(b => {
      const bSales = (sales || []).filter(s => {
        if (s.broker_id !== b.id || s.status === 'distrato') return false;
        const d = new Date(s.sale_date || s.created_at || '');
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      });
      return { id: b.id, name: b.name, vgv: bSales.reduce((sum, s) => sum + (s.vgv || 0), 0) };
    }).sort((a, b) => b.vgv - a.vgv).slice(0, 5);
  }, [brokers, sales, currentMonth, currentYear]);

  const myRankPosition = brokerRankings.findIndex(r => r.id === brokerId) + 1;

  // Tasks from negotiations + follow-ups
  const priorityTasks = useMemo(() => {
    const tasks: { id: string; label: string; type: string }[] = [];
    hotNegotiations.slice(0, 2).forEach(n => {
      tasks.push({ id: `neg-${n.id}`, label: `Acompanhar negociação - ${n.client_name}`, type: 'negotiation' });
    });
    pendingFollowUps.slice(0, 3).forEach(f => {
      tasks.push({ id: `fu-${f.id}`, label: `Follow-up - ${f.client_name}`, type: 'followup' });
    });
    todayEvents.slice(0, 2).forEach(e => {
      tasks.push({ id: `ev-${e.id}`, label: `${e.title}${e.start_time ? ` às ${e.start_time.slice(0, 5)}` : ''}`, type: 'event' });
    });
    return tasks.slice(0, 6);
  }, [hotNegotiations, pendingFollowUps, todayEvents]);

  const toggleTask = (id: string) => {
    setCheckedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const monthVGV = monthSales.reduce((sum, s) => sum + (s.vgv || 0), 0);

  // Focus mode sections
  const focusSections = ['activities', 'agenda', 'negotiations', 'tasks'];
  const allSections = ['activities', 'agenda', 'negotiations', 'goal', 'funnel', 'tasks', 'ranking', 'opportunities'];

  const sections = focusMode ? focusSections : allSections;

  const activityCards = [
    { label: 'Ligações', count: callEvents, icon: Phone, gradient: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30', iconColor: 'text-blue-400' },
    { label: 'Visitas', count: visitEvents, icon: MapPin, gradient: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30', iconColor: 'text-emerald-400' },
    { label: 'Follow-ups', count: followUpCount, icon: RotateCcw, gradient: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/30', iconColor: 'text-orange-400' },
    { label: 'Propostas', count: proposalCount, icon: FileText, gradient: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30', iconColor: 'text-purple-400' },
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
                Central do Corretor
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Painel diário de vendas, negociações e produtividade
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
                  <Button variant="outline" size="sm" className="gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => navigate('/follow-up')}>
                    <UserPlus className="w-3.5 h-3.5" /> Novo Cliente
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 border-blue-500/20 text-blue-400 hover:bg-blue-500/10" onClick={() => navigate('/agenda')}>
                    <Phone className="w-3.5 h-3.5" /> Registrar Ligação
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
                <strong>Modo Foco ativo</strong> — Mostrando apenas o essencial: clientes, visitas, follow-ups e negociações quentes.
              </p>
            </div>
          )}

          {/* Activity Cards */}
          {sections.includes('activities') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {activityCards.map(card => (
                <div key={card.label} className={`relative overflow-hidden rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4 transition-all hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{card.count}</p>
                    </div>
                    <card.icon className={`w-8 h-8 ${card.iconColor} opacity-80`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agenda + Negotiations Row */}
          <div className={cn("grid gap-4", sections.includes('negotiations') ? "lg:grid-cols-2" : "lg:grid-cols-1")}>

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
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-400">
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-400">
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Negociações Quentes */}
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
                    {hotNegotiations.map((neg, idx) => {
                      const chance = Math.max(90 - idx * 15, 30);
                      return (
                        <div key={neg.id} className="p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-all cursor-pointer" onClick={() => navigate('/negociacoes')}>
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{neg.client_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{neg.property_address}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-[10px] border-orange-500/30 text-orange-400 bg-orange-500/10">
                              {chance}%
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <Progress value={chance} className="h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goal + Funnel Row */}
          {!focusMode && (
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Meta do Mês */}
              {sections.includes('goal') && (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-primary" /> Meta do Mês
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
                      <p className="text-xs text-muted-foreground">VGV do mês • {monthSales.length} vendas</p>
                      <p className="text-xs text-muted-foreground">Meta mensal: {formatCurrency(currentBroker?.meta_monthly || 0)}</p>
                      {(currentBroker?.meta_monthly || 0) > 0 && (
                        <>
                          <Progress value={Math.min((monthVGV / (currentBroker?.meta_monthly || 1)) * 100, 100)} className="h-3" />
                          <div className="flex justify-between text-xs">
                            <span className="text-primary font-semibold">{Math.round((monthVGV / (currentBroker?.meta_monthly || 1)) * 100)}%</span>
                            <span className="text-muted-foreground">Faltam: {formatCurrency(Math.max((currentBroker?.meta_monthly || 0) - monthVGV, 0))}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Funil de Vendas */}
              {sections.includes('funnel') && (
                <div className="rounded-xl border border-border bg-card/50 p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary" /> Funil de Vendas
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
            </div>
          )}

          {/* Tasks + Ranking Row */}
          <div className={cn("grid gap-4", !focusMode ? "lg:grid-cols-3" : "lg:grid-cols-1")}>

            {/* Tarefas Prioritárias */}
            {sections.includes('tasks') && (
              <div className={cn("rounded-xl border border-border bg-card/50 p-4", !focusMode ? "lg:col-span-2" : "")}>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                  <CheckSquare className="w-4 h-4 text-primary" /> Tarefas Prioritárias
                </h2>
                {priorityTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa pendente 🎉</p>
                ) : (
                  <div className="space-y-1.5">
                    {priorityTasks.map(task => {
                      const isDone = checkedTasks.has(task.id);
                      const typeColors: Record<string, string> = {
                        negotiation: 'text-orange-400', followup: 'text-amber-400', event: 'text-blue-400',
                      };
                      return (
                        <div key={task.id} className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                          isDone ? "opacity-50" : "hover:bg-muted/30"
                        )}>
                          <button onClick={() => toggleTask(task.id)} className="shrink-0">
                            {isDone ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                          </button>
                          <p className={cn("text-sm flex-1", isDone && "line-through text-muted-foreground")}>{task.label}</p>
                          <span className={cn("text-[10px] font-medium", typeColors[task.type] || 'text-muted-foreground')}>
                            {task.type === 'negotiation' ? '🔥' : task.type === 'followup' ? '💬' : '📅'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mini Ranking */}
            {!focusMode && sections.includes('ranking') && (
              <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" /> Ranking da Semana
                </h2>
                <div className="space-y-2">
                  {brokerRankings.map((r, idx) => {
                    const isMe = r.id === brokerId;
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={r.id} className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-all",
                        isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/20"
                      )}>
                        <span className="text-sm w-6 text-center">{idx < 3 ? medals[idx] : `${idx + 1}º`}</span>
                        <span className={cn("text-sm flex-1 truncate", isMe && "font-semibold text-primary")}>
                          {isMe ? 'Você' : r.name.split(' ')[0]}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">{formatCurrency(r.vgv)}</span>
                      </div>
                    );
                  })}
                  {brokerRankings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Sem dados do ranking</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Opportunities */}
          {!focusMode && sections.includes('opportunities') && (
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-cyan-400" /> Radar de Oportunidades
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-card/30 border border-border/30">
                  <p className="text-2xl font-bold text-foreground">{pendingFollowUps.length}</p>
                  <p className="text-xs text-muted-foreground">Leads aguardando contato</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30">
                  <p className="text-2xl font-bold text-foreground">{activeNegotiations.length}</p>
                  <p className="text-xs text-muted-foreground">Negociações em andamento</p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/30">
                  <p className="text-2xl font-bold text-foreground">{todayEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Compromissos hoje</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CorretorDashboard;
