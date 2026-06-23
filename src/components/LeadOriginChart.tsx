import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Sale } from "@/contexts/DataContext";

interface LeadOriginChartProps {
  sales: Sale[];
  title?: string;
  height?: number;
}

// Cores fixas por origem (consistência visual entre renders)
const ORIGIN_COLORS: Record<string, string> = {
  "Google Ads": "hsl(221, 83%, 53%)",
  "Tráfego Pago (Patrocinado)": "hsl(221, 83%, 53%)",
  "Instagram": "hsl(322, 75%, 55%)",
  "Indicação": "hsl(142, 71%, 45%)",
  "Placa": "hsl(32, 95%, 44%)",
  "Portais": "hsl(199, 89%, 48%)",
  "Marketplace": "hsl(199, 89%, 48%)",
  "Captação Ativa": "hsl(280, 65%, 55%)",
  "Ação de Rua": "hsl(280, 65%, 55%)",
  "Lista Imobiliária": "hsl(45, 93%, 47%)",
  "Lista Pessoal": "hsl(160, 60%, 40%)",
  "Anúncio Geral": "hsl(217, 91%, 60%)",
  "Outro": "hsl(215, 16%, 47%)",
};

const FALLBACK = "hsl(215, 16%, 47%)";

const LeadOriginChart = ({ sales, title = "Origem dos Clientes", height = 300 }: LeadOriginChartProps) => {
  const counts = sales.reduce((acc, sale) => {
    const origem = (sale.origem && String(sale.origem).trim()) || "Outro";
    acc[origem] = (acc[origem] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name,
      value,
      color: ORIGIN_COLORS[name] ?? FALLBACK,
    }));

  const total = data.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{d.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {d.value} {d.value === 1 ? "venda" : "vendas"} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
          Sem dados de origem no período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default LeadOriginChart;
