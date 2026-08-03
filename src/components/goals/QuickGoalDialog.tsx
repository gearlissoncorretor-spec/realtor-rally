import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, Target, User, Users, Building2, CalendarDays, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, endOfMonth, endOfQuarter, endOfYear, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Goal } from '@/hooks/useGoals';
import { useAuth } from '@/contexts/AuthContext';
import { useBrokers } from '@/hooks/useBrokers';
import { useTeams } from '@/hooks/useTeams';
import { getGoalTypeLabel, isCurrencyGoalType, GoalTargetType } from '@/lib/goals';

interface QuickGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (goal: Partial<Goal>) => Promise<Goal>;
  defaultBrokerId?: string;
  defaultMonth?: Date;
}

type ScopeKey = 'self' | 'broker' | 'team' | 'company';

const GOAL_TYPES: { value: GoalTargetType; label: string; hint: string }[] = [
  { value: 'vgv', label: 'VGV', hint: 'Valor Geral de Vendas' },
  { value: 'sales_count', label: 'Vendas', hint: 'Quantidade de vendas' },
  { value: 'vgc', label: 'VGC', hint: 'Valor Geral de Comissão' },
  { value: 'captacao', label: 'Captação', hint: 'Imóveis captados' },
  { value: 'atendimentos', label: 'Atendimentos', hint: 'Clientes atendidos' },
];

const PERIODS = [
  { key: 'monthly', label: 'Este mês' },
  { key: 'quarterly', label: 'Trimestre' },
  { key: 'yearly', label: 'Ano' },
  { key: 'custom', label: 'Personalizado' },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

const rangeFor = (key: PeriodKey, ref: Date) => {
  switch (key) {
    case 'quarterly':
      return { start: startOfQuarter(ref), end: endOfQuarter(ref) };
    case 'yearly':
      return { start: startOfYear(ref), end: endOfYear(ref) };
    default:
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
  }
};

const toISO = (d: Date) => format(d, 'yyyy-MM-dd');

export const QuickGoalDialog: React.FC<QuickGoalDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  defaultBrokerId = '',
  defaultMonth,
}) => {
  const { user, profile, isCorretor, isGerente, isDiretor, isAdmin } = useAuth();
  const { brokers } = useBrokers();
  const { teams } = useTeams();

  const isManagement = isDiretor() || isAdmin();
  const myBroker = useMemo(() => brokers.find(b => b.user_id === user?.id), [brokers, user?.id]);
  const myTeamId = profile?.team_id || myBroker?.team_id || '';

  const scopeOptions = useMemo(() => {
    const opts: { key: ScopeKey; label: string; icon: typeof User }[] = [];
    if (myBroker) opts.push({ key: 'self', label: 'Minha meta', icon: User });
    if (isManagement || isGerente()) {
      opts.push({ key: 'broker', label: 'Corretor', icon: User });
      opts.push({ key: 'team', label: 'Equipe', icon: Users });
    }
    if (isManagement) opts.push({ key: 'company', label: 'Loja', icon: Building2 });
    if (!opts.length) opts.push({ key: 'self', label: 'Minha meta', icon: User });
    return opts;
  }, [myBroker, isManagement, isGerente]);

  const selectableBrokers = useMemo(() => {
    const active = brokers.filter(b => b.status !== 'inativo');
    if (isManagement) return active;
    if (isGerente() && myTeamId) return active.filter(b => b.team_id === myTeamId);
    return myBroker ? [myBroker] : [];
  }, [brokers, isManagement, isGerente, myTeamId, myBroker]);

  const selectableTeams = useMemo(() => {
    if (isManagement) return teams;
    return teams.filter(t => t.id === myTeamId);
  }, [teams, isManagement, myTeamId]);

  const [scope, setScope] = useState<ScopeKey>('self');
  const [brokerId, setBrokerId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [targetType, setTargetType] = useState<GoalTargetType>('vgv');
  const [targetValue, setTargetValue] = useState(0);
  const [periodKey, setPeriodKey] = useState<PeriodKey>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refDate = defaultMonth ?? new Date();

  // Reset on open
  useEffect(() => {
    if (!open) return;
    const initialScope = scopeOptions[0].key;
    setScope(initialScope);
    setBrokerId(defaultBrokerId || myBroker?.id || selectableBrokers[0]?.id || '');
    setTeamId(myTeamId || selectableTeams[0]?.id || '');
    setTargetType('vgv');
    setTargetValue(0);
    setPeriodKey('monthly');
    const r = rangeFor('monthly', refDate);
    setCustomStart(toISO(r.start));
    setCustomEnd(toISO(r.end));
    setTitle('');
    setTitleTouched(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const period = useMemo(() => {
    if (periodKey === 'custom') {
      return { start: customStart, end: customEnd };
    }
    const r = rangeFor(periodKey, refDate);
    return { start: toISO(r.start), end: toISO(r.end) };
  }, [periodKey, customStart, customEnd, refDate]);

  const targetName = useMemo(() => {
    if (scope === 'self') return myBroker?.name?.split(' ')[0] || 'Mim';
    if (scope === 'broker') return brokers.find(b => b.id === brokerId)?.name?.split(' ')[0] || 'Corretor';
    if (scope === 'team') return teams.find(t => t.id === teamId)?.name || 'Equipe';
    return 'Loja';
  }, [scope, brokerId, teamId, brokers, teams, myBroker]);

  const suggestedTitle = useMemo(() => {
    const periodLabel = PERIODS.find(p => p.key === periodKey)?.label ?? '';
    return `${getGoalTypeLabel(targetType)} · ${targetName} · ${periodLabel}`;
  }, [targetType, targetName, periodKey]);

  const effectiveTitle = titleTouched && title.trim() ? title.trim() : suggestedTitle;
  const isCurrency = isCurrencyGoalType(targetType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetValue || targetValue <= 0) {
      setError('Informe um valor de meta maior que zero.');
      return;
    }
    if (scope === 'self' && !myBroker) {
      setError('Seu usuário não está vinculado a um corretor. Peça ao gestor para vincular.');
      return;
    }
    if (scope === 'broker' && !brokerId) {
      setError('Selecione um corretor.');
      return;
    }
    if (scope === 'team' && !teamId) {
      setError('Selecione uma equipe.');
      return;
    }
    if (!period.start || !period.end || period.end < period.start) {
      setError('A data final deve ser posterior à data inicial.');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        title: effectiveTitle,
        target_value: targetValue,
        current_value: 0,
        target_type: targetType,
        period_type: periodKey === 'custom' ? 'custom' : periodKey,
        start_date: period.start,
        end_date: period.end,
        status: 'active',
        broker_id: scope === 'self' ? myBroker?.id : scope === 'broker' ? brokerId : undefined,
        team_id: scope === 'team' ? teamId : undefined,
        assigned_to: scope === 'self' ? user?.id : undefined,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a meta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="w-4 h-4" />
            </span>
            Nova meta
          </DialogTitle>
          <DialogDescription>
            Três passos: para quem, o quê e quanto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Para quem */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">1 · Para quem</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {scopeOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setScope(opt.key)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors',
                    scope === opt.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>

            {scope === 'broker' && (
              <Select value={brokerId} onValueChange={setBrokerId}>
                <SelectTrigger><SelectValue placeholder="Selecione o corretor" /></SelectTrigger>
                <SelectContent>
                  {selectableBrokers.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {scope === 'team' && (
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger><SelectValue placeholder="Selecione a equipe" /></SelectTrigger>
                <SelectContent>
                  {selectableTeams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 2. O quê */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">2 · O que medir</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  title={t.hint}
                  onClick={() => { setTargetType(t.value); setTargetValue(0); }}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    targetType === t.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Quanto + quando */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">3 · Quanto e quando</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qg-value" className="text-sm">Valor da meta</Label>
                {isCurrency ? (
                  <CurrencyInput
                    value={targetValue}
                    onChange={setTargetValue}
                    placeholder="0,00"
                  />
                ) : (
                  <Input
                    id="qg-value"
                    type="number"
                    min={1}
                    step={1}
                    value={targetValue || ''}
                    onChange={e => setTargetValue(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Período</Label>
                <div className="grid grid-cols-4 gap-1 rounded-lg border border-border p-1">

                  {PERIODS.map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPeriodKey(p.key)}
                      className={cn(
                        'rounded-md py-1.5 text-[11px] font-medium transition-colors',
                        periodKey === p.key
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {p.key === 'custom' ? 'Livre' : p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {periodKey === 'custom' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Início</Label>
                  <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Término</Label>
                  <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                {format(new Date(period.start + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })} até{' '}
                {format(new Date(period.end + 'T12:00:00'), "dd 'de' MMM yyyy", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="qg-title" className="text-sm">Título</Label>
            <Input
              id="qg-title"
              value={titleTouched ? title : suggestedTitle}
              onChange={e => { setTitleTouched(true); setTitle(e.target.value); }}
              placeholder={suggestedTitle}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Criar meta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickGoalDialog;
