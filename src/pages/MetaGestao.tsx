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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Target, Users, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Edit2, Save, X,
  AlertTriangle, CheckCircle2, Clock, Building2, Plus, Loader2, Lightbulb, Eye,
  Trophy, Banknote, UserCheck, Crosshair
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, differenceInDays, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

interface MonthlyGoal {
  month: Date;
  monthIndex: number;
  target: number;
  expectedTarget: number;
  achieved: number;
  difference: number;
  percentAchieved: number;
}

const getRecordTimestamp = (record: { updated_at?: string | null; created_at?: string | null }) => {
  const updatedAt = record.updated_at ? new Date(record.updated_at).getTime() : 0;
  const createdAt = record.created_at ? new Date(record.created_at).getTime() : 0;
  return Math.max(updatedAt, createdAt, 0);
};

const useManagementGoals = (year: number, teamFilter?: string | null) => {
  const { sales, targets, brokers } = useData();

  const filteredBrokerIds = useMemo(() => {
    if (!teamFilter) return null;
    return brokers.filter((broker) => broker.team_id === teamFilter).map((broker) => broker.id);
  }, [brokers, teamFilter]);

  const scopedTargets = useMemo(() => {
    return targets.filter((target) => {
      const isBrokerTarget = target.broker_id !== null;
      if (isBrokerTarget) return false;
      if (teamFilter) return target.team_id === teamFilter;
      return target.team_id === null;
    });
  }, [targets, teamFilter]);

  const yearSales = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    return sales.filter((sale) => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      const inYear = saleDate >= yearStart && saleDate <= yearEnd && sale.status === 'confirmada' && sale.tipo !== 'captacao';
      if (!inYear) return false;
      if (filteredBrokerIds && sale.broker_id) return filteredBrokerIds.includes(sale.broker_id);
      return !filteredBrokerIds;
    });
  }, [sales, year, filteredBrokerIds]);

  const latestTargetByMonth = useMemo(() => {
    const monthMap = new Map<number, (typeof scopedTargets)[number]>();
    scopedTargets
      .filter((target) => target.year === year && target.month > 0)
      .forEach((target) => {
        const current = monthMap.get(target.month);
        if (!current || getRecordTimestamp(target) >= getRecordTimestamp(current)) {
          monthMap.set(target.month, target);
        }
      });
    return monthMap;
  }, [scopedTargets, year]);

  const monthlyAchievedByMonth = useMemo(() => {
    const achievedMap = new Map<number, number>();
    yearSales.forEach((sale) => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      const monthIndex = saleDate.getMonth() + 1;
      achievedMap.set(monthIndex, (achievedMap.get(monthIndex) || 0) + (sale.vgv || 0));
    });
    return achievedMap;
  }, [yearSales]);

  const monthlyGoals = useMemo((): MonthlyGoal[] => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map((month) => {
      const monthIndex = month.getMonth() + 1;
      const target = latestTargetByMonth.get(monthIndex)?.target_value || 0;
      const achieved = monthlyAchievedByMonth.get(monthIndex) || 0;

      return {
        month,
        monthIndex,
        target,
        expectedTarget: 0,
        achieved,
        difference: achieved - target,
        percentAchieved: target > 0 ? (achieved / target) * 100 : 0,
      };
    });
  }, [year, latestTargetByMonth, monthlyAchievedByMonth]);

  const yearlyData = useMemo(() => {
    const totalVGV = yearSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
    const totalVGC = yearSales.reduce((sum, sale) => sum + (sale.vgc || 0), 0);
    const totalSales = yearSales.length;
    const monthlyTargetsSum = Array.from(latestTargetByMonth.values()).reduce((sum, target) => sum + target.target_value, 0);
    return { totalVGV, totalVGC, totalSales, monthlyTargetsSum, yearSales };
  }, [yearSales, latestTargetByMonth]);

  const brokerStats = useMemo(() => {
    const scopedBrokers = teamFilter ? brokers.filter((broker) => broker.team_id === teamFilter) : brokers;
    const activeBrokerIds = new Set(scopedBrokers.filter((broker) => broker.status === 'ativo').map((broker) => broker.id));
    const activeWithSales = new Set(
      yearSales.map((sale) => sale.broker_id).filter((brokerId): brokerId is string => !!brokerId && activeBrokerIds.has(brokerId))
    ).size;
    return { activeBrokers: activeBrokerIds.size, activeWithSales, totalBrokers: scopedBrokers.length };
  }, [brokers, teamFilter, yearSales]);

  const performanceStats = useMemo(() => {
    const completedMonths = monthlyGoals.filter((month) => month.achieved > 0 || month.target > 0);
    if (completedMonths.length === 0) return null;

    const bestMonth = completedMonths.reduce((best, month) => (month.achieved > best.achieved ? month : best), completedMonths[0]);
    const worstMonth = completedMonths.reduce((worst, month) => (month.achieved < worst.achieved ? month : worst), completedMonths[0]);

    const monthlyGrowth: number[] = [];
    for (let i = 1; i < monthlyGoals.length; i++) {
      const previous = monthlyGoals[i - 1].achieved;
      const current = monthlyGoals[i].achieved;
      if (previous > 0) monthlyGrowth.push(((current - previous) / previous) * 100);
    }
    const avgGrowth = monthlyGrowth.length > 0 ? monthlyGrowth.reduce((s, g) => s + g, 0) / monthlyGrowth.length : 0;
    return { bestMonth, worstMonth, avgGrowth };
  }, [monthlyGoals]);

  return { yearlyData, monthlyGoals, brokerStats, performanceStats };
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
  const [showAllMonths, setShowAllMonths] = useState(false);
  
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

  const canManage = isAdmin() || isDiretor() || isGerente();
  const { yearlyData, monthlyGoals, brokerStats, performanceStats } = useManagementGoals(selectedYear, teamFilter);
  const isLoading = brokersLoading || teamsLoading || targetsLoading || salesLoading;

  const [dbMonthlyGoals, setDbMonthlyGoals] = useState<{ [month: number]: number }>({});

  const scopedTargetsByMonth = useMemo(() => {
    const monthMap = new Map<number, (typeof targets)[number]>();
    targets
      .filter((target) => {
        if (target.year !== selectedYear) return false;
        if (target.broker_id !== null) return false;
        if (target.month === 0) return false;
        if (teamFilter) return target.team_id === teamFilter;
        return target.team_id === null;
      })
      .forEach((target) => {
        const existing = monthMap.get(target.month);
        if (!existing || getRecordTimestamp(target) >= getRecordTimestamp(existing)) {
          monthMap.set(target.month, target);
        }
      });
    return monthMap;
  }, [targets, selectedYear, teamFilter]);

  const annualTargetRecord = useMemo(() => {
    const annualTargets = targets.filter((target) => {
      if (target.year !== selectedYear) return false;
      if (target.broker_id !== null) return false;
      if (target.month !== 0) return false;
      if (teamFilter) return target.team_id === teamFilter;
      return target.team_id === null;
    });
    if (annualTargets.length === 0) return null;
    return annualTargets.reduce((latest, t) =>
      getRecordTimestamp(t) >= getRecordTimestamp(latest) ? t : latest
    , annualTargets[0]);
  }, [targets, selectedYear, teamFilter]);

  useEffect(() => {
    setAnnualGoal(annualTargetRecord?.target_value || 0);
  }, [annualTargetRecord, selectedYear, teamFilter]);

  useEffect(() => {
    const savedMonthlyGoals: { [month: number]: number } = {};
    monthlyGoals.forEach((goal) => { savedMonthlyGoals[goal.monthIndex] = goal.target; });
    setEditableMonthlyGoals(savedMonthlyGoals);
    setDbMonthlyGoals(savedMonthlyGoals);
  }, [monthlyGoals, selectedYear, teamFilter]);

  const effectiveAnnualGoal = Math.max(0, annualGoal);

  const monthlyTargetsTotal = useMemo(
    () => monthlyGoals.reduce((sum, g) => sum + (editableMonthlyGoals[g.monthIndex] ?? g.target), 0),
    [monthlyGoals, editableMonthlyGoals]
  );

  const getMonthlyGoal = (monthIndex: number): number => {
    if (editableMonthlyGoals[monthIndex] !== undefined) return editableMonthlyGoals[monthIndex];
    if (dbMonthlyGoals[monthIndex] !== undefined) return dbMonthlyGoals[monthIndex];
    return 0;
  };

  const handleMonthlyGoalChange = (monthIndex: number, value: number) => {
    setEditableMonthlyGoals((prev) => ({ ...prev, [monthIndex]: Math.max(0, value || 0) }));
  };

  const saveMonthlyGoal = async (monthIndex: number) => {
    const value = Math.max(0, editableMonthlyGoals[monthIndex] || 0);
    try {
      const existingTarget = scopedTargetsByMonth.get(monthIndex);
      if (existingTarget) {
        await updateTarget(existingTarget.id, { target_value: value });
      } else {
        await createTarget({ year: selectedYear, month: monthIndex, target_value: value, team_id: teamFilter ?? null, broker_id: null } as any);
      }
      setDbMonthlyGoals((prev) => ({ ...prev, [monthIndex]: value }));
      setEditableMonthlyGoals((prev) => ({ ...prev, [monthIndex]: value }));
      toast.success(`Meta de ${format(new Date(selectedYear, monthIndex - 1), 'MMMM', { locale: ptBR })} salva!`);
    } catch {
      toast.error('Erro ao salvar meta mensal');
    }
  };

  const handleSaveTargets = async (monthlyOverrides?: { [month: number]: number }) => {
    setSavingTargets(true);
    try {
      const operations: Promise<void>[] = [];
      for (let month = 1; month <= 12; month++) {
        const monthlyValue = Math.max(0, Number(monthlyOverrides?.[month] ?? getMonthlyGoal(month)) || 0);
        const existingTarget = scopedTargetsByMonth.get(month);
        if (existingTarget) {
          if (Math.abs(existingTarget.target_value - monthlyValue) > 0.01) {
            operations.push(updateTarget(existingTarget.id, { target_value: monthlyValue }));
          }
        } else if (monthlyValue > 0) {
          operations.push(createTarget({ year: selectedYear, month, target_value: monthlyValue, team_id: teamFilter ?? null, broker_id: null } as any));
        }
      }
      await Promise.all(operations);
      if (monthlyOverrides) setEditableMonthlyGoals(monthlyOverrides);
      toast.success('Metas salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar metas');
    } finally {
      setSavingTargets(false);
    }
  };

  const annualProgress = effectiveAnnualGoal > 0 ? (yearlyData.totalVGV / effectiveAnnualGoal) * 100 : 0;
  const isGoalExceeded = yearlyData.totalVGV >= effectiveAnnualGoal && effectiveAnnualGoal > 0;
  const remaining = Math.max(0, effectiveAnnualGoal - yearlyData.totalVGV);
  const exceededBy = Math.max(0, yearlyData.totalVGV - effectiveAnnualGoal);

  const componentProbability = useMemo(() => {
    if (effectiveAnnualGoal === 0) return { current: 0, withMoreBrokers: 0, withHigherTicket: 0 };
    const yearProgress = (new Date().getMonth() + 1) / 12;
    const projectedTotal = yearProgress > 0 ? yearlyData.totalVGV / yearProgress : 0;
    const baseProb = Math.min(100, (projectedTotal / effectiveAnnualGoal) * 100);
    return {
      current: Math.round(baseProb),
      withMoreBrokers: Math.round(Math.min(100, baseProb * 1.15)),
      withHigherTicket: Math.round(Math.min(100, baseProb * 1.2)),
    };
  }, [effectiveAnnualGoal, yearlyData.totalVGV]);

  const recentMonthlyAverage = useMemo(() => {
    const achievedMonths = monthlyGoals.filter((month) => month.achieved > 0);
    const recentMonths = achievedMonths.slice(-3);
    if (recentMonths.length === 0) return 0;
    return recentMonths.reduce((sum, month) => sum + month.achieved, 0) / recentMonths.length;
  }, [monthlyGoals]);

  const handleSaveAnnualGoal = async () => {
    let normalizedAnnualGoal = Math.max(0, Number(annualGoal) || 0);
    const looksLikeThousandScaleMismatch =
      normalizedAnnualGoal > 0 && normalizedAnnualGoal < 100000 &&
      recentMonthlyAverage >= 100000 && normalizedAnnualGoal < recentMonthlyAverage;

    if (looksLikeThousandScaleMismatch) {
      const shouldConvertScale = window.confirm(
        `O valor informado (${formatCurrency(normalizedAnnualGoal)}) parece estar em milhares.\n\nDeseja converter automaticamente para ${formatCurrency(normalizedAnnualGoal * 1000)}?`
      );
      if (shouldConvertScale) normalizedAnnualGoal = normalizedAnnualGoal * 1000;
    }

    if (normalizedAnnualGoal > 0 && recentMonthlyAverage > 0 && normalizedAnnualGoal < recentMonthlyAverage) {
      const shouldContinue = window.confirm(
        `A meta anual (${formatCurrency(normalizedAnnualGoal)}) está abaixo da média dos últimos 3 meses (${formatCurrency(recentMonthlyAverage)}). Deseja salvar mesmo assim?`
      );
      if (!shouldContinue) return;
    }

    try {
      setSavingTargets(true);
      if (annualTargetRecord) {
        await updateTarget(annualTargetRecord.id, { target_value: normalizedAnnualGoal });
      } else {
        await createTarget({ year: selectedYear, month: 0, target_value: normalizedAnnualGoal, team_id: teamFilter ?? null, broker_id: null } as any);
      }
      setAnnualGoal(normalizedAnnualGoal);
      setEditingAnnualGoal(false);
      toast.success('Meta anual salva com sucesso!');
    } catch {
      toast.error('Erro ao salvar meta anual');
    } finally {
      setSavingTargets(false);
    }
  };

  const formatPercentDisplay = (value: number, decimals = 1) => {
    if (!isFinite(value)) return '0%';
    if (value >= 999.9) return '999%+';
    return `${value.toFixed(decimals)}%`;
  };

  // Current month data
  const now = new Date();
  const currentMonthIndex = now.getMonth() + 1;
  const currentMonthGoal = monthlyGoals.find(m => m.monthIndex === currentMonthIndex);
  const currentMonthTarget = getMonthlyGoal(currentMonthIndex);
  const currentMonthAchieved = currentMonthGoal?.achieved || 0;
  const currentMonthPercent = currentMonthTarget > 0 ? (currentMonthAchieved / currentMonthTarget) * 100 : 0;
  const currentMonthRemaining = Math.max(0, currentMonthTarget - currentMonthAchieved);
  const daysInMonth = getDaysInMonth(now);
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  const dailyNeeded = daysRemaining > 0 ? currentMonthRemaining / daysRemaining : 0;
  const monthProbability = useMemo(() => {
    if (currentMonthTarget <= 0) return 0;
    const dayProgress = dayOfMonth / daysInMonth;
    if (dayProgress <= 0) return 0;
    const projected = currentMonthAchieved / dayProgress;
    return Math.min(100, Math.round((projected / currentMonthTarget) * 100));
  }, [currentMonthAchieved, currentMonthTarget, dayOfMonth, daysInMonth]);

  const getProgressColor = (pct: number) => pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'destructive';
  const getProgressColorClass = (pct: number) => pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';
  const getProgressBg = (pct: number) => pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-destructive';

  // Smart insight
  const insightText = useMemo(() => {
    if (currentMonthTarget <= 0) return 'Defina uma meta mensal para receber insights.';
    if (currentMonthPercent >= 100) return `🎉 Parabéns! Meta do mês atingida! Você superou em ${formatCurrency(currentMonthAchieved - currentMonthTarget)}.`;
    if (currentMonthPercent >= 80) return `Você está perto! Faltam apenas ${formatCurrency(currentMonthRemaining)}. Mantenha o ritmo!`;
    if (daysRemaining > 0) {
      return `Você está ${formatPercentDisplay(100 - currentMonthPercent, 0)} abaixo da meta. Para bater, precisa vender ${formatCurrency(dailyNeeded)} por dia nos próximos ${daysRemaining} dias.`;
    }
    return `O mês encerrou. Resultado: ${formatPercentDisplay(currentMonthPercent, 1)} da meta.`;
  }, [currentMonthPercent, currentMonthRemaining, currentMonthTarget, currentMonthAchieved, dailyNeeded, daysRemaining]);

  const insightSuggestion = useMemo(() => {
    if (currentMonthPercent >= 100) return 'Aproveite o momento para aumentar o pipeline do próximo mês.';
    if (currentMonthPercent >= 60) return 'Foque em negociações quentes e agende visitas com leads ativos.';
    return 'Aumente o volume de negociações ou trabalhe para elevar o ticket médio.';
  }, [currentMonthPercent]);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background lg:ml-72">
          <div className="p-4 lg:p-6 space-y-6 pt-20 lg:pt-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </>
    );
  }

  const annualProgressVariant = annualProgress >= 80 ? 'success' : annualProgress >= 50 ? 'warning' : 'danger';

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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* BLOCO 1 – RESUMO KPIs (compacto) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Meta Anual */}
            <Card className="border-border/50 bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-primary/50" />
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Meta Anual</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(effectiveAnnualGoal)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Objetivo {selectedYear}</p>
              </CardContent>
            </Card>

            {/* Realizado */}
            <Card className="border-border/50 bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-info to-info/50" />
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Realizado</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(yearlyData.totalVGV)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{yearlyData.totalSales} vendas</p>
              </CardContent>
            </Card>

            {/* Atingimento */}
            <Card className="border-border/50 bg-card relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 right-0 h-[2px]", annualProgress >= 80 ? "bg-gradient-to-r from-success to-success/50" : annualProgress >= 50 ? "bg-gradient-to-r from-warning to-warning/50" : "bg-gradient-to-r from-destructive to-destructive/50")} />
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Atingimento</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{formatPercentDisplay(annualProgress, 1)}</p>
                <Progress value={Math.min(annualProgress, 100)} variant={annualProgressVariant} className="h-1.5 mt-1.5" />
              </CardContent>
            </Card>

            {/* Probabilidade */}
            <Card className="border-border/50 bg-card relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 right-0 h-[2px]", componentProbability.current >= 70 ? "bg-gradient-to-r from-success to-success/50" : componentProbability.current >= 40 ? "bg-gradient-to-r from-warning to-warning/50" : "bg-gradient-to-r from-destructive to-destructive/50")} />
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Probabilidade</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{componentProbability.current}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">projeção anual</p>
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* BLOCO 2 – FOCO NO MÊS ATUAL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Card className="border-primary/20 bg-card shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Evolução do Mês — {format(now, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {daysRemaining} dias restantes
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Main metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meta do Mês</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(currentMonthTarget)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Realizado</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(currentMonthAchieved)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Faltam</p>
                  <p className={cn("text-xl font-bold", currentMonthPercent >= 100 ? "text-success" : "text-foreground")}>
                    {currentMonthPercent >= 100 ? formatCurrency(currentMonthAchieved - currentMonthTarget) : formatCurrency(currentMonthRemaining)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Probabilidade</p>
                  <p className={cn("text-xl font-bold", getProgressColorClass(monthProbability))}>{monthProbability}%</p>
                </div>
              </div>

              {/* Big progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{formatPercentDisplay(currentMonthPercent, 1)} concluído</span>
                  <span className="text-sm text-muted-foreground">Dia {dayOfMonth}/{daysInMonth}</span>
                </div>
                <div className="w-full rounded-full overflow-hidden h-4 bg-muted/30">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", getProgressBg(currentMonthPercent))}
                    style={{ width: `${Math.min(currentMonthPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Daily need + edit */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Ritmo necessário para bater a meta</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(dailyNeeded)}<span className="text-xs font-normal text-muted-foreground"> /dia</span></p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2">
                    {editingMonthlyGoal === currentMonthIndex ? (
                      <div className="flex items-center gap-2">
                        <CurrencyInput
                          value={editableMonthlyGoals[currentMonthIndex] ?? currentMonthTarget}
                          onChange={(val) => handleMonthlyGoalChange(currentMonthIndex, val)}
                          className="h-9 text-sm w-40"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={() => { saveMonthlyGoal(currentMonthIndex); setEditingMonthlyGoal(null); }}>
                          <Save className="w-4 h-4 text-success" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingMonthlyGoal(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setEditingMonthlyGoal(currentMonthIndex)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Editar Meta
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD INTELIGENTE – INSIGHT */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Análise Automática</p>
                <p className="text-sm text-muted-foreground">{insightText}</p>
                <p className="text-xs text-primary mt-1.5">💡 {insightSuggestion}</p>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* META ANUAL (configuração) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Meta Financeira Anual
                </CardTitle>
                {canManage && (
                  <Button size="sm" onClick={() => void handleSaveAnnualGoal()} disabled={savingTargets}>
                    {savingTargets ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Salvar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input + info */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                      Meta Anual de Faturamento
                    </Label>
                    {editingAnnualGoal && canManage ? (
                      <div className="flex items-center gap-2">
                        <CurrencyInput value={annualGoal} onChange={(val) => setAnnualGoal(val)} className="h-12 text-xl font-bold flex-1" autoFocus />
                        <Button size="icon" variant="ghost" onClick={() => void handleSaveAnnualGoal()} className="h-12 w-12">
                          <Save className="w-5 h-5 text-success" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingAnnualGoal(false)} className="h-12 w-12">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-foreground">{formatCurrency(effectiveAnnualGoal)}</span>
                        {canManage && (
                          <Button size="icon" variant="ghost" onClick={() => setEditingAnnualGoal(true)} className="h-8 w-8">
                            <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Meta definida manualmente pelo gestor — independente das metas mensais.
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progresso Anual</span>
                      <Badge variant="outline" className={cn("text-xs", annualProgress >= 100 ? "border-success/30 text-success bg-success/10" : annualProgress >= 80 ? "border-success/30 text-success bg-success/10" : annualProgress >= 50 ? "border-warning/30 text-warning bg-warning/10" : "border-destructive/30 text-destructive bg-destructive/10")}>
                        {annualProgress >= 100 ? '🎉 Meta atingida' : annualProgress >= 80 ? 'No caminho' : annualProgress >= 50 ? 'Em atenção' : 'Abaixo do esperado'}
                      </Badge>
                    </div>
                    <Progress value={Math.min(annualProgress, 100)} variant={annualProgressVariant} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Realizado: <strong className="text-foreground">{formatCurrency(yearlyData.totalVGV)}</strong></span>
                      {isGoalExceeded ? (
                        <span>Superada em: <strong className="text-success">{formatCurrency(exceededBy)}</strong></span>
                      ) : (
                        <span>Faltam: <strong className="text-foreground">{formatCurrency(remaining)}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gauge */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-muted/20" />
                      <circle
                        cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
                        className={cn("transition-all duration-700", annualProgress >= 80 ? "stroke-success" : annualProgress >= 50 ? "stroke-warning" : "stroke-destructive")}
                        strokeDasharray={`${Math.min(annualProgress, 100) * 2.64} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("text-xl font-bold", annualProgress >= 100 ? "text-success" : "text-foreground")}>
                        {formatPercentDisplay(annualProgress, 0)}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{annualProgress >= 100 ? 'atingida!' : 'atingido'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* BLOCO 3 – METAS MENSAIS (simplificado) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-primary" />
                  Metas Mensais
                </CardTitle>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => handleSaveTargets()} disabled={savingTargets}>
                      {savingTargets ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                      Salvar Todas
                    </Button>
                  )}
                  <Sheet open={showAllMonths} onOpenChange={setShowAllMonths}>
                    <SheetTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1.5" />
                        Ver todos os meses
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          Metas Mensais — {selectedYear}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="space-y-3 mt-6">
                        {monthlyGoals.map((goal) => {
                          const mi = goal.monthIndex;
                          const gv = getMonthlyGoal(mi);
                          const achieved = goal.achieved;
                          const pct = gv > 0 ? (achieved / gv) * 100 : 0;
                          const diff = achieved - gv;
                          const isCurrent = isSameMonth(goal.month, now);
                          const isEditing = editingMonthlyGoal === mi;

                          return (
                            <div key={mi} className={cn("rounded-xl border p-4 space-y-2", isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-card")}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold capitalize text-foreground">
                                  {format(goal.month, 'MMMM', { locale: ptBR })}
                                </span>
                                {isCurrent && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 text-primary">Atual</Badge>}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase">Meta</p>
                                  {isEditing && canManage ? (
                                    <CurrencyInput
                                      value={editableMonthlyGoals[mi] ?? gv}
                                      onChange={(val) => handleMonthlyGoalChange(mi, val)}
                                      onBlur={() => { saveMonthlyGoal(mi); setEditingMonthlyGoal(null); }}
                                      className="h-8 text-sm" autoFocus
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm font-bold text-foreground">{formatCurrency(gv)}</span>
                                      {canManage && (
                                        <Button size="icon" variant="ghost" onClick={() => setEditingMonthlyGoal(mi)} className="h-5 w-5">
                                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase">Realizado</p>
                                  <span className="text-sm font-bold text-foreground">{formatCurrency(achieved)}</span>
                                </div>
                              </div>
                              {gv > 0 && (
                                <div className="space-y-1">
                                  <div className="w-full rounded-full overflow-hidden h-1.5 bg-muted/30">
                                    <div className={cn("h-full rounded-full transition-all", getProgressBg(pct))} style={{ width: `${Math.min(pct, 100)}%` }} />
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span className={cn("font-semibold", getProgressColorClass(pct))}>{formatPercentDisplay(pct, 0)}</span>
                                    <span className={diff >= 0 ? "text-success" : "text-destructive"}>{diff >= 0 ? '+' : ''}{formatCurrency(diff)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* Totals */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Total Metas</span>
                            <span className="text-sm font-bold text-foreground">{formatCurrency(monthlyTargetsTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Total Realizado</span>
                            <span className="text-sm font-bold text-foreground">{formatCurrency(yearlyData.totalVGV)}</span>
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Show only current month + previous + next */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {monthlyGoals
                  .filter(g => Math.abs(g.monthIndex - currentMonthIndex) <= 1)
                  .map((goal) => {
                    const mi = goal.monthIndex;
                    const gv = getMonthlyGoal(mi);
                    const achieved = goal.achieved;
                    const pct = gv > 0 ? (achieved / gv) * 100 : 0;
                    const isCurrent = isSameMonth(goal.month, now);

                    return (
                      <div key={mi} className={cn("rounded-xl border p-4 space-y-3 transition-all", isCurrent ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card")}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold capitalize text-foreground">
                            {format(goal.month, 'MMMM', { locale: ptBR })}
                          </span>
                          {isCurrent && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 text-primary">Atual</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Meta</p>
                            <p className="text-sm font-bold text-foreground">{formatCurrency(gv)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Realizado</p>
                            <p className="text-sm font-bold text-foreground">{formatCurrency(achieved)}</p>
                          </div>
                        </div>
                        {gv > 0 && (
                          <div className="space-y-1">
                            <div className="w-full rounded-full overflow-hidden h-2 bg-muted/30">
                              <div className={cn("h-full rounded-full transition-all", getProgressBg(pct))} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <p className={cn("text-xs font-semibold text-center", getProgressColorClass(pct))}>
                              {formatPercentDisplay(pct, 0)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* VISÃO EXECUTIVA + PROJEÇÕES */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Executive Overview */}
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-5 h-5 text-primary" />
                  Visão Executiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Melhor Mês', value: performanceStats?.bestMonth ? formatCurrency(performanceStats.bestMonth.achieved) : 'R$ 0,00', sub: performanceStats?.bestMonth ? format(performanceStats.bestMonth.month, 'MMMM', { locale: ptBR }) : '-', icon: '🏆' },
                    { label: 'Ticket Médio', value: yearlyData.totalSales > 0 ? formatCurrency(yearlyData.totalVGV / yearlyData.totalSales) : 'R$ 0,00', sub: `${yearlyData.totalSales} vendas`, icon: '💰' },
                    { label: 'Corretores Ativos', value: String(brokerStats.activeBrokers), sub: `${brokerStats.activeWithSales} com vendas`, icon: '👥' },
                    { label: 'Distância p/ Meta', value: isGoalExceeded ? formatCurrency(exceededBy) : formatCurrency(remaining), sub: isGoalExceeded ? 'superada' : 'restantes', icon: '🎯' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/30 text-center">
                      <p className="text-lg mb-0.5">{item.icon}</p>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                      <p className="text-[9px] text-muted-foreground capitalize">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projections */}
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Projeções
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Conservador', value: Math.max(0, componentProbability.current - 15), icon: TrendingDown, color: 'text-muted-foreground' },
                    { label: 'Realista', value: componentProbability.current, icon: Target, color: 'text-primary', highlight: true },
                    { label: 'Agressivo', value: componentProbability.withHigherTicket, icon: TrendingUp, color: 'text-success' },
                  ].map((scenario, i) => (
                    <div key={i} className={cn("p-3 rounded-xl text-center", scenario.highlight ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30")}>
                      <scenario.icon className={cn("w-5 h-5 mx-auto mb-1", scenario.color)} />
                      <p className="text-xl font-bold text-foreground">{scenario.value}%</p>
                      <p className="text-[10px] text-muted-foreground">{scenario.label}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                  <p className="text-xs font-medium text-info mb-1.5">Insights</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• +3 corretores → <strong className="text-foreground">{componentProbability.withMoreBrokers}%</strong></li>
                    <li>• +15% ticket → <strong className="text-foreground">{componentProbability.withHigherTicket}%</strong></li>
                    <li>• Crescimento médio: <strong className="text-foreground">{performanceStats?.avgGrowth?.toFixed(1) || 0}%</strong></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* METAS PERSONALIZADAS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
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
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma meta criada ainda</p>
                  <p className="text-xs mt-1">Clique em "Nova Meta" para começar</p>
                </div>
              ) : (
                <>
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
                      <GoalCard key={goal.id} goal={goal} onClick={() => setSelectedGoal(goal)} canEdit={canEditGoal(goal)} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dialogs */}
          <CreateGoalDialog open={showCreateGoal} onOpenChange={setShowCreateGoal} onCreate={createGoal} />
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
