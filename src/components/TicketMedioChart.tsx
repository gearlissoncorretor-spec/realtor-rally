import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Sale } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";

interface TicketMedioChartProps {
  sales: Sale[];
  title: string;
  height?: number;
}

const TicketMedioChart = ({ sales, title, height = 300 }: TicketMedioChartProps) => {
  // Calcular ticket médio por mês dos últimos 12 meses
  const generateTicketMedioData = () => {
    const monthlyData: { [key: string]: { totalValue: number, count: number } } = {};
    
    // Inicializar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      monthlyData[monthKey] = { totalValue: 0, count: 0 };
    }
    
    // Agregar dados de vendas
    sales.forEach(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].totalValue += sale.property_value;
        monthlyData[monthKey].count += 1;
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ticketMedio: data.count > 0 ? data.totalValue / data.count : 0
    }));
  };

  const data = generateTicketMedioData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-primary font-semibold">
            Ticket Médio: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="ticketMedio" 
            stroke="hsl(32, 95%, 44%)" 
            strokeWidth={3}
            dot={{ fill: "hsl(32, 95%, 44%)", strokeWidth: 2, r: 4 }}
            name="Ticket Médio"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TicketMedioChart;