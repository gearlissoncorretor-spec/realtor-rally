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