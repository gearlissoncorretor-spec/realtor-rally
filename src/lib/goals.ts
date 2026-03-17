import { formatCurrency, formatNumber } from '@/utils/formatting';

export type GoalTargetType =
  | 'sales_count'
  | 'captacao'
  | 'contratacao'
  | 'revenue'
  | 'vgv'
  | 'vgc'
  | 'commission'
  | 'atendimentos';

export type GoalPeriodType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semester'
  | 'yearly'
  | 'custom';

export const GOAL_TYPE_LABELS: Record<GoalTargetType, string> = {
  sales_count: 'Vendas',
  captacao: 'Captação',
  contratacao: 'Contratação',
  revenue: 'Receita',
  vgv: 'VGV',
  vgc: 'VGC',
  commission: 'Comissão',
  atendimentos: 'Atendimentos',
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriodType, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semester: 'Semestral',
  yearly: 'Anual',
  custom: 'Personalizado',
};

const GOAL_TARGET_TYPE_ALIASES: Record<string, GoalTargetType> = {
  salescount: 'sales_count',
  sales_count: 'sales_count',
  numero_de_vendas: 'sales_count',
  numero_vendas: 'sales_count',
  numero_de_venda: 'sales_count',
  vendas: 'sales_count',
  venda: 'sales_count',

  captacao: 'captacao',
  captacao_de_imoveis: 'captacao',
  captacoes: 'captacao',

  contratacao: 'contratacao',
  contratacao_de_corretores: 'contratacao',
  contratacoes: 'contratacao',

  revenue: 'revenue',
  receita: 'revenue',

  vgv: 'vgv',
  vgv_valor_geral_de_vendas: 'vgv',
  valor_geral_de_vendas: 'vgv',

  vgc: 'vgc',
  vgc_valor_geral_de_comissao: 'vgc',
  valor_geral_de_comissao: 'vgc',

  commission: 'commission',
  comissao: 'commission',
  comissao_individual: 'commission',

  atendimentos: 'atendimentos',
  atendimento: 'atendimentos',
  numero_de_atendimentos: 'atendimentos',
  numero_atendimentos: 'atendimentos',
};

const normalizeLookupKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const normalizeGoalTargetType = (value?: string | null): GoalTargetType | null => {
  if (!value) return null;
  return GOAL_TARGET_TYPE_ALIASES[normalizeLookupKey(value)] ?? null;
};

export const isSupportedGoalTargetType = (value?: string | null): boolean =>
  normalizeGoalTargetType(value) !== null;

export const getGoalTypeLabel = (type: string): string => {
  const normalizedType = normalizeGoalTargetType(type);
  return normalizedType ? GOAL_TYPE_LABELS[normalizedType] : type;
};

export const getGoalPeriodLabel = (period: string): string => {
  return GOAL_PERIOD_LABELS[period as GoalPeriodType] || period;
};

export const isCurrencyGoalType = (type: string): boolean => {
  const normalizedType = normalizeGoalTargetType(type);
  return normalizedType ? ['revenue', 'vgv', 'vgc', 'commission'].includes(normalizedType) : false;
};

export const formatGoalValue = (value: number, type: string): string => {
  return isCurrencyGoalType(type) ? formatCurrency(value) : formatNumber(value);
};

export const formatGoalValueCompact = (value: number, type: string): string => {
  return isCurrencyGoalType(type) ? formatCurrency(value) : formatNumber(value);
};
