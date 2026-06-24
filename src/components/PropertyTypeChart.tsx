import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Sale } from "@/contexts/DataContext";

interface PropertyTypeChartProps {
  sales: Sale[];
  title: string;
  height?: number;
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  apartamento: { label: 'Apartamento', color: 'hsl(221, 83%, 53%)' },
  casa:        { label: 'Casa',        color: 'hsl(142, 71%, 45%)' },
  lote:        { label: 'Lote',        color: 'hsl(32, 95%, 44%)'  },
  terreno:     { label: 'Terreno',     color: 'hsl(45, 93%, 47%)'  },
  comercial:   { label: 'Comercial',   color: 'hsl(280, 65%, 55%)' },
  rural:       { label: 'Rural',       color: 'hsl(160, 60%, 40%)' },
  outros:      { label: 'Outros',      color: 'hsl(199, 89%, 48%)' },
};

const PropertyTypeChart = ({ sales, title, height }: PropertyTypeChartProps) => {
  const isMobile = useIsMobile();
  const chartHeight = height ?? (isMobile ? 220 : 300);
  // Agrupar vendas por tipo de propriedade (cor fixa por tipo)
  const propertyTypeCounts = sales.reduce((acc, sale) => {
    const type = (sale.property_type || 'outros').toString().toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(propertyTypeCounts).map(([type, count]) => {
    const meta = TYPE_META[type] ?? { label: type.charAt(0).toUpperCase() + type.slice(1), color: 'hsl(215, 16%, 47%)' };
    return { name: meta.label, value: count, color: meta.color };
  });


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
      <ResponsiveContainer width="100%" height={chartHeight}>
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