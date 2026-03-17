import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CalendarIcon } from 'lucide-react';
import { format, addWeeks, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Goal } from '@/hooks/useGoals';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeams } from '@/hooks/useTeams';
import { useGoalTypes } from '@/hooks/useGoalTypes';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (goal: Partial<Goal>) => Promise<Goal>;
  preSelectedBrokerId?: string;
}

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
  const { goalTypes } = useGoalTypes();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: 0,
    target_type_id: '',
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

  // Set default type when goalTypes load
  React.useEffect(() => {
    if (goalTypes.length > 0 && !formData.target_type_id) {
      setFormData(prev => ({ ...prev, target_type_id: goalTypes[0].id }));
    }
  }, [goalTypes]);

  const userRole = getUserRole();
  const isDirector = userRole === 'diretor' || userRole === 'admin' || userRole === 'super_admin';

  const [brokerError, setBrokerError] = useState(false);
  const [dateError, setDateError] = useState(false);

  const selectedGoalType = useMemo(() => {
    return goalTypes.find(t => t.id === formData.target_type_id);
  }, [goalTypes, formData.target_type_id]);

  const valueFormat = selectedGoalType?.value_format || 'integer';

  const valueHint = useMemo(() => {
    if (!selectedGoalType) return '';
    switch (selectedGoalType.value_format) {
      case 'currency': return 'Ex: R$ 500.000,00';
      case 'percentage': return 'Ex: 75%';
      case 'integer': return `Ex: 10 ${selectedGoalType.name.toLowerCase().includes('venda') ? 'vendas' : 'unidades'}`;
      default: return '';
    }
  }, [selectedGoalType]);

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
      default: end = formData.end_date; break;
    }
    setFormData(prev => ({ ...prev, period_type: value, end_date: end }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrokerError(false);
    setDateError(false);

    if (!formData.title || !formData.target_value) return;

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
      const targetTypeName = selectedGoalType?.name || formData.custom_target_type || 'custom';

      await onCreate({
        title: formData.title,
        description: formData.description || undefined,
        target_value: formData.target_value,
        current_value: 0,
        target_type: targetTypeName as Goal['target_type'],
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
        title: '', description: '', target_value: 0,
        target_type_id: goalTypes[0]?.id || '', custom_target_type: '',
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
          <DialogDescription>Defina os detalhes da meta para corretor, equipe ou imobiliária.</DialogDescription>
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

            {/* Goal Type - Dynamic from DB */}
            <div>
              <Label>Tipo de Meta *</Label>
              <Select
                value={formData.target_type_id}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    target_type_id: value,
                    custom_target_type: '',
                    target_value: 0,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {goalTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({t.value_format === 'currency' ? 'R$' : t.value_format === 'percentage' ? '%' : 'Nº'})
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Criar Novo Tipo</SelectItem>
                </SelectContent>
              </Select>
              {formData.target_type_id === 'custom' && (
                <Input
                  className="mt-2"
                  value={formData.custom_target_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_target_type: e.target.value }))}
                  placeholder="Ex: Visitas, Ligações, Propostas..."
                  required
                />
              )}
            </div>

            {/* Target Value - Smart formatting */}
            <div>
              <Label htmlFor="target_value">Valor da Meta *</Label>
              {valueFormat === 'currency' ? (
                <CurrencyInput
                  value={formData.target_value}
                  onChange={(value) => setFormData(prev => ({ ...prev, target_value: value }))}
                  placeholder="0,00"
                />
              ) : valueFormat === 'percentage' ? (
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.target_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">%</span>
                </div>
              ) : (
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.target_value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              )}
              {valueHint && (
                <p className="text-xs text-muted-foreground mt-1">{valueHint}</p>
              )}
            </div>

            {/* Period Type */}
            <div>
              <Label>Período da Meta *</Label>
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
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value + 'T12:00:00') : null;
                    if (date && !isNaN(date.getTime())) {
                      setFormData(prev => ({ ...prev, start_date: date }));
                      if (formData.period_type !== 'custom') {
                        handlePeriodChange(formData.period_type);
                      }
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" type="button">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ ...prev, start_date: date }));
                          if (formData.period_type !== 'custom') {
                            handlePeriodChange(formData.period_type);
                          }
                        }
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* End Date */}
            <div>
              <Label>Data de Término *</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value + 'T12:00:00') : null;
                    if (date && !isNaN(date.getTime())) {
                      setFormData(prev => ({ ...prev, end_date: date }));
                      setDateError(false);
                    }
                  }}
                  
                  className={cn("flex-1", dateError && "border-destructive ring-destructive")}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" type="button">
                      <CalendarIcon className="h-4 w-4" />
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
                      initialFocus
                      className="p-3 pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {dateError && (
                <p className="text-sm text-destructive mt-1">Data de término deve ser após a data de início</p>
              )}
            </div>

            {/* Team selector */}
            {(formData.scope === 'team' || (formData.scope === 'broker' && isDirector)) && (
              <div>
                <Label>Equipe {formData.scope === 'team' ? '*' : ''}</Label>
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

            {/* Broker selector */}
            {formData.scope === 'broker' && (
              <div>
                <Label>Corretor *</Label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
