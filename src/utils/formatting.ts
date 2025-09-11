// Formatação de valores em Real brasileiro
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Formatação para valores grandes (M, K)
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1).replace('.', ',')}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  } else {
    return formatCurrency(value);
  }
};

// Formatação de números com separadores brasileiros
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};

// Formatação de porcentagem
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1).replace('.', ',')}%`;
};