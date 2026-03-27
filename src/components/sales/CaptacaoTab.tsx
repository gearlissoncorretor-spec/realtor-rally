import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Home, TrendingUp, DollarSign, BarChart3, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import type { Sale } from "@/contexts/DataContext";
import type { Broker } from "@/contexts/DataContext";

const currentYear = new Date().getFullYear();

interface CaptacaoTabProps {
  sales: Sale[];
  brokers: Broker[];
  loading: boolean;
  onRegisterSale?: () => void;
}

export const CaptacaoTab = ({ sales, brokers, loading, onRegisterSale }: CaptacaoTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);

  const months = [
    { value: 0, label: 'Todos os meses' },
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ];

  // Filter only sales with tipo='captacao'
  const captacaoSales = useMemo(() => {
    return sales.filter(sale => {
      if (sale.tipo !== 'captacao') return false;
      if (sale.status === 'cancelada' || sale.status === 'distrato') return false;
      
      const d = new Date(sale.sale_date || sale.created_at || '');
      if (isNaN(d.getTime())) return false;
      if (selectedYear > 0 && d.getFullYear() !== selectedYear) return false;
      if (selectedMonth > 0 && d.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });
  }, [sales, selectedYear, selectedMonth]);

  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) return captacaoSales;
    const lower = searchTerm.toLowerCase();
    return captacaoSales.filter(sale =>
      sale.captador?.toLowerCase().includes(lower) ||
      sale.vendedor?.toLowerCase().includes(lower) ||
      sale.client_name?.toLowerCase().includes(lower) ||
      sale.property_address?.toLowerCase().includes(lower) ||
      brokers.find(b => b.id === sale.broker_id)?.name.toLowerCase().includes(lower)
    );
  }, [captacaoSales, searchTerm, brokers]);

  // Metrics
  const totalVGV = filteredSales.reduce((sum, s) => sum + Number(s.vgv || s.property_value || 0), 0);
  
  const totalCaptacoes = filteredSales.length;

  // Top captadores ranking
  const captadorRanking = useMemo(() => {
    const map = new Map<string, { name: string; count: number; vgv: number }>();
    filteredSales.forEach(sale => {
      const captador = sale.captador || '';
      if (!captador) return;
      const existing = map.get(captador) || { name: captador, count: 0, vgv: 0 };
      existing.count += 1;
      existing.vgv += Number(sale.vgv || sale.property_value || 0);
      map.set(captador, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.vgv - a.vgv);
  }, [filteredSales]);

  const availableYears = useMemo(() => {
    const years = [...new Set(sales.map(sale => {
      const d = new Date(sale.sale_date || sale.created_at || '');
      return d.getFullYear();
    }))].filter(y => !isNaN(y)).sort((a, b) => b - a);
    if (!years.includes(currentYear)) years.unshift(currentYear);
    return years;
  }, [sales]);

  const hasActiveFilters = selectedYear !== currentYear || selectedMonth !== 0 || searchTerm;

  // Monthly evolution chart data
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthMap = new Map<number, { count: number; vgv: number }>();
    
    // Initialize all 12 months
    for (let i = 0; i < 12; i++) {
      monthMap.set(i, { count: 0, vgv: 0 });
    }

    // Use captacaoSales (already year-filtered, but ignore month filter for the chart)
    const yearFilteredSales = sales.filter(sale => {
      if (sale.tipo !== 'captacao') return false;
      if (sale.status === 'cancelada' || sale.status === 'distrato') return false;
      const d = new Date(sale.sale_date || sale.created_at || '');
      if (isNaN(d.getTime())) return false;
      if (selectedYear > 0 && d.getFullYear() !== selectedYear) return false;
      return true;
    });

    yearFilteredSales.forEach(sale => {
      const d = new Date(sale.sale_date || sale.created_at || '');
      const month = d.getMonth();
      const existing = monthMap.get(month)!;
      existing.count += 1;
      existing.vgv += Number(sale.vgv || sale.property_value || 0);
    });

    return monthNames.map((name, i) => ({
      name,
      captacoes: monthMap.get(i)!.count,
      vgv: monthMap.get(i)!.vgv,
    }));
  }, [sales, selectedYear]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatCompactCurrency = (value: number) => {
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
    return `R$ ${value}`;
  };

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando captações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar captador, vendedor, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-background/50 border-border/50"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[110px] h-9 text-xs bg-background/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todos anos</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-background/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedYear(currentYear); setSelectedMonth(0); setSearchTerm(''); }}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-2"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-border/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Home className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Captações Vendidas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCaptacoes}</p>
        </Card>
        <Card className="p-4 border-border/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-success/10">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">VGV Captações</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalVGV)}</p>
        </Card>
        <Card className="p-4 border-border/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-warning/10">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
            <span className="text-xs text-muted-foreground">Ticket Médio</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {totalCaptacoes > 0 ? formatCurrency(totalVGV / totalCaptacoes) : 'R$ 0'}
          </p>
        </Card>
      </div>

      {/* Monthly Evolution Chart */}
      <Card className="overflow-hidden border-border/50">
        <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Evolução Mensal de Captações</h3>
          </div>
          <Badge variant="outline" className="text-xs">{selectedYear > 0 ? selectedYear : 'Todos'}</Badge>
        </div>
        <CardContent className="p-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={formatCompactCurrency} />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'vgv') return [formatCurrency(value), 'VGV'];
                    return [value, 'Captações'];
                  }}
                />
                <Bar yAxisId="left" dataKey="captacoes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={28} opacity={0.85} />
                <Line yAxisId="right" type="monotone" dataKey="vgv" stroke="hsl(var(--success, 142 71% 45%))" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span>Captações</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-success rounded" />
              <span>VGV</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Captadores */}
      {captadorRanking.length > 0 && (
        <Card className="overflow-hidden border-border/50">
          <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Ranking de Captadores</h3>
            </div>
            <Badge variant="outline" className="text-xs">{captadorRanking.length} captadores</Badge>
          </div>
          <div className="p-3 space-y-2">
            {captadorRanking.map((captador, idx) => (
              <div key={captador.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50 hover:border-primary/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{captador.name}</p>
                  <p className="text-xs text-muted-foreground">{captador.count} {captador.count === 1 ? 'captação' : 'captações'} vendidas</p>
                </div>
                <p className="font-bold text-sm text-primary">{formatCurrency(captador.vgv)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sales Table */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Captações Vendidas</h3>
          </div>
          <div className="flex items-center gap-2">
            {onRegisterSale && (
              <Button onClick={onRegisterSale} size="sm" className="h-8 gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Venda
              </Button>
            )}
            <Badge variant="outline" className="text-xs font-medium">
              {filteredSales.length} {filteredSales.length === 1 ? 'registro' : 'registros'}
            </Badge>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Home className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Nenhuma captação encontrada para os filtros aplicados.'
                  : 'Nenhuma captação registrada. Cadastre uma nova venda com tipo "Captação".'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="block md:hidden space-y-2 p-3">
              {filteredSales.map((sale) => (
                <Card key={sale.id} className="border-border/40">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate text-sm">{sale.property_address}</p>
                        <p className="text-xs text-muted-foreground truncate">{sale.client_name}</p>
                      </div>
                      <Badge variant="default" className="shrink-0 text-[10px]">Vendida</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Captador</p>
                        <p className="truncate font-medium text-primary">{sale.captador || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vendedor</p>
                        <p className="truncate font-medium">{sale.vendedor_nome || sale.vendedor || brokers.find(b => b.id === sale.broker_id)?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">VGV</p>
                        <p className="font-bold text-primary">{formatCurrency(Number(sale.vgv || sale.property_value || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Data</p>
                        <p className="font-medium">{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-muted/30 border-b border-border/50">
                  <tr>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Imóvel</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Captador</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Vendedor</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">VGV</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-sm text-foreground max-w-[200px] truncate">{sale.property_address}</td>
                      <td className="p-3 text-sm text-foreground max-w-[150px] truncate">{sale.client_name}</td>
                      <td className="p-3 text-sm font-medium text-primary">{sale.captador || '-'}</td>
                      <td className="p-3 text-sm text-foreground">{sale.vendedor_nome || sale.vendedor || brokers.find(b => b.id === sale.broker_id)?.name || '-'}</td>
                      <td className="p-3 text-sm font-bold text-foreground">{formatCurrency(Number(sale.vgv || sale.property_value || 0))}</td>
                      <td className="p-3 text-sm text-muted-foreground">{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
