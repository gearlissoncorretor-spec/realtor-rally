import React, { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { useNegotiations } from '@/hooks/useNegotiations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ClientOriginsChartProps {
  brokerId?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 71%, 45%)',
  'hsl(217, 91%, 60%)',
  'hsl(45, 93%, 47%)',
  'hsl(280, 67%, 55%)',
  'hsl(350, 89%, 60%)',
  'hsl(190, 90%, 50%)',
  'hsl(30, 90%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(0, 0%, 60%)',
];

export const ClientOriginsChart: React.FC<ClientOriginsChartProps> = ({ brokerId }) => {
  const { sales } = useSales();
  const { negotiations } = useNegotiations();

  const originsData = useMemo(() => {
    const filteredSales = brokerId
      ? sales.filter(s => s.broker_id === brokerId && s.status !== 'distrato')
      : sales.filter(s => s.status !== 'distrato');

    const filteredNegotiations = brokerId
      ? negotiations.filter(n => n.broker_id === brokerId)
      : negotiations;

    const originsMap = new Map<string, { vendas: number; negociacoes: number }>();

    filteredSales.forEach(s => {
      const origem = s.origem || 'Não informado';
      const entry = originsMap.get(origem) || { vendas: 0, negociacoes: 0 };
      entry.vendas += 1;
      originsMap.set(origem, entry);
    });

    filteredNegotiations.forEach(n => {
      const origem = n.observations?.match(/Origem:\s*(.+)/i)?.[1]?.trim() || 'Não informado';
      // Don't count negotiations that came from notes matching
      const entry = originsMap.get(origem) || { vendas: 0, negociacoes: 0 };
      entry.negociacoes += 1;
      originsMap.set(origem, entry);
    });

    // For negotiations, also count from sales origins to avoid double-counting
    // Re-count using only sales origem field
    const salesOriginsMap = new Map<string, { vendas: number; negociacoes: number }>();
    filteredSales.forEach(s => {
      const origem = s.origem || 'Não informado';
      const entry = salesOriginsMap.get(origem) || { vendas: 0, negociacoes: 0 };
      entry.vendas += 1;
      salesOriginsMap.set(origem, entry);
    });

    return Array.from(salesOriginsMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 10);
  }, [sales, negotiations, brokerId]);

  if (originsData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" /> Origem dos Clientes
        </h2>
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhuma venda com origem registrada
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-primary" /> Origem dos Clientes
      </h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={originsData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, name: string) => [
                value,
                name === 'vendas' ? 'Vendas' : 'Negociações'
              ]}
            />
            <Bar dataKey="vendas" name="vendas" radius={[0, 4, 4, 0]}>
              {originsData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lista resumo */}
      <div className="mt-4 space-y-1.5">
        {originsData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-foreground">{item.name}</span>
            </div>
            <span className="text-muted-foreground font-medium">
              {item.vendas} venda{item.vendas !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
