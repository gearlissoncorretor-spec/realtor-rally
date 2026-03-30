// Formatação de valores em Real brasileiro
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Formatação completa sem abreviação (K, M) — padrão brasileiro
export const formatCurrencyCompact = (value: number): string => {
  return formatCurrency(value);
};

// Formatação de números com separadores brasileiros
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};

// Formatação de porcentagem
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1).replace('.', ',')}%`;
};

/**
 * Parse a date string (YYYY-MM-DD) safely without timezone shift.
 * Using `new Date('2026-03-01')` in UTC-3 returns Feb 28 21:00 local,
 * causing getMonth()/getFullYear() to return wrong values.
 */
export const parseDateSafe = (dateStr: string): { year: number; month: number; day: number } => {
  const parts = dateStr.substring(0, 10).split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  };
};

/**
 * Create a Date object from a date string without timezone shift.
 * Sets time to noon to avoid any boundary issues.
 */
export const toLocalDate = (dateStr: string): Date => {
  const { year, month, day } = parseDateSafe(dateStr);
  return new Date(year, month - 1, day, 12, 0, 0);
};