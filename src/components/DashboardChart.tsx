import { Card } from "@/components/ui/card";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

interface ChartData {
  month: string;
  vgv: number;
  vgc: number;
  sales: number;
}

interface DashboardChartProps {
  data: ChartData[];
  type: "line" | "bar" | "pie";
  title: string;
  height?: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))'];

const DashboardChart = ({ data, type, title, height = 300 }: DashboardChartProps) => {
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVgc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `R$ ${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-lg)"
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="vgv" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorVgv)"
                name="VGV"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="vgc" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorVgc)"
                name="VGC"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-lg)"
                }}
              />
              <Bar 
                dataKey="sales" 
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                name="Vendas"
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie": {
        const pieData = data.slice(0, 4).map((item, index) => ({
          name: item.month,
          value: item.sales,
          color: COLORS[index % COLORS.length]
        }));

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-lg)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-card border-border/50 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      </div>
      {renderChart()}
    </Card>
  );
};

export default DashboardChart;