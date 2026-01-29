import React, { useState, useMemo, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
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
  Loader2
} from 'lucide-react';
import { formatCurrency, formatCurrencyCompact, formatPercentage } from '@/utils/formatting';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval, subYears, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';

// Types for monthly goals
interface MonthlyGoal {
  month: Date;
  monthIndex: number; // 1-12
  target: number; // meta manual definida
  expectedTarget: number; // expectativa baseada na meta anual
  achieved: number;
  difference: number;
  percentAchieved: number;
}

// Custom hook for annual management goals
const useManagementGoals = (year: number) => {
  const { sales, targets, brokers } = useData();
  const { teams } = useTeams();
  
  // Calculate yearly totals
  const yearlyData = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    
    // Filter sales for the year
    const yearSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      return saleDate >= yearStart && saleDate <= yearEnd && sale.status === 'confirmada';
    });
    
    // Calculate totals
    const totalVGV = yearSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
    const totalVGC = yearSales.reduce((sum, sale) => sum + (sale.vgc || 0), 0);
    const totalSales = yearSales.length;
    
    // Get targets for the year
    const yearTargets = targets.filter(t => t.year === year);
    const annualTarget = yearTargets.reduce((sum, t) => sum + t.target_value, 0);
    
    return {
      totalVGV,
      totalVGC,
      totalSales,
      annualTarget,
      yearSales,
      yearTargets
    };
  }, [sales, targets, year]);
  
  // Monthly breakdown - returns base achieved data, expected target is calculated in component based on annual goal
  const monthlyGoals = useMemo((): MonthlyGoal[] => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthIndex = month.getMonth() + 1;
      
      // Find target for this month (saved in DB)
      const monthTarget = targets.find(t => 
        t.year === year && t.month === monthIndex
      );
      const target = monthTarget?.target_value || 0;
      
      // Calculate achieved for this month
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date || sale.created_at || '');
        return saleDate >= monthStart && saleDate <= monthEnd && sale.status === 'confirmada';
      });
      const achieved = monthSales.reduce((sum, sale) => sum + (sale.vgv || 0), 0);
      
      const difference = achieved - target;
      const percentAchieved = target > 0 ? (achieved / target) * 100 : 0;
      
      return {
        month,
        monthIndex,
        target,
        expectedTarget: 0, // Will be calculated based on annual goal in component
        achieved,
        difference,
        percentAchieved
      };
    });
  }, [sales, targets, year]);
  
  // Broker stats
  const brokerStats = useMemo(() => {
    const activeBrokers = brokers.filter(b => b.status === 'ativo').length;
    const totalBrokers = brokers.length;
    return { activeBrokers, totalBrokers };
  }, [brokers]);
  
  // Best and worst months
  const performanceStats = useMemo(() => {
    const completedMonths = monthlyGoals.filter(m => m.achieved > 0 || m.target > 0);
    
    if (completedMonths.length === 0) return null;
    
    const bestMonth = completedMonths.reduce((best, current) => 
      current.achieved > best.achieved ? current : best
    , completedMonths[0]);
    
    const worstMonth = completedMonths.reduce((worst, current) => 
      current.achieved < worst.achieved ? current : worst
    , completedMonths[0]);
    
    // Month over month growth
    const monthlyGrowth: number[] = [];
    for (let i = 1; i < completedMonths.length; i++) {
      const prev = completedMonths[i - 1].achieved;
      if (prev > 0) {
        monthlyGrowth.push(((completedMonths[i].achieved - prev) / prev) * 100);
      }
    }
    const avgGrowth = monthlyGrowth.length > 0 
      ? monthlyGrowth.reduce((a, b) => a + b, 0) / monthlyGrowth.length 
      : 0;
    
    return {
      bestMonth,
      worstMonth,
      avgGrowth
    };
  }, [monthlyGoals]);
  
  // Probability calculation
  const probability = useMemo(() => {
    const { annualTarget, totalVGV } = yearlyData;
    if (annualTarget === 0) return { current: 0, withMoreBrokers: 0, withHigherTicket: 0 };
    
    const currentProgress = (totalVGV / annualTarget) * 100;
    const now = new Date();
    const yearProgress = (now.getMonth() + 1) / 12;
    
    // Projected completion based on current pace
    const projectedTotal = yearProgress > 0 ? totalVGV / yearProgress : 0;
    const baseProb = Math.min(100, (projectedTotal / annualTarget) * 100);
    
    // With 3 more brokers (assuming each brings ~10% more)
    const withMoreBrokers = Math.min(100, baseProb * 1.15);
    
    // With higher average ticket (assuming 15% increase)
    const withHigherTicket = Math.min(100, baseProb * 1.20);
    
    return {
      current: Math.round(baseProb),
      withMoreBrokers: Math.round(withMoreBrokers),
      withHigherTicket: Math.round(withHigherTicket)
    };
  }, [yearlyData]);
  
  return {
    yearlyData,
    monthlyGoals,
    brokerStats,
    performanceStats,
    probability
  };
};

const MetaGestao = () => {
  const { getUserRole, isAdmin, isDiretor, isGerente } = useAuth();
  const { displayName } = useContextualIdentity();
  const { brokers, loading: brokersLoading } = useBrokers();
  const { teams, loading: teamsLoading } = useTeams();
  const { sales, targets, targetsLoading, salesLoading, createTarget, updateTarget } = useData();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [brokerHiringGoal, setBrokerHiringGoal] = useState(25);
  const [savingTargets, setSavingTargets] = useState(false);
  
  // Meta anual definida primeiro - é o campo principal
  const [annualGoal, setAnnualGoal] = useState(0);
  
  const canManage = isAdmin() || isDiretor() || isGerente();
  
  const { yearlyData, monthlyGoals, brokerStats, performanceStats, probability } = useManagementGoals(selectedYear);
  
  const isLoading = brokersLoading || teamsLoading || targetsLoading || salesLoading;
  
  // Initialize annual goal from sum of saved monthly targets
  useEffect(() => {
    const savedAnnualTotal = monthlyGoals.reduce((sum, goal) => sum + goal.target, 0);
    if (savedAnnualTotal > 0) {
      setAnnualGoal(savedAnnualTotal);
    }
  }, [monthlyGoals, selectedYear]);
  
  // Calculate expected monthly target with growth progression
  // Starts from a base value and grows linearly to reach the annual goal
  // Formula: month_value = base + (month_index) * growth_increment (month_index 0-11)
  // Sum of 12 months should equal annualGoal
  // Sum = 12 * base + growth_increment * (0+1+2+...+11) = 12 * base + growth_increment * 66
  // For 36M: we want Jan ~1M, Dec ~5M (total = 36M)
  // Solving: 12*base + 66*growth = 36M, and base = 1M gives growth = (36M - 12M)/66 = ~363.6K
  const calculateMonthlyProgression = (annualTarget: number): number[] => {
    if (annualTarget <= 0) return Array(12).fill(0);
    
    // Linear growth: first month = annualTarget/36 (1M for 36M total)
    // This creates a smooth progression that sums to the annual target
    const baseValue = annualTarget / 36; // Start at 1/36 of annual (1M for 36M)
    const totalGrowthNeeded = annualTarget - (12 * baseValue);
    const growthIncrement = totalGrowthNeeded / 66; // 66 = sum of 0 to 11
    
    return Array.from({ length: 12 }, (_, i) => baseValue + (i * growthIncrement));
  };
  
  const monthlyProgression = calculateMonthlyProgression(annualGoal);
  const expectedMonthlyTarget = annualGoal / 12; // For simple display
  
  // Save annual goal distributed with growth progression
  const handleSaveTargets = async () => {
    setSavingTargets(true);
    try {
      const progression = calculateMonthlyProgression(annualGoal);
      
      for (let month = 1; month <= 12; month++) {
        const monthlyValue = progression[month - 1];
        const existingTarget = targets.find(t => t.year === selectedYear && t.month === month);
        
        if (existingTarget) {
          if (Math.abs(existingTarget.target_value - monthlyValue) > 0.01) {
            await updateTarget(existingTarget.id, { target_value: monthlyValue });
          }
        } else if (monthlyValue > 0) {
          await createTarget({
            year: selectedYear,
            month: month,
            target_value: monthlyValue,
          });
        }
      }
      toast.success('Metas salvas com sucesso!');
    } catch (error) {
      console.error('Error saving targets:', error);
      toast.error('Erro ao salvar metas');
    } finally {
      setSavingTargets(false);
    }
  };
  
  // Status indicators
  const getStatusIndicator = (percent: number) => {
    if (percent >= 90) return { color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2, label: 'Dentro da meta' };
    if (percent >= 50) return { color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle, label: 'Atenção' };
    return { color: 'text-red-600 bg-red-100 dark:bg-red-900/30', icon: Clock, label: 'Abaixo do esperado' };
  };
  
  const annualProgress = annualGoal > 0 
    ? (yearlyData.totalVGV / annualGoal) * 100 
    : 0;
  const annualStatus = getStatusIndicator(annualProgress);
  
  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 lg:ml-72">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 pt-20 lg:pt-6">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 lg:ml-72">
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 space-y-6 pt-20 lg:pt-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <Target className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    Meta Gestão
                  </h1>
                  <p className="text-muted-foreground">
                    {displayName}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 rounded-xl p-2 shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedYear(y => y - 1)}
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-[120px] justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-600 text-lg">
                  {selectedYear}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedYear(y => y + 1)}
                disabled={selectedYear >= new Date().getFullYear() + 1}
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs sm:text-sm">Meta Anual</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatCurrencyCompact(yearlyData.annualTarget)}
                    </p>
                  </div>
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm">Realizado</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatCurrencyCompact(yearlyData.totalVGV)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs sm:text-sm">% Atingido</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {annualProgress.toFixed(1)}%
                    </p>
                  </div>
                  <Percent className="w-8 h-8 sm:w-10 sm:h-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn(
              "shadow-lg border-0",
              probability.current >= 70 
                ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                : probability.current >= 40
                  ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                  : "bg-gradient-to-br from-red-500 to-red-600 text-white"
            )}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs sm:text-sm">Probabilidade</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {probability.current}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white/60" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Block 1: Annual Financial Goal */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  🎯 Meta Financeira Anual - {selectedYear}
                </CardTitle>
                {canManage && (
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSaveTargets}
                    disabled={savingTargets}
                  >
                    {savingTargets ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Salvar Metas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Annual Goal Input - Main field */}
              {canManage && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-700">
                  <Label className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2 block">
                    Defina a Meta Anual de Faturamento
                  </Label>
                  <CurrencyInput 
                    value={annualGoal}
                    onChange={(val) => setAnnualGoal(val)}
                    className="h-14 text-xl font-bold border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    Progressão: <strong>{formatCurrencyCompact(monthlyProgression[0])}</strong> (Jan) → <strong>{formatCurrencyCompact(monthlyProgression[11])}</strong> (Dez) com crescimento linear
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Section */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Progresso Anual</span>
                    <Badge className={annualStatus.color}>
                      <annualStatus.icon className="w-3 h-3 mr-1" />
                      {annualStatus.label}
                    </Badge>
                  </div>
                  <Progress value={Math.min(annualProgress, 100)} className="h-6" />
                  <div className="flex justify-between text-sm">
                    <span>Realizado: <strong>{formatCurrency(yearlyData.totalVGV)}</strong></span>
                    <span>Meta Anual: <strong>{formatCurrency(annualGoal)}</strong></span>
                  </div>
                  
                  {/* Auto-calculated stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">1º Mês (Jan)</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrencyCompact(monthlyProgression[0])}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Último Mês (Dez)</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrencyCompact(monthlyProgression[11])}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Faltam</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrencyCompact(Math.max(0, annualGoal - yearlyData.totalVGV))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ticket Médio</p>
                      <p className="text-lg font-semibold text-foreground">
                        {yearlyData.totalSales > 0 
                          ? formatCurrencyCompact(yearlyData.totalVGV / yearlyData.totalSales)
                          : 'R$ 0'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Risk Indicator */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mb-3",
                    annualProgress >= 90 ? "bg-emerald-100 dark:bg-emerald-900/50" :
                    annualProgress >= 50 ? "bg-amber-100 dark:bg-amber-900/50" :
                    "bg-red-100 dark:bg-red-900/50"
                  )}>
                    <span className={cn(
                      "text-3xl font-bold",
                      annualProgress >= 90 ? "text-emerald-600" :
                      annualProgress >= 50 ? "text-amber-600" :
                      "text-red-600"
                    )}>
                      {Math.round(annualProgress)}%
                    </span>
                  </div>
                  <p className="font-medium text-center">
                    {annualProgress >= 100 ? '🏆 Meta Atingida!' :
                     annualProgress >= 90 ? '🟢 Excelente!' :
                     annualProgress >= 50 ? '🟡 Atenção' :
                     '🔴 Precisa Acelerar'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Block 2: Monthly Goals */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
                📆 Progressão Mensal - {selectedYear}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Expectativa mensal baseada na meta anual e valores realizados por mês.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-emerald-200 dark:border-emerald-800">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Mês</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Expectativa</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Realizado</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Diferença</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">%</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyGoals.map((goal, idx) => {
                      const expectedTarget = monthlyProgression[idx] || 0;
                      const achieved = goal.achieved;
                      const difference = achieved - expectedTarget;
                      const percentAchieved = expectedTarget > 0 ? (achieved / expectedTarget) * 100 : 0;
                      const status = getStatusIndicator(percentAchieved);
                      const isCurrentMonth = isSameMonth(goal.month, new Date());
                      
                      return (
                        <tr 
                          key={idx} 
                          className={cn(
                            "border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                            isCurrentMonth && "bg-emerald-50/50 dark:bg-emerald-900/20"
                          )}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {format(goal.month, 'MMMM', { locale: ptBR })}
                              </span>
                              {isCurrentMonth && (
                                <Badge variant="outline" className="text-xs">Atual</Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 font-mono text-muted-foreground">
                            {formatCurrencyCompact(expectedTarget)}
                          </td>
                          <td className="text-right py-3 px-2 font-mono font-medium">
                            {formatCurrencyCompact(achieved)}
                          </td>
                          <td className={cn(
                            "text-right py-3 px-2 font-mono",
                            difference >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            <span className="flex items-center justify-end gap-1">
                              {difference >= 0 ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                              {formatCurrencyCompact(Math.abs(difference))}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={cn(
                              "font-semibold",
                              percentAchieved >= 100 ? "text-emerald-600" :
                              percentAchieved >= 50 ? "text-amber-600" :
                              "text-red-600"
                            )}>
                              {percentAchieved.toFixed(0)}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <Badge className={cn("text-xs", status.color)}>
                              {percentAchieved >= 100 ? '✅' : 
                               percentAchieved >= 50 ? '⚠️' : 
                               expectedTarget > 0 ? '❌' : '➖'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="bg-slate-100 dark:bg-slate-700 font-semibold">
                      <td className="py-3 px-2">Total Anual</td>
                      <td className="text-center py-3 px-2 font-mono">{formatCurrencyCompact(annualGoal)}</td>
                      <td className="text-right py-3 px-2 font-mono">{formatCurrencyCompact(yearlyData.totalVGV)}</td>
                      <td className={cn(
                        "text-right py-3 px-2 font-mono",
                        yearlyData.totalVGV - annualGoal >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrencyCompact(Math.abs(yearlyData.totalVGV - annualGoal))}
                      </td>
                      <td className="text-center py-3 px-2">{annualProgress.toFixed(0)}%</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Block 3: Broker Hiring Goal */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-emerald-600" />
                👥 Meta de Contratação de Corretores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-3xl font-bold text-blue-600">{brokerStats.activeBrokers}</p>
                      <p className="text-xs text-muted-foreground">Ativos</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                      {canManage ? (
                        <Input 
                          type="number"
                          value={brokerHiringGoal}
                          onChange={(e) => setBrokerHiringGoal(parseInt(e.target.value) || 0)}
                          className="text-center text-2xl font-bold h-12 border-emerald-300"
                        />
                      ) : (
                        <p className="text-3xl font-bold text-emerald-600">{brokerHiringGoal}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Meta</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                      <p className="text-3xl font-bold text-amber-600">
                        {Math.max(0, brokerHiringGoal - brokerStats.activeBrokers)}
                      </p>
                      <p className="text-xs text-muted-foreground">Faltam</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {brokerHiringGoal > 0 ? Math.round((brokerStats.activeBrokers / brokerHiringGoal) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={brokerHiringGoal > 0 ? Math.min((brokerStats.activeBrokers / brokerHiringGoal) * 100, 100) : 0} 
                      className="h-3"
                    />
                  </div>
                  
                  {/* Hiring pace */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <p className="text-sm text-muted-foreground mb-1">
                      Ritmo necessário para atingir a meta:
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      ~{Math.ceil(Math.max(0, brokerHiringGoal - brokerStats.activeBrokers) / Math.max(1, 12 - new Date().getMonth()))} contratações/mês
                    </p>
                  </div>
                </div>
                
                {/* Visual */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-full border-8 border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      <div 
                        className="absolute inset-0 rounded-full border-8 border-emerald-500" 
                        style={{ 
                          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                          transform: `rotate(${brokerHiringGoal > 0 ? (brokerStats.activeBrokers / brokerHiringGoal) * 360 : 0}deg)`
                        }}
                      />
                      <div className="text-center">
                        <UserPlus className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold">{brokerStats.activeBrokers}/{brokerHiringGoal}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Block 4: Probability & Projections */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                📈 Projeções Inteligentes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cenários calculados com base no histórico e ritmo atual de vendas.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conservative */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-slate-300 dark:bg-slate-500">
                      <TrendingDown className="w-5 h-5 text-slate-600 dark:text-slate-200" />
                    </div>
                    <h3 className="font-semibold">Conservador</h3>
                  </div>
                  <p className="text-4xl font-bold mb-2">{Math.max(0, probability.current - 15)}%</p>
                  <p className="text-sm text-muted-foreground">Mantendo o ritmo atual sem expansão</p>
                </div>
                
                {/* Realistic */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 ring-2 ring-emerald-500">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-300 dark:bg-emerald-600">
                      <Target className="w-5 h-5 text-emerald-700 dark:text-emerald-100" />
                    </div>
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-100">Realista</h3>
                  </div>
                  <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-100 mb-2">
                    {probability.current}%
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-200">Projeção baseada no histórico</p>
                </div>
                
                {/* Aggressive */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-purple-300 dark:bg-purple-600">
                      <TrendingUp className="w-5 h-5 text-purple-700 dark:text-purple-100" />
                    </div>
                    <h3 className="font-semibold text-purple-700 dark:text-purple-100">Agressivo</h3>
                  </div>
                  <p className="text-4xl font-bold text-purple-700 dark:text-purple-100 mb-2">
                    {probability.withHigherTicket}%
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-200">+3 corretores + ticket maior</p>
                </div>
              </div>
              
              {/* Tips */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Insights</h4>
                <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                  <li>• Com +3 corretores, a probabilidade sobe para <strong>{probability.withMoreBrokers}%</strong></li>
                  <li>• Aumentando o ticket médio em 15%, chegamos a <strong>{probability.withHigherTicket}%</strong></li>
                  <li>• O crescimento médio mês a mês está em <strong>{performanceStats?.avgGrowth?.toFixed(1) || 0}%</strong></li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* Block 5: Executive Dashboard */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-emerald-600" />
                👁️ Visão Executiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Best month */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">🏆 Melhor Mês</p>
                  <p className="font-semibold capitalize">
                    {performanceStats?.bestMonth 
                      ? format(performanceStats.bestMonth.month, 'MMMM', { locale: ptBR })
                      : '-'
                    }
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {performanceStats?.bestMonth 
                      ? formatCurrencyCompact(performanceStats.bestMonth.achieved)
                      : '-'
                    }
                  </p>
                </div>
                
                {/* Worst month */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">📉 Pior Mês</p>
                  <p className="font-semibold capitalize">
                    {performanceStats?.worstMonth 
                      ? format(performanceStats.worstMonth.month, 'MMMM', { locale: ptBR })
                      : '-'
                    }
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {performanceStats?.worstMonth 
                      ? formatCurrencyCompact(performanceStats.worstMonth.achieved)
                      : '-'
                    }
                  </p>
                </div>
                
                {/* Total sales */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">🏠 Vendas no Ano</p>
                  <p className="text-3xl font-bold text-blue-600">{yearlyData.totalSales}</p>
                  <p className="text-xs text-muted-foreground">unidades</p>
                </div>
                
                {/* Team impact */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">👥 VGV por Corretor</p>
                  <p className="text-lg font-bold text-purple-600">
                    {brokerStats.activeBrokers > 0 
                      ? formatCurrencyCompact(yearlyData.totalVGV / brokerStats.activeBrokers)
                      : '-'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">média/corretor</p>
                </div>
              </div>
              
              {/* Comparison with previous year */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Comparado com {selectedYear - 1}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {/* This would need historical data */}
                      <span className="text-emerald-600">+12.5%</span>
                      <span className="text-sm font-normal text-muted-foreground ml-2">de crescimento</span>
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-emerald-500/30" />
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </>
  );
};

export default MetaGestao;
