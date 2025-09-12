import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Sale, Broker } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";

interface DynamicChartProps {
  sales: Sale[];
  brokers: Broker[];
  selectedBroker: string;
  selectedMetric: string;
  title: string;
  height?: number;
}

const DynamicChart = ({ sales, brokers, selectedBroker, selectedMetric, title, height = 300 }: DynamicChartProps) => {
  // Filter sales by selected broker
  const filteredSales = selectedBroker === 'all' 
    ? sales 
    : sales.filter(sale => sale.broker_id === selectedBroker);

  const generateChartData = () => {
    switch (selectedMetric) {
      case 'revenue':
        return generateRevenueData();
      case 'sales_count':
        return generateSalesCountData();
      case 'average_ticket':
        return generateAverageTicketData();
      case 'property_types':
        return generatePropertyTypesData();
      case 'monthly_performance':
        return generateMonthlyPerformanceData();
      default:
        return [];
    }
  };

  const generateRevenueData = () => {
    if (selectedBroker === 'all') {
      return brokers.map(broker => {
        const brokerSales = sales.filter(sale => sale.broker_id === broker.id);
        const revenue = brokerSales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
        return {
          name: broker.name,
          value: revenue,
          label: formatCurrency(revenue)
        };
      });
    } else {
      // Monthly revenue for selected broker
      const monthlyData: { [key: string]: number } = {};
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
        monthlyData[monthKey] = 0;
      }
      
      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.sale_date || sale.created_at || '');
        const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short' });
        
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += Number(sale.property_value || 0);
        }
      });
      
      return Object.entries(monthlyData).map(([month, value]) => ({
        name: month,
        value,
        label: formatCurrency(value)
      }));
    }
  };

  const generateSalesCountData = () => {
    if (selectedBroker === 'all') {
      return brokers.map(broker => {
        const brokerSales = sales.filter(sale => sale.broker_id === broker.id);
        return {
          name: broker.name,
          value: brokerSales.length,
          label: `${brokerSales.length} vendas`
        };
      });
    } else {
      // Monthly sales count for selected broker
      const monthlyData: { [key: string]: number } = {};
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
        monthlyData[monthKey] = 0;
      }
      
      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.sale_date || sale.created_at || '');
        const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short' });
        
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += 1;
        }
      });
      
      return Object.entries(monthlyData).map(([month, value]) => ({
        name: month,
        value,
        label: `${value} vendas`
      }));
    }
  };

  const generateAverageTicketData = () => {
    if (selectedBroker === 'all') {
      return brokers.map(broker => {
        const brokerSales = sales.filter(sale => sale.broker_id === broker.id);
        const totalRevenue = brokerSales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
        const averageTicket = brokerSales.length > 0 ? totalRevenue / brokerSales.length : 0;
        return {
          name: broker.name,
          value: averageTicket,
          label: formatCurrency(averageTicket)
        };
      });
    } else {
      // Monthly average ticket for selected broker
      const monthlyData: { [key: string]: { total: number, count: number } } = {};
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
        monthlyData[monthKey] = { total: 0, count: 0 };
      }
      
      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.sale_date || sale.created_at || '');
        const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short' });
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].total += Number(sale.property_value || 0);
          monthlyData[monthKey].count += 1;
        }
      });
      
      return Object.entries(monthlyData).map(([month, data]) => ({
        name: month,
        value: data.count > 0 ? data.total / data.count : 0,
        label: formatCurrency(data.count > 0 ? data.total / data.count : 0)
      }));
    }
  };

  const generatePropertyTypesData = () => {
    const propertyTypes: { [key: string]: number } = {};
    
    filteredSales.forEach(sale => {
      const type = sale.property_type || 'Outros';
      propertyTypes[type] = (propertyTypes[type] || 0) + 1;
    });
    
    return Object.entries(propertyTypes).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      label: `${value} vendas`
    }));
  };

  const generateMonthlyPerformanceData = () => {
    const monthlyData: { [key: string]: { sales: number, revenue: number } } = {};
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      monthlyData[monthKey] = { sales: 0, revenue: 0 };
    }
    
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].sales += 1;
        monthlyData[monthKey].revenue += Number(sale.property_value || 0);
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      name: month,
      sales: data.sales,
      revenue: data.revenue,
      ticketMedio: data.sales > 0 ? data.revenue / data.sales : 0
    }));
  };

  const data = generateChartData();

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </div>
      );
    }

    switch (selectedMetric) {
      case 'property_types':
        const COLORS = ['hsl(32, 95%, 44%)', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(346, 87%, 43%)'];
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'monthly_performance':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="hsl(32, 95%, 44%)" name="Vendas" />
              <Bar dataKey="ticketMedio" fill="hsl(142, 76%, 36%)" name="Ticket Médio (R$)" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'average_ticket':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Ticket Médio']} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(32, 95%, 44%)" 
                strokeWidth={3}
                dot={{ fill: "hsl(32, 95%, 44%)", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(32, 95%, 44%)" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-border animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      {renderChart()}
    </Card>
  );
};

export default DynamicChart;