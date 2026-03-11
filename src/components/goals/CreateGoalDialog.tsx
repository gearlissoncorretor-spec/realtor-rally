import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Goal } from '@/hooks/useGoals';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeams } from '@/hooks/useTeams';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (goal: Partial<Goal>) => Promise<Goal>;
  preSelectedBrokerId?: string;
}

const GOAL_TYPES = [
  { value: 'sales_count', label: 'Número de Vendas' },
  { value: 'vgv', label: 'VGV (Valor Geral de Vendas)' },
  { value: 'vgc', label: 'VGC (Valor Geral de Comissão)' },
  { value: 'revenue', label: 'Receita' },
  { value: 'commission', label: 'Comissão Individual' },
  { value: 'atendimentos', label: 'Número de Atendimentos' },
  { value: 'captacao', label: 'Captação de Imóveis' },
  { value: 'contratacao', label: 'Contratação de Corretores' },
  { value: 'custom', label: 'Criar Novo Tipo de Meta' },
];

const PERIOD_TYPES = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semester', label: 'Semestral' },
  { value: 'yearly', label: 'Anual' },
  { value: 'custom', label: 'Personalizado' },
];

const GOAL_SCOPE = [
  { value: 'broker', label: 'Por Corretor' },
  { value: 'team', label: 'Por Equipe' },
  { value: 'company', label: 'Geral da Imobiliária' },
];

export const CreateGoalDialog: React.FC<CreateGoalDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  preSelectedBrokerId = '',
}) => {
  const { brokers } = useData();
  const { teams } = useTeams();
  const { getUserRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: '',
    target_type: 'sales_count' as string,
    custom_target_type: '',
    period_type: 'monthly' as string,
    start_date: new Date(),
    end_date: new Date(),
    assigned_to: '',
    team_id: '',
    broker_id: preSelectedBrokerId,
    scope: 'broker' as string,
    show_in_ranking: false,
    show_in_tv: false,
  });

  React.useEffect(() => {
    if (preSelectedBrokerId && open) {
      setFormData(prev => ({ ...prev, broker_id: preSelectedBrokerId, scope: 'broker' }));
    }
  }, [preSelectedBrokerId, open]);

  const userRole = getUserRole();
  const isDirector = userRole === 'diretor' || userRole === 'admin' || userRole === 'super_admin';

  const [brokerError, setBrokerError] = useState(false);
  const [dateError, setDateError] = useState(false);

  // Auto-calculate end_date based on period
  const handlePeriodChange = (value: string) => {
    const start = formData.start_date;
    let end = start;
    switch (value) {
      case 'daily': end = start; break;
      case 'weekly': end = addWeeks(start, 1); break;
      case 'monthly': end = addMonths(start, 1); break;
      case 'quarterly': end = addMonths(start, 3); break;
      case 'semester': end = addMonths(start, 6); break;
      case 'yearly': end = addYears(start, 1); break;
      // custom: keep current end_date
      default: end = formData.end_date; break;
    }
    setFormData(prev => ({ ...prev, period_type: value, end_date: end }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrokerError(false);
    setDateError(false);

    if (!formData.title || !formData.target_value) return;

    // Validate scope-specific fields
    if (formData.scope === 'broker' && (!formData.broker_id || formData.broker_id === 'all')) {
      setBrokerError(true);
      return;
    }

    if (formData.end_date < formData.start_date) {
      setDateError(true);
      return;
    }

    setLoading(true);
    try {
      const effectiveTargetType = formData.target_type === 'custom'
        ? formData.custom_target_type
        : formData.target_type;

      await onCreate({
        title: formData.title,
        description: formData.description || undefined,
        target_value: parseFloat(formData.target_value),
        current_value: 0,
        target_type: effectiveTargetType as Goal['target_type'],
        period_type: formData.period_type as Goal['period_type'],
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date.toISOString().split('T')[0],
        assigned_to: formData.assigned_to || undefined,
        team_id: (formData.scope === 'team' && formData.team_id && formData.team_id !== 'all') ? formData.team_id : undefined,
        broker_id: formData.scope === 'broker' ? formData.broker_id : undefined,
        show_in_ranking: formData.show_in_ranking,
        show_in_tv: formData.show_in_tv,
      });

      setFormData({
        title: '', description: '', target_value: '',
        target_type: 'sales_count', custom_target_type: '',
        period_type: 'monthly', start_date: new Date(), end_date: new Date(),
        assigned_to: '', team_id: '', broker_id: '', scope: 'broker',
        show_in_ranking: false, show_in_tv: false,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrokers = formData.team_id
    ? brokers.filter(broker => broker.team_id === formData.team_id)
    : brokers;

  const isCustomPeriod = formData.period_type === 'custom';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Meta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">Título da Meta *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Aumentar vendas mensais"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva os detalhes da meta..."
                rows={3}
              />
            </div>

            {/* Goal Type */}
            <div>
              <Label htmlFor="target_type">Tipo de Meta *</Label>
              <Select
                value={formData.target_type}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, target_type: value, custom_target_type: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.target_type === 'custom' && (
                <Input
                  className="mt-2"
                  value={formData.custom_target_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_target_type: e.target.value }))}
                  placeholder="Ex: Visitas, Ligações, Propostas..."
                  required
                />
              )}
            </div>

            {/* Target Value */}
            <div>
              <Label htmlFor="target_value">Valor da Meta *</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder="Ex: 10 vendas, R$ 500.000..."
                required
              />
            </div>

            {/* Period Type */}
            <div>
              <Label htmlFor="period_type">Período da Meta *</Label>
              <Select
                value={formData.period_type}
                onValueChange={handlePeriodChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_TYPES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scope */}
            <div>
              <Label>Nível da Meta *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) => setFormData(prev => ({ ...prev, scope: value, broker_id: '', team_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_SCOPE.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date
                      ? format(formData.start_date, "dd/MM/yyyy", { locale: ptBR })
                      : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, start_date: date }));
                        // Re-calculate end based on period
                        if (formData.period_type !== 'custom') {
                          handlePeriodChange(formData.period_type);
                        }
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div>
              <Label>Data de Término *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground",
                      dateError && "border-destructive ring-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date
                      ? format(formData.end_date, "dd/MM/yyyy", { locale: ptBR })
                      : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, end_date: date }));
                        setDateError(false);
                      }
                    }}
                    disabled={!isCustomPeriod}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {!isCustomPeriod && (
                <p className="text-xs text-muted-foreground mt-1">Calculada automaticamente pelo período</p>
              )}
              {dateError && (
                <p className="text-sm text-destructive mt-1">Data de término deve ser após a data de início</p>
              )}
            </div>

            {/* Team selector (for team scope or director filtering brokers) */}
            {(formData.scope === 'team' || (formData.scope === 'broker' && isDirector)) && (
              <div>
                <Label htmlFor="team_id">Equipe {formData.scope === 'team' ? '*' : ''}</Label>
                <Select
                  value={formData.team_id}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, team_id: value, broker_id: '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.scope === 'broker' && <SelectItem value="all">Todas as equipes</SelectItem>}
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Broker selector (for broker scope) */}
            {formData.scope === 'broker' && (
              <div>
                <Label htmlFor="broker_id">Corretor *</Label>
                <Select
                  value={formData.broker_id}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, broker_id: value }));
                    setBrokerError(false);
                  }}
                >
                  <SelectTrigger className={brokerError ? 'border-destructive ring-destructive' : ''}>
                    <SelectValue placeholder="Selecionar corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBrokers.map(broker => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {brokerError && (
                  <p className="text-sm text-destructive mt-1">Selecione um corretor específico</p>
                )}
              </div>
            )}
          </div>

          {/* Visibility Toggles */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
              <Label htmlFor="show_ranking" className="text-sm font-medium cursor-pointer">
                Exibir no Ranking
              </Label>
              <Switch
                id="show_ranking"
                checked={formData.show_in_ranking}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_ranking: checked }))}
              />
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
              <Label htmlFor="show_tv" className="text-sm font-medium cursor-pointer">
                Exibir no Modo TV
              </Label>
              <Switch
                id="show_tv"
                checked={formData.show_in_tv}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_tv: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
