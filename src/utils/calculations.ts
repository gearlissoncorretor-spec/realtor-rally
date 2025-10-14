import type { Broker, Sale } from '@/contexts/DataContext';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

export const calculateBrokerStats = (broker: Broker, sales: Sale[]) => {
  const brokerSales = sales.filter(sale => sale.broker_id === broker.id);
  const totalRevenue = brokerSales.reduce((sum, sale) => sum + sale.property_value, 0);
  const totalCommission = brokerSales.reduce((sum, sale) => sum + (sale.commission_value || 0), 0);
  const salesCount = brokerSales.length;
  const avgSaleValue = salesCount > 0 ? totalRevenue / salesCount : 0;

  return {
    totalRevenue,
    totalCommission,
    salesCount,
    avgSaleValue,
    conversionRate: salesCount > 0 ? (brokerSales.filter(s => s.status === 'confirmada').length / salesCount) * 100 : 0
  };
};

export const calculateMonthlyData = (sales: Sale[], monthsBack: number = 12) => {
  const monthlyData: { [key: string]: { vgv: number, vgc: number, sales: number, revenue: number } } = {};
  
  // Initialize months
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    monthlyData[monthKey] = { vgv: 0, vgc: 0, sales: 0, revenue: 0 };
  }
  
  // Aggregate sales data
  sales.forEach(sale => {
    const saleDate = new Date(sale.sale_date || sale.created_at || '');
    const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].vgv += sale.vgv;
      monthlyData[monthKey].vgc += sale.vgc;
      monthlyData[monthKey].sales += 1;
      monthlyData[monthKey].revenue += sale.property_value;
    }
  });
  
  return Object.entries(monthlyData).map(([month, data]) => ({
    month: month.split(' ')[0], // Just month name
    ...data
  }));
};

export const calculateKPIs = (brokers: Broker[], sales: Sale[]) => {
  const totalVGV = sales.reduce((sum, sale) => sum + sale.vgv, 0);
  const totalVGC = sales.reduce((sum, sale) => sum + sale.vgc, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.property_value, 0);
  const totalSales = sales.length;
  const activeBrokers = brokers.filter(b => b.status === 'ativo').length;
  const confirmedSales = sales.filter(s => s.status === 'confirmada').length;
  
  // This month data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date || sale.created_at || '');
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  
  const thisMonthVGV = thisMonthSales.reduce((sum, sale) => sum + sale.vgv, 0);
  const thisMonthVGC = thisMonthSales.reduce((sum, sale) => sum + sale.vgc, 0);
  const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.property_value, 0);
  
  const conversionRate = totalSales > 0 ? (confirmedSales / totalSales) * 100 : 0;
  
  return {
    totalVGV,
    totalVGC,
    totalRevenue,
    totalSales,
    activeBrokers,
    confirmedSales,
    thisMonthVGV,
    thisMonthVGC,
    thisMonthRevenue,
    thisMonthSales: thisMonthSales.length,
    conversionRate,
    avgTicket: totalSales > 0 ? totalRevenue / totalSales : 0
  };
};

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  } else {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  }
};

// Calculate growth comparing current period with previous period
export const calculateGrowth = (brokerId: string, sales: Sale[], monthsBack: number = 0): number | null => {
  const now = new Date();
  const currentStart = startOfMonth(subMonths(now, monthsBack));
  const currentEnd = endOfMonth(subMonths(now, monthsBack));
  const previousStart = startOfMonth(subMonths(now, monthsBack + 1));
  const previousEnd = endOfMonth(subMonths(now, monthsBack + 1));

  const currentSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date || sale.created_at || '');
    return sale.broker_id === brokerId && 
           saleDate >= currentStart && 
           saleDate <= currentEnd &&
           sale.status === 'confirmada';
  });

  const previousSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date || sale.created_at || '');
    return sale.broker_id === brokerId && 
           saleDate >= previousStart && 
           saleDate <= previousEnd &&
           sale.status === 'confirmada';
  });

  const currentRevenue = currentSales.reduce((sum, sale) => sum + (sale.vgc || 0), 0);
  const previousRevenue = previousSales.reduce((sum, sale) => sum + (sale.vgc || 0), 0);

  // Return null if there's no previous data to compare
  if (previousRevenue === 0) {
    return currentRevenue > 0 ? null : null;
  }

  // Calculate percentage growth
  const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  return growth;
};

export const generateBrokerRanking = (brokers: Broker[], sales: Sale[]) => {
  return brokers.map(broker => {
    const stats = calculateBrokerStats(broker, sales);
    return {
      id: broker.id,
      name: broker.name,
      avatar: broker.avatar_url || '',
      sales: stats.salesCount,
      revenue: stats.totalRevenue,
      position: 0, // Will be set after sorting
      growth: calculateGrowth(broker.id, sales),
      commission: stats.totalCommission,
      avgTicket: stats.avgSaleValue,
      conversionRate: stats.conversionRate
    };
  })
  .filter(broker => broker.revenue > 0)
  .sort((a, b) => b.revenue - a.revenue)
  .map((broker, index) => ({ ...broker, position: index + 1 }));
};