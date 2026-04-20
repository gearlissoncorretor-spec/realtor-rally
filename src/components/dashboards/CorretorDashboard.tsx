import React, { useMemo } from 'react';
import { OriginAnalyticsDashboard } from '@/components/dashboards/OriginAnalyticsDashboard';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useBrokers } from '@/hooks/useBrokers';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useGoals } from '@/hooks/useGoals';
import { useTeams } from '@/hooks/useTeams';
import { useAgencies } from '@/hooks/useAgencies';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatting';
import { getHotNegotiations, getProbabilityColor, getProbabilityProgressColor } from '@/utils/negotiationProbability';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Phone, Target, Flame, Calendar, ChevronRight,
  Handshake, DollarSign, AlertTriangle, TrendingUp, Eye,
  Trophy, Medal, Home, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CorretorDashboard = () => {
  const { profile, user } = useAuth();
  const { sales } = useSales();
  const { brokers } = useBrokers();
  const { negotiations } = useNegotiations();
  const { followUps } = useFollowUps();
  const { goals } = useGoals();
  const { teams } = useTeams();
  const { agencies } = useAgencies();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const today = format(new Date(), 'yyyy-MM-dd');
  const { events } = useCalendarEvents(today, today);

  const currentBroker = brokers?.find(b => b.user_id === user?.id);
  const brokerId = currentBroker?.id;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const brokerSales = useMemo(() =>
    (sales || []).filter(s => s.broker_id === brokerId && s.status !== 'distrato' && s.tipo === 'venda' && s.parceria_tipo !== 'Agência'), [sales, brokerId]);
  const monthSales = useMemo(() =>
    brokerSales.filter(s => {
      const d = new Date(s.sale_date || s.created_at || '');
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }), [brokerSales, currentMonth, currentYear]);

  const brokerNegotiations = useMemo(() =>
    (negotiations || []).filter(n => n.broker_id === brokerId), [negotiations, brokerId]);
  const activeNegotiations = brokerNegotiations.filter(n => !['perdida', 'cancelada', 'ganha'].includes(n.status));
  const hotNegotiations = getHotNegotiations(activeNegotiations, 4);

  const brokerFollowUps = useMemo(() =>
    (followUps || []).filter(f => f.broker_id === brokerId), [followUps, brokerId]);
  const pendingFollowUps = brokerFollowUps.filter(f => f.status !== 'convertido' && f.status !== 'perdido');

  const todayFollowUps = pendingFollowUps.filter(f => f.next_contact_date === today);
  const todayEvents = events || [];

  const brokerGoals = useMemo(() =>
    (goals || []).filter(g => g.status === 'active' && (g.assigned_to === user?.id || g.broker_id === brokerId)),
    [goals, user?.id, brokerId]);
  const primaryGoal = brokerGoals[0];

  const monthVGV = monthSales.reduce((sum, s) => sum + (s.vgv || 0), 0);
  const monthVGC = monthSales.reduce((sum, s) => sum + (s.vgc || 0), 0);

  const metaValue = primaryGoal?.target_value || currentBroker?.meta_monthly || 0;
  const metaRealizado = primaryGoal?.current_value || monthVGV;
  const metaPercent = metaValue > 0 ? Math.min((metaRealizado / metaValue) * 100, 999) : 0;
  const metaFaltam = metaValue > 0 ? Math.max(metaValue - metaRealizado, 0) : 0;

  const visitEvents = todayEvents.filter(e => e.event_type === 'visita' || e.event_type === 'captacao').length;

  // Agency Stats for Ranking
  const agencyStats = useMemo(() => {
    return (agencies || []).map(agency => {
      const agencySales = (sales || []).filter(s => 
        s.agency_id === agency.id && 
        s.status !== 'distrato' &&
        s.tipo === 'venda' && s.parceria_tipo !== 'Agência' &&
        new Date(s.sale_date || s.created_at || '').getFullYear() === currentYear &&
        new Date(s.sale_date || s.created_at || '').getMonth() + 1 === currentMonth
      );
      
      const vgv = agencySales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const salesCount = agencySales.length;
      const agencyBrokers = (brokers || []).filter(b => b.agency_id === agency.id);
      const confirmed = agencySales.filter(s => s.status === 'confirmada').length;
      const conversion = salesCount > 0 ? (confirmed / salesCount) * 100 : 0;

      return {
        id: agency.id,
        name: agency.name,
        vgv,
        sales: salesCount,
        brokerCount: agencyBrokers.length,
        conversion
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [agencies, sales, brokers, currentYear, currentMonth]);

  // Manager Stats (based on teams)
  const managerStats = useMemo(() => {
    return (teams || []).map(team => {
      const teamBrokers = (brokers || []).filter(b => b.team_id === team.id);
      const teamSales = (sales || []).filter(s => 
        teamBrokers.some(b => b.id === s.broker_id) && 
        s.status !== 'distrato' &&
        s.tipo === 'venda' && s.parceria_tipo !== 'Agência' &&
        new Date(s.sale_date || s.created_at || '').getFullYear() === currentYear &&
        new Date(s.sale_date || s.created_at || '').getMonth() + 1 === currentMonth
      );
      
      const vgv = teamSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const salesCount = teamSales.length;
      const agency = (agencies || []).find(a => a.id === team.agency_id);

      return {
        id: team.id,
        name: team.name,
        agencyName: agency?.name || 'N/A',
        vgv,
        sales: salesCount,
        brokerCount: teamBrokers.length
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [teams, brokers, sales, agencies, currentYear, currentMonth]);

  // Broker Stats for Ranking
  const brokerStats = useMemo(() => {
    return (brokers || []).map(broker => {
      const bSales = (sales || []).filter(s => 
        s.broker_id === broker.id && 
        s.status !== 'distrato' &&
        s.tipo === 'venda' && s.parceria_tipo !== 'Agência' &&
        new Date(s.sale_date || s.created_at || '').getFullYear() === currentYear &&
        new Date(s.sale_date || s.created_at || '').getMonth() + 1 === currentMonth
      );
      
      const vgv = bSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
      const salesCount = bSales.length;

      return {
        id: broker.id,
        name: broker.name,
        avatar: (broker as any).avatar_url,
        vgv,
        sales: salesCount,
      };
    }).sort((a, b) => b.vgv - a.vgv);
  }, [brokers, sales, currentYear, currentMonth]);

  // Smart alerts
  const alerts: { icon: string; text: string; type: 'warning' | 'fire' | 'info' }[] = [];
  const contactsToday = todayFollowUps.length;
  if (contactsToday > 0) {
    alerts.push({ icon: '⚠', text: `Você tem ${contactsToday} cliente${contactsToday > 1 ? 's' : ''} aguardando contato hoje`, type: 'warning' });
  }
  if (metaValue > 0 && metaFaltam > 0) {
    alerts.push({ icon: '🔥', text: `Você está a ${formatCurrency(metaFaltam)} de bater sua meta`, type: 'fire' });
  }
  if (visitEvents > 0) {
    alerts.push({ icon: '📅', text: `Você tem ${visitEvents} visita${visitEvents > 1 ? 's' : ''} agendada${visitEvents > 1 ? 's' : ''} hoje`, type: 'info' });
  }

  const eventTypeColors: Record<string, string> = {
    visita: '#10b981', captacao: '#10b981', reuniao: '#8b5cf6', meta: '#8b5cf6',
    follow_up: '#f59e0b', lembrete: '#3b82f6', venda: '#06b6d4', outro: '#6b7280',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="space-y-5 max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {isMobile ? 'Meu Painel' : 'Central do Corretor'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Olá, {profile?.full_name?.split(' ')[0] || 'Corretor'}! Seu resumo do dia.
              </p>
            </div>

            {/* Quick Summary Bar */}
            <div className="flex items-center gap-4 sm:gap-8 bg-card/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-border/50 shadow-sm animate-fade-in self-start md:self-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> VGV
                </span>
                <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(monthVGV)}</span>
              </div>
              <div className="w-px h-8 bg-border/30" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> VGC
                </span>
                <span className="text-sm font-bold text-success tabular-nums">{formatCurrency(monthVGC)}</span>
              </div>
              <div className="w-px h-8 bg-border/30" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" /> Vendas
                </span>
                <span className="text-sm font-bold text-warning tabular-nums">{monthSales.length}</span>
              </div>
            </div>
          </div>

          {/* ========== 1. THREE MAIN CARDS ========== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Vendas do Mês */}
            <button
              onClick={() => navigate('/vendas')}
              className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 text-left transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendas do Mês</p>
                <DollarSign className="w-5 h-5 text-emerald-400 opacity-70" />
              </div>
              <p className="text-sm text-muted-foreground">
                {monthSales.length} venda{monthSales.length !== 1 ? 's' : ''}
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-1">
                {formatCurrency(monthVGV)}
              </p>
            </button>

            {/* Meta do Mês */}
            <button
              onClick={() => navigate('/metas')}
              className={cn(
                "rounded-xl border p-5 text-left transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-br",
                metaPercent >= 100
                  ? "border-emerald-500/30 from-emerald-500/10 to-emerald-600/5"
                  : metaPercent >= 50
                    ? "border-primary/30 from-primary/10 to-primary/5"
                    : "border-amber-500/30 from-amber-500/10 to-amber-600/5"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meta do Mês</p>
                <Target className={cn("w-5 h-5 opacity-70", metaPercent >= 100 ? 'text-emerald-400' : metaPercent >= 50 ? 'text-primary' : 'text-amber-400')} />
              </div>
              {metaValue > 0 ? (
                <>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{Math.round(metaPercent)}% <span className="text-sm font-normal text-muted-foreground">concluído</span></p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(metaRealizado)} de {formatCurrency(metaValue)}
                  </p>
                  <Progress value={Math.min(metaPercent, 100)} className="h-2 mt-3" />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {metaRealizado >= metaValue
                      ? `🎉 Meta superada em ${formatCurrency(metaRealizado - metaValue)}`
                      : `Faltam ${formatCurrency(metaFaltam)}`
                    }
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma meta definida</p>
              )}
            </button>

            {/* Follow-ups Hoje */}
            <button
              onClick={() => navigate('/follow-up')}
              className={cn(
                "rounded-xl border p-5 text-left transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-br",
                pendingFollowUps.length > 0
                  ? "border-orange-500/40 from-orange-500/15 to-orange-600/5 ring-1 ring-orange-500/20"
                  : "border-border from-muted/10 to-transparent"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Follow-ups Hoje</p>
                <AlertTriangle className={cn("w-5 h-5 opacity-70", pendingFollowUps.length > 0 ? 'text-orange-400' : 'text-muted-foreground')} />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">{pendingFollowUps.length}</p>
              <p className="text-sm text-muted-foreground mt-1">pendentes</p>
            </button>
          </div>

          {/* ========== 2. SMART ALERTS ========== */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm",
                    alert.type === 'warning' && "border-amber-500/30 bg-amber-500/5 text-amber-300",
                    alert.type === 'fire' && "border-orange-500/30 bg-orange-500/5 text-orange-300",
                    alert.type === 'info' && "border-blue-500/30 bg-blue-500/5 text-blue-300",
                  )}
                >
                  <span className="text-base">{alert.icon}</span>
                  <span>{alert.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* ========== 3. QUICK ACTIONS ========== */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ações Rápidas</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                onClick={() => navigate('/negociacoes')}
              >
                <Handshake className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">+ Nova Negociação</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40"
                onClick={() => navigate('/follow-up')}
              >
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-medium">+ Novo Cliente</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40"
                onClick={() => navigate('/agenda')}
              >
                <Phone className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-medium">Registrar Ligação</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40"
                onClick={() => navigate('/agenda')}
              >
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-medium">Abrir Agenda</span>
              </Button>
            </div>
          </div>

          {/* ========== 4. AGENDA + NEGOTIATIONS ROW ========== */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Agenda do Dia */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Agenda do Dia
                </h2>
                <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate('/agenda')}>
                  Ver agenda completa <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {todayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhum compromisso hoje</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/agenda')}>
                    Abrir agenda
                  </Button>
                </div>
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

            {/* Negociações Quentes */}
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
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma negociação ativa</p>
              ) : (
                <div className="space-y-2">
                  {hotNegotiations.map((neg) => {
                    const chance = neg.closingProbability;
                    return (
                      <div key={neg.id} className="p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-all cursor-pointer" onClick={() => navigate('/negociacoes')}>
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">Cliente: {neg.client_name}</p>
                            <p className="text-xs text-muted-foreground truncate">Imóvel: {neg.property_address}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${getProbabilityColor(chance)}`}>
                            {chance}%
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={chance} className={`h-1.5 flex-1 ${getProbabilityProgressColor(chance)}`} />
                          <span className="text-[10px] text-muted-foreground shrink-0">Probabilidade: {chance}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========== 5. RANKINGS ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unidades Ranking */}
            <Card className="shadow-sm border-border/60 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Ranking de Unidades
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 px-4 pb-4">
                <div className="space-y-3">
                  {agencyStats.slice(0, 5).map((stat, idx) => (
                    <div key={stat.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/40">
                      <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-xs truncate">{stat.name}</span>
                          <span className="font-bold text-xs">{formatCurrency(stat.vgv)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {stat.sales} vendas · {stat.brokerCount} corretores
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gerentes Ranking */}
            <Card className="shadow-sm border-border/60 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Medal className="h-4 w-4 text-blue-500" />
                  Ranking de Equipes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 px-4 pb-4">
                <div className="space-y-3">
                  {managerStats.slice(0, 5).map((stat, idx) => (
                    <div key={stat.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/40">
                      <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-xs truncate">{stat.name}</span>
                          <span className="font-bold text-xs">{formatCurrency(stat.vgv)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground italic">
                          {stat.agencyName} · {stat.sales} vendas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Corretores Ranking */}
            <Card className="shadow-sm border-border/60 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Ranking de Corretores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 px-4 pb-4">
                <div className="space-y-3">
                  {brokerStats.slice(0, 5).map((stat, idx) => (
                    <div key={stat.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/40">
                      <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <Avatar className="h-8 w-8 border border-border shadow-sm">
                        <AvatarImage src={stat.avatar} />
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                          {stat.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-xs truncate">{stat.name}</span>
                          <span className="font-bold text-xs">{formatCurrency(stat.vgv)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {stat.sales} vendas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== 6. META DO MÊS - MOTIVATIONAL BLOCK ========== */}
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-primary" /> Meta do Mês
            </h2>
            {metaValue > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl lg:text-5xl font-bold text-foreground">{formatCurrency(metaRealizado)}</p>
                  <p className="text-sm text-muted-foreground mt-1">de {formatCurrency(metaValue)}</p>
                </div>
                <Progress value={Math.min(metaPercent, 100)} className="h-4" />
                <div className="flex justify-between text-sm">
                  <span className={cn("font-semibold", metaPercent >= 100 ? 'text-emerald-400' : 'text-primary')}>
                    {Math.round(metaPercent)}% concluído
                  </span>
                  <span className="text-muted-foreground">
                    {metaRealizado >= metaValue
                      ? `🚀 Meta superada em ${formatCurrency(metaRealizado - metaValue)}`
                      : `Faltam ${formatCurrency(metaFaltam)}`
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-4xl font-bold text-foreground">{formatCurrency(monthVGV)}</p>
                <p className="text-sm text-muted-foreground">VGV do mês • {monthSales.length} venda{monthSales.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Nenhuma meta definida para este mês</p>
              </div>
            )}
          </div>

          {/* ========== 6. ORIGEM DOS CLIENTES ========== */}
          <OriginAnalyticsDashboard brokerId={brokerId} compact />

        </div>
      </main>
    </div>
  );
};

export default CorretorDashboard;
