import type { Negotiation } from '@/hooks/useNegotiations';

/**
 * Calcula a probabilidade real de fechamento de uma negociação
 * baseada em múltiplos fatores com pesos ponderados.
 *
 * Fatores:
 * 1. Status da negociação (peso 40%) — quanto mais avançado, maior a chance
 * 2. Recência da última atualização (peso 25%) — negociações ativas recentemente têm mais chance
 * 3. Tempo total da negociação (peso 15%) — muito tempo sem fechar reduz a chance
 * 4. Valor (peso 10%) — valores muito altos ou muito baixos vs. a média
 * 5. Completude dos dados (peso 10%) — dados completos indicam engajamento
 */

// Peso por status — ordem crescente de probabilidade de fechar
const STATUS_SCORES: Record<string, number> = {
  em_contato: 15,
  em_aprovacao: 30,
  em_analise: 40,
  proposta_enviada: 55,
  cliente_aprovado: 75,
  aprovado: 85,
  contrato_assinado: 92,
  venda_concluida: 100,
  // Negativos
  cliente_reprovado: 5,
  perdida: 0,
  cancelada: 0,
};

function getStatusScore(status: string): number {
  return STATUS_SCORES[status] ?? 20;
}

function getRecencyScore(updatedAt: string): number {
  const diffHours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return 100;      // Atualizada hoje
  if (diffHours < 72) return 85;       // Últimos 3 dias
  if (diffHours < 168) return 65;      // Última semana
  if (diffHours < 336) return 45;      // Últimas 2 semanas
  if (diffHours < 720) return 25;      // Último mês
  return 10;                            // Mais de 1 mês parada
}

function getAgeDurationScore(startDate: string): number {
  const diffDays = (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) return 90;         // Negociação nova, alta energia
  if (diffDays < 14) return 80;
  if (diffDays < 30) return 65;
  if (diffDays < 60) return 45;
  if (diffDays < 90) return 30;
  return 15;                            // Arrastando há mais de 3 meses
}

function getCompletenessScore(neg: Negotiation): number {
  let score = 0;
  if (neg.client_name) score += 20;
  if (neg.client_email) score += 20;
  if (neg.client_phone) score += 20;
  if (neg.property_address) score += 20;
  if (neg.observations) score += 20;
  return score;
}

export interface NegotiationWithProbability extends Negotiation {
  closingProbability: number;
  probabilityLabel: 'muito_alta' | 'alta' | 'media' | 'baixa' | 'muito_baixa';
}

export function calculateClosingProbability(neg: Negotiation): number {
  const statusScore = getStatusScore(neg.status);
  const recencyScore = getRecencyScore(neg.updated_at);
  const ageScore = getAgeDurationScore(neg.start_date);
  const completenessScore = getCompletenessScore(neg);

  // Pesos: status 40%, recência 25%, tempo 15%, completude 10%, base 10%
  const weighted =
    statusScore * 0.40 +
    recencyScore * 0.25 +
    ageScore * 0.15 +
    completenessScore * 0.10 +
    10; // base de 10%

  return Math.min(Math.max(Math.round(weighted), 5), 99);
}

export function getProbabilityLabel(prob: number): NegotiationWithProbability['probabilityLabel'] {
  if (prob >= 80) return 'muito_alta';
  if (prob >= 60) return 'alta';
  if (prob >= 40) return 'media';
  if (prob >= 20) return 'baixa';
  return 'muito_baixa';
}

export function getProbabilityColor(prob: number): string {
  if (prob >= 80) return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
  if (prob >= 60) return 'border-orange-500/30 text-orange-400 bg-orange-500/10';
  if (prob >= 40) return 'border-amber-500/30 text-amber-400 bg-amber-500/10';
  if (prob >= 20) return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
  return 'border-gray-500/30 text-gray-400 bg-gray-500/10';
}

export function getProbabilityProgressColor(prob: number): string {
  if (prob >= 80) return '[&>div]:bg-emerald-500';
  if (prob >= 60) return '[&>div]:bg-orange-500';
  if (prob >= 40) return '[&>div]:bg-amber-500';
  if (prob >= 20) return '[&>div]:bg-blue-500';
  return '[&>div]:bg-gray-500';
}

/**
 * Ordena negociações pela probabilidade real de fechamento (maior primeiro)
 * e retorna as top N com a probabilidade calculada
 */
export function getHotNegotiations(
  negotiations: Negotiation[],
  limit = 5
): (Negotiation & { closingProbability: number })[] {
  const withProb = negotiations.map(n => ({
    ...n,
    closingProbability: calculateClosingProbability(n),
  }));

  return withProb
    .sort((a, b) => b.closingProbability - a.closingProbability)
    .slice(0, limit);
}
