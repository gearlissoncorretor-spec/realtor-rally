import React, { useState, useMemo, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useGoals } from '@/hooks/useGoals';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import { useContextualIdentity } from '@/hooks/useContextualIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Target, 
  Users, 
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Percent,
  Building2,
  UserPlus,
  Plus,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatCurrencyCompact, formatPercentage } from '@/utils/formatting';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import MonthlyGoalDashboard from '@/components/goals/MonthlyGoalDashboard';

interface MonthlyGoal {
  month: Date;
  monthIndex: number;
  target: number;
  expectedTarget: number;
  achieved: number;
  difference: number;
  percentAchieved: number;
}

const useManagementGoals = (year: number, teamFilter?: string | null) => {
  const { sales, targets, brokers } = useData();
  const { teams, teamMembers } = useTeams();
  
  const filteredBrokerIds = useMemo(() => {
    if (!teamFilter) return null;
    return brokers.filter(b => b.team_id === teamFilter).map(b => b.id);
  }, [brokers, teamFilter]);

  // Filter targets by team_id when applicable
  const filteredTargets = useMemo(() => {
    if (!teamFilter) return targets;
    return targets.filter(t => (t as any).team_id === teamFilter);
  }, [targets, teamFilter]);
  
  const yearlyData = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    
    const yearSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      const inYear = saleDate >= yearStart && saleDate <= yearEnd && sale.status === 'confirmada';
      if (!inYear) return false;
      if (filteredBrokerIds && sale.broker_id) return filteredBrokerIds.includes(sale.broker_id);
      return !filteredBrokerIds;
    });
    
    const totalVGV = yearSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
    const totalVGC = yearSales.reduce((sum, sale) => sum + (sale.vgc || 0), 0);
    const totalSales = yearSales.length;
    const yearTargets = filteredTargets.filter(t => t.year === year);
    const annualTarget = yearTargets.reduce((sum, t) => sum + t.target_value, 0);
    
    return { totalVGV, totalVGC, totalSales, annualTarget, yearSales, yearTargets };
  }, [sales, filteredTargets, year, filteredBrokerIds]);
  
  const monthlyGoals = useMemo((): MonthlyGoal[] => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthIndex = month.getMonth() + 1;
      const monthTarget = filteredTargets.find(t => t.year === year && t.month === monthIndex);
      const target = monthTarget?.target_value || 0;
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date || sale.created_at || '');
        return saleDate >= monthStart && saleDate <= monthEnd && sale.status === 'confirmada';
      });
      const achieved = monthSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
      
      return {
        month, monthIndex, target, expectedTarget: 0,
        achieved, difference: achieved - target,
        percentAchieved: target > 0 ? (achieved / target) * 100 : 0
      };
    });
  }, [sales, filteredTargets, year]);
  
  const brokerStats = useMemo(() => {
    let filteredBrokers = brokers;
    if (teamFilter) filteredBrokers = brokers.filter(b => b.team_id === teamFilter);
    return {
      activeBrokers: filteredBrokers.filter(b => b.status === 'ativo').length,
      totalBrokers: filteredBrokers.length
    };
  }, [brokers, teamFilter]);
  
  const performanceStats = useMemo(() => {
    const completedMonths = monthlyGoals.filter(m => m.achieved > 0 || m.target > 0);
    if (completedMonths.length === 0) return null;
    
    const bestMonth = completedMonths.reduce((best, c) => c.achieved > best.achieved ? c : best, completedMonths[0]);
    const worstMonth = completedMonths.reduce((worst, c) => c.achieved < worst.achieved ? c : worst, completedMonths[0]);
    
    const monthlyGrowth: number[] = [];
    for (let i = 1; i < completedMonths.length; i++) {
      const prev = completedMonths[i - 1].achieved;
      if (prev > 0) monthlyGrowth.push(((completedMonths[i].achieved - prev) / prev) * 100);
    }
    const avgGrowth = monthlyGrowth.length > 0 ? monthlyGrowth.reduce((a, b) => a + b, 0) / monthlyGrowth.length : 0;
    
    return { bestMonth, worstMonth, avgGrowth };
  }, [monthlyGoals]);
  
  const probability = useMemo(() => {
    const { annualTarget, totalVGV } = yearlyData;
    if (annualTarget === 0) return { current: 0, withMoreBrokers: 0, withHigherTicket: 0 };
    
    const yearProgress = (new Date().getMonth() + 1) / 12;
    const projectedTotal = yearProgress > 0 ? totalVGV / yearProgress : 0;
    const baseProb = Math.min(100, (projectedTotal / annualTarget) * 100);
    
    return {
      current: Math.round(baseProb),
      withMoreBrokers: Math.round(Math.min(100, baseProb * 1.15)),
      withHigherTicket: Math.round(Math.min(100, baseProb * 1.20))
    };
  }, [yearlyData]);
  
  return { yearlyData, monthlyGoals, brokerStats, performanceStats, probability };
};

const MetaGestao = () => {
  const { getUserRole, isAdmin, isDiretor, isGerente, profile } = useAuth();
  const { displayName } = useContextualIdentity();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { teams, loading: teamsLoading } = useTeams();
  const { sales, targets, targetsLoading, salesLoading, createTarget, updateTarget } = useData();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [brokerHiringGoal, setBrokerHiringGoal] = useState(25);
  const [savingTargets, setSavingTargets] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  
  const { goals, loading: goalsLoading, createGoal, updateGoal, deleteGoal, canEditGoal, refreshGoals } = useGoals();
  
  const teamFilter = useMemo(() => {
    if (isGerente() && profile?.team_id) return profile.team_id;
    if ((isDiretor() || isAdmin()) && selectedTeamId) return selectedTeamId;
    return null;
  }, [isGerente, isDiretor, isAdmin, profile, selectedTeamId]);
  
  const [annualGoal, setAnnualGoal] = useState(0);
  const [editableMonthlyGoals, setEditableMonthlyGoals] = useState<{ [month: number]: number }>({});
  const [editableMonthlyBrokers, setEditableMonthlyBrokers] = useState<{ [month: number]: number }>({});
  const [editingAnnualGoal, setEditingAnnualGoal] = useState(false);
  const [editingBrokerHiringGoal, setEditingBrokerHiringGoal] = useState(false);
  const [editingMonthlyGoal, setEditingMonthlyGoal] = useState<number | null>(null);
  const [editingMonthlyBroker, setEditingMonthlyBroker] = useState<number | null>(null);
  
  const canManage = isAdmin() || isDiretor() || isGerente();
  const { yearlyData, monthlyGoals, brokerStats, performanceStats, probability } = useManagementGoals(selectedYear, teamFilter);
  const isLoading = brokersLoading || teamsLoading || targetsLoading || salesLoading;
  
  useEffect(() => {
    const savedMonthlyGoals: { [month: number]: number } = {};
    const savedAnnualTotal = monthlyGoals.reduce((sum, goal) => {
      savedMonthlyGoals[goal.monthIndex] = goal.target;
      return sum + goal.target;
    }, 0);
    if (savedAnnualTotal > 0) setAnnualGoal(savedAnnualTotal);
    setEditableMonthlyGoals(savedMonthlyGoals);
  }, [monthlyGoals, selectedYear]);
  
  const calculateMonthlyProgression = (annualTarget: number): number[] => {
    if (annualTarget <= 0) return Array(12).fill(0);
    const baseValue = annualTarget / 36;
    const totalGrowthNeeded = annualTarget - (12 * baseValue);
    const growthIncrement = totalGrowthNeeded / 66;
    return Array.from({ length: 12 }, (_, i) => baseValue + (i * growthIncrement));
  };
  
  const monthlyProgression = calculateMonthlyProgression(annualGoal);
  
  const getMonthlyGoal = (monthIndex: number): number => {
    if (editableMonthlyGoals[monthIndex] !== undefined) return editableMonthlyGoals[monthIndex];
    return monthlyProgression[monthIndex - 1] || 0;
  };
  
  const recalculatedAnnualGoal = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= 12; i++) total += getMonthlyGoal(i);
    return total;
  }, [editableMonthlyGoals, monthlyProgression]);
  
  const handleMonthlyGoalChange = (monthIndex: number, value: number) => {
    setEditableMonthlyGoals(prev => ({ ...prev, [monthIndex]: value }));
  };
  
  const handleMonthlyBrokerChange = async (monthIndex: number, value: number) => {
    setEditableMonthlyBrokers(prev => ({ ...prev, [monthIndex]: value }));
  };
  
  const saveMonthlyGoal = async (monthIndex: number) => {
    const value = editableMonthlyGoals[monthIndex];
    if (value === undefined) return;
    try {
      const existingTarget = targets.find(t => t.year === selectedYear && t.month === monthIndex && (t as any).team_id === teamFilter);
      if (existingTarget) {
        await updateTarget(existingTarget.id, { target_value: value });
      } else {
        await createTarget({ year: selectedYear, month: monthIndex, target_value: value, team_id: teamFilter } as any);
      }
      toast.success(`Meta de ${format(new Date(selectedYear, monthIndex - 1), 'MMMM', { locale: ptBR })} salva!`);
    } catch (error) {
      toast.error('Erro ao salvar meta mensal');
    }
  };
  
  const handleSaveTargets = async () => {
    setSavingTargets(true);
    try {
      const progression = calculateMonthlyProgression(annualGoal);
      for (let month = 1; month <= 12; month++) {
        const monthlyValue = progression[month - 1];
        const existingTarget = targets.find(t => t.year === selectedYear && t.month === month && (t as any).team_id === teamFilter);
        if (existingTarget) {
          if (Math.abs(existingTarget.target_value - monthlyValue) > 0.01) {
            await updateTarget(existingTarget.id, { target_value: monthlyValue });
          }
        } else if (monthlyValue > 0) {
          await createTarget({ year: selectedYear, month: month, target_value: monthlyValue, team_id: teamFilter } as any);
        }
      }
      toast.success('Metas salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar metas');
    } finally {
      setSavingTargets(false);
    }
  };
  
  const annualProgress = annualGoal > 0 ? (yearlyData.totalVGV / annualGoal) * 100 : 0;
  const remaining = Math.max(0, annualGoal - yearlyData.totalVGV);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background lg:ml-72">
          <div className="p-4 lg:p-6 space-y-6 pt-20 lg:pt-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background lg:ml-72">
        <div className="p-4 lg:p-6 space-y-6 pt-20 lg:pt-6 pb-20 lg:pb-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Meta Gestão</h1>
                <p className="text-sm text-muted-foreground">{displayName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Team Selector */}
              {(isDiretor() || isAdmin()) && teams.length > 0 && (
                <select
                  value={selectedTeamId || ''}
                  onChange={(e) => setSelectedTeamId(e.target.value || null)}
                  className="h-10 px-3 rounded-lg bg-card border border-border text-sm font-medium text-foreground outline-none cursor-pointer"
                >
                  <option value="">Todas as Equipes</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              )}

              {/* Year Selector */}
              <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1.5 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)} className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5 min-w-[90px] justify-center px-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">{selectedYear}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= new Date().getFullYear() + 1} className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-border/50 bg-card relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-primary/50" />
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Meta Anual</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrencyCompact(annualGoal)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Objetivo {selectedYear}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-info to-info/50" />
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Realizado</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrencyCompact(yearlyData.totalVGV)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <DollarSign className="w-3.5 h-3.5 text-info" />
                  <span className="text-xs text-muted-foreground">{yearlyData.totalSales} vendas</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 right-0 h-[2px]", annualProgress >= 80 ? "bg-gradient-to-r from-success to-success/50" : annualProgress >= 40 ? "bg-gradient-to-r from-warning to-warning/50" : "bg-gradient-to-r from-destructive to-destructive/50")} />
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Atingimento</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{annualProgress.toFixed(1)}%</p>
                <Progress value={Math.min(annualProgress, 100)} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 right-0 h-[2px]", probability.current >= 70 ? "bg-gradient-to-r from-success to-success/50" : probability.current >= 40 ? "bg-gradient-to-r from-warning to-warning/50" : "bg-gradient-to-r from-destructive to-destructive/50")} />
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Probabilidade</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{probability.current}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">projeção anual</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Annual Goal Edit Block */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Meta Financeira Anual
                </CardTitle>
                {canManage && (
                  <Button size="sm" onClick={handleSaveTargets} disabled={savingTargets}>
                    {savingTargets ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Salvar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Meta Anual de Faturamento
                </Label>
                {editingAnnualGoal && canManage ? (
                  <div className="flex items-center gap-2">
                    <CurrencyInput 
                      value={annualGoal}
                      onChange={(val) => setAnnualGoal(val)}
                      className="h-12 text-xl font-bold flex-1"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => { setEditingAnnualGoal(false); handleSaveTargets(); }} className="h-12 w-12">
                      <Save className="w-5 h-5 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingAnnualGoal(false)} className="h-12 w-12">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(annualGoal)}</span>
                    {canManage && (
                      <Button size="icon" variant="ghost" onClick={() => setEditingAnnualGoal(true)} className="h-8 w-8">
                        <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Progressão: <strong>{formatCurrencyCompact(monthlyProgression[0])}</strong> (Jan) → <strong>{formatCurrencyCompact(monthlyProgression[11])}</strong> (Dez)
                </p>
              </div>
              
              {/* Progress + Gauge */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Progresso Anual</span>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      annualProgress >= 90 ? "border-success/30 text-success bg-success/10" :
                      annualProgress >= 50 ? "border-warning/30 text-warning bg-warning/10" :
                      "border-destructive/30 text-destructive bg-destructive/10"
                    )}>
                      {annualProgress >= 90 ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                       annualProgress >= 50 ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                       <Clock className="w-3 h-3 mr-1" />}
                      {annualProgress >= 90 ? 'No caminho' : annualProgress >= 50 ? 'Atenção' : 'Acelerar'}
                    </Badge>
                  </div>
                  <Progress value={Math.min(annualProgress, 100)} className="h-4" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Realizado: <strong className="text-foreground">{formatCurrency(yearlyData.totalVGV)}</strong></span>
                    <span>Faltam: <strong className="text-foreground">{formatCurrencyCompact(remaining)}</strong></span>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
                    {[
                      { label: 'Ticket Médio', value: yearlyData.totalSales > 0 ? formatCurrencyCompact(yearlyData.totalVGV / yearlyData.totalSales) : 'R$ 0' },
                      { label: 'VGV/Corretor', value: brokerStats.activeBrokers > 0 ? formatCurrencyCompact(yearlyData.totalVGV / brokerStats.activeBrokers) : 'R$ 0' },
                      { label: 'VGC Total', value: formatCurrencyCompact(yearlyData.totalVGC) },
                      { label: 'Crescimento', value: performanceStats?.avgGrowth ? `${performanceStats.avgGrowth > 0 ? '+' : ''}${performanceStats.avgGrowth.toFixed(1)}%` : '0%' },
                    ].map((stat, i) => (
                      <div key={i}>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-base font-semibold text-foreground">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Gauge */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-muted/20" />
                      <circle 
                        cx="50" cy="50" r="42" fill="none" strokeWidth="10"
                        strokeLinecap="round"
                        className={cn("transition-all duration-700",
                          annualProgress >= 90 ? "stroke-success" : annualProgress >= 50 ? "stroke-warning" : "stroke-destructive"
                        )}
                        strokeDasharray={`${Math.min(annualProgress, 100) * 2.64} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">{Math.round(annualProgress)}%</span>
                      <span className="text-[10px] text-muted-foreground">atingido</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Monthly Goals Table */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-5 h-5 text-primary" />
                Progressão Mensal
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {canManage ? "Clique no ícone de lápis para editar metas individuais." : "Acompanhamento mensal de metas e realização."}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mês</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meta VGV</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corretores</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Realizado</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diferença</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">%</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyGoals.map((goal, idx) => {
                      const monthIndex = goal.monthIndex;
                      const currentGoalValue = getMonthlyGoal(monthIndex);
                      const achieved = goal.achieved;
                      const difference = achieved - currentGoalValue;
                      const percentAchieved = currentGoalValue > 0 ? (achieved / currentGoalValue) * 100 : 0;
                      const isCurrentMonth = isSameMonth(goal.month, new Date());
                      const brokerGoalForMonth = editableMonthlyBrokers[monthIndex] ?? Math.ceil(brokerHiringGoal / 12 * monthIndex);
                      
                      return (
                        <tr key={idx} className={cn(
                          "border-b border-border/50 hover:bg-muted/30 transition-colors",
                          isCurrentMonth && "bg-primary/5"
                        )}>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize text-sm text-foreground">
                                {format(goal.month, 'MMM', { locale: ptBR })}
                              </span>
                              {isCurrentMonth && <Badge variant="outline" className="text-[10px] h-5 px-1.5">Atual</Badge>}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">
                            {editingMonthlyGoal === monthIndex && canManage ? (
                              <CurrencyInput
                                value={editableMonthlyGoals[monthIndex] ?? monthlyProgression[idx] ?? 0}
                                onChange={(val) => handleMonthlyGoalChange(monthIndex, val)}
                                onBlur={() => { saveMonthlyGoal(monthIndex); setEditingMonthlyGoal(null); }}
                                className="h-8 text-sm text-center max-w-[120px] mx-auto"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-mono text-sm text-foreground">{formatCurrencyCompact(currentGoalValue)}</span>
                                {canManage && (
                                  <Button size="icon" variant="ghost" onClick={() => setEditingMonthlyGoal(monthIndex)} className="h-6 w-6">
                                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            {editingMonthlyBroker === monthIndex && canManage ? (
                              <Input
                                type="number"
                                value={editableMonthlyBrokers[monthIndex] ?? brokerGoalForMonth}
                                onChange={(e) => handleMonthlyBrokerChange(monthIndex, parseInt(e.target.value) || 0)}
                                onBlur={() => setEditingMonthlyBroker(null)}
                                className="h-8 text-sm text-center max-w-[70px] mx-auto"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-mono text-sm text-foreground">{editableMonthlyBrokers[monthIndex] ?? brokerGoalForMonth}</span>
                                {canManage && (
                                  <Button size="icon" variant="ghost" onClick={() => setEditingMonthlyBroker(monthIndex)} className="h-6 w-6">
                                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="text-right py-3 px-2 font-mono text-sm font-medium text-foreground">
                            {formatCurrencyCompact(achieved)}
                          </td>
                          <td className={cn("text-right py-3 px-2 font-mono text-sm", difference >= 0 ? "text-success" : "text-destructive")}>
                            <span className="flex items-center justify-end gap-1">
                              {difference >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {formatCurrencyCompact(Math.abs(difference))}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={cn("text-sm font-semibold",
                              percentAchieved >= 100 ? "text-success" : percentAchieved >= 50 ? "text-warning" : "text-destructive"
                            )}>
                              {percentAchieved.toFixed(0)}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full mx-auto",
                              percentAchieved >= 100 ? "bg-success" : percentAchieved >= 50 ? "bg-warning" : currentGoalValue > 0 ? "bg-destructive" : "bg-muted"
                            )} />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-muted/50 font-semibold">
                      <td className="py-3 px-2 text-sm text-foreground">Total</td>
                      <td className="text-center py-3 px-2 font-mono text-sm">{formatCurrencyCompact(recalculatedAnnualGoal)}</td>
                      <td className="text-center py-3 px-2 font-mono text-sm">{brokerHiringGoal}</td>
                      <td className="text-right py-3 px-2 font-mono text-sm">{formatCurrencyCompact(yearlyData.totalVGV)}</td>
                      <td className={cn("text-right py-3 px-2 font-mono text-sm", yearlyData.totalVGV - recalculatedAnnualGoal >= 0 ? "text-success" : "text-destructive")}>
                        {formatCurrencyCompact(Math.abs(yearlyData.totalVGV - recalculatedAnnualGoal))}
                      </td>
                      <td className="text-center py-3 px-2 text-sm">{annualProgress.toFixed(0)}%</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Broker Hiring + Projections Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Broker Hiring */}
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-primary" />
                  Meta de Corretores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{brokerStats.activeBrokers}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-primary/5">
                    {editingBrokerHiringGoal && canManage ? (
                      <Input 
                        type="number" value={brokerHiringGoal}
                        onChange={(e) => setBrokerHiringGoal(parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingBrokerHiringGoal(false)}
                        className="text-center text-xl font-bold h-10 max-w-[60px] mx-auto" autoFocus
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-2xl font-bold text-primary">{brokerHiringGoal}</p>
                        {canManage && (
                          <Button size="icon" variant="ghost" onClick={() => setEditingBrokerHiringGoal(true)} className="h-6 w-6">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Meta</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-warning/5">
                    <p className="text-2xl font-bold text-warning">{Math.max(0, brokerHiringGoal - brokerStats.activeBrokers)}</p>
                    <p className="text-xs text-muted-foreground">Faltam</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span className="font-medium text-foreground">
                      {brokerHiringGoal > 0 ? Math.round((brokerStats.activeBrokers / brokerHiringGoal) * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={brokerHiringGoal > 0 ? Math.min((brokerStats.activeBrokers / brokerHiringGoal) * 100, 100) : 0} className="h-2" />
                </div>
                
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground">Ritmo necessário</p>
                  <p className="text-base font-semibold text-foreground">
                    ~{Math.ceil(Math.max(0, brokerHiringGoal - brokerStats.activeBrokers) / Math.max(1, 12 - new Date().getMonth()))} contratações/mês
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Projections */}
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Projeções
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Conservador', value: Math.max(0, probability.current - 15), icon: TrendingDown, color: 'text-muted-foreground' },
                    { label: 'Realista', value: probability.current, icon: Target, color: 'text-primary', highlight: true },
                    { label: 'Agressivo', value: probability.withHigherTicket, icon: TrendingUp, color: 'text-success' },
                  ].map((scenario, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-xl text-center",
                      scenario.highlight ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
                    )}>
                      <scenario.icon className={cn("w-5 h-5 mx-auto mb-1", scenario.color)} />
                      <p className="text-2xl font-bold text-foreground">{scenario.value}%</p>
                      <p className="text-[10px] text-muted-foreground">{scenario.label}</p>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                  <p className="text-xs font-medium text-info mb-1.5">Insights</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• +3 corretores → <strong className="text-foreground">{probability.withMoreBrokers}%</strong></li>
                    <li>• +15% ticket → <strong className="text-foreground">{probability.withHigherTicket}%</strong></li>
                    <li>• Crescimento médio: <strong className="text-foreground">{performanceStats?.avgGrowth?.toFixed(1) || 0}%</strong></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Executive Overview */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-5 h-5 text-primary" />
                Visão Executiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { 
                    label: 'Melhor Mês', 
                    value: performanceStats?.bestMonth ? formatCurrencyCompact(performanceStats.bestMonth.achieved) : 'R$ 0',
                    sub: performanceStats?.bestMonth ? format(performanceStats.bestMonth.month, 'MMMM', { locale: ptBR }) : '-',
                    icon: '🏆'
                  },
                  { 
                    label: 'Pior Mês', 
                    value: performanceStats?.worstMonth ? formatCurrencyCompact(performanceStats.worstMonth.achieved) : 'R$ 0',
                    sub: performanceStats?.worstMonth ? format(performanceStats.worstMonth.month, 'MMMM', { locale: ptBR }) : '-',
                    icon: '📉'
                  },
                  { label: 'Vendas no Ano', value: String(yearlyData.totalSales || 0), sub: 'unidades', icon: '🏠' },
                  { 
                    label: 'Distância p/ Meta', 
                    value: yearlyData.totalVGV >= annualGoal && annualGoal > 0 ? 'Atingida!' : formatCurrencyCompact(remaining),
                    sub: yearlyData.totalVGV >= annualGoal && annualGoal > 0 ? '✅' : 'restantes',
                    icon: '🎯'
                  },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 text-center">
                    <p className="text-lg mb-0.5">{item.icon}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-base font-bold text-foreground mt-0.5">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{item.sub}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals Section */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-primary" />
                  Metas Personalizadas
                </CardTitle>
                {canManage && (
                  <Button size="sm" onClick={() => setShowCreateGoal(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nova Meta
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Crie e acompanhe metas de vendas, captação, contratação e mais.
              </p>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-64" />)}
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma meta criada ainda</p>
                  <p className="text-xs mt-1">Clique em "Nova Meta" para começar</p>
                </div>
              ) : (
                <>
                  {/* Active goals summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Ativas', value: goals.filter(g => g.status === 'active').length, color: 'text-primary' },
                      { label: 'Concluídas', value: goals.filter(g => g.status === 'completed').length, color: 'text-success' },
                      { label: 'Pausadas', value: goals.filter(g => g.status === 'paused').length, color: 'text-warning' },
                      { label: 'Vencidas', value: goals.filter(g => g.status === 'active' && new Date(g.end_date) < new Date()).length, color: 'text-destructive' },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/30 text-center">
                        <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map(goal => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onClick={() => setSelectedGoal(goal)}
                        canEdit={canEditGoal(goal)}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dialogs */}
          <CreateGoalDialog
            open={showCreateGoal}
            onOpenChange={setShowCreateGoal}
            onCreate={createGoal}
          />

          {selectedGoal && (
            <GoalDetailsDialog
              open={!!selectedGoal}
              onOpenChange={(open) => !open && setSelectedGoal(null)}
              goal={selectedGoal}
              onUpdate={updateGoal}
              canEdit={canEditGoal(selectedGoal)}
            />
          )}
          
        </div>
      </div>
    </>
  );
};

export default MetaGestao;
