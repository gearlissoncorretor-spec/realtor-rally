import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Sale } from "@/contexts/DataContext";

interface PropertyTypeChartProps {
  sales: Sale[];
  title: string;
  height?: number;
}

const COLORS = [
  'hsl(221, 83%, 53%)', // Apartamento - azul
  'hsl(142, 71%, 45%)', // Casa - verde
  'hsl(32, 95%, 44%)',  // Lote - laranja
  'hsl(199, 89%, 48%)', // Outros - azul claro
];

const PropertyTypeChart = ({ sales, title, height = 300 }: PropertyTypeChartProps) => {
  // Agrupar vendas por tipo de propriedade
  const propertyTypeCounts = sales.reduce((acc, sale) => {
    const type = sale.property_type || 'Outros';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(propertyTypeCounts).map(([type, count], index) => ({
    name: type === 'apartamento' ? 'Apartamento' : 
          type === 'casa' ? 'Casa' : 
          type === 'lote' ? 'Lote' : 'Outros',
    value: count,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} {data.value === 1 ? 'venda' : 'vendas'}
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PropertyTypeChart;