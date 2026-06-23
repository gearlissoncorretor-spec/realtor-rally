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
  // Ticket médio dos últimos 12 meses — chave ano-mês para evitar colisão entre anos
  const generateTicketMedioData = () => {
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const monthlyData: Record<string, { label: string; totalValue: number; count: number }> = {};
    const orderedKeys: string[] = [];

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = `${months[date.getMonth()]}/${String(date.getFullYear()).slice(-2)}`;
      monthlyData[key] = { label, totalValue: 0, count: 0 };
      orderedKeys.push(key);
    }

    sales.forEach(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      if (isNaN(saleDate.getTime())) return;
      const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[key]) {
        monthlyData[key].totalValue += Number(sale.property_value || 0);
        monthlyData[key].count += 1;
      }
    });

    return orderedKeys.map(k => ({
      month: monthlyData[k].label,
      ticketMedio: monthlyData[k].count > 0 ? monthlyData[k].totalValue / monthlyData[k].count : 0,
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
            tickFormatter={(value) => formatCurrency(value)}
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