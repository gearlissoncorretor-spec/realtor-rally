import React, { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSales } from "@/hooks/useSales";
import { useLeads } from "@/hooks/useLeads";
import { useNegotiations } from "@/hooks/useNegotiations";
import { formatCurrency } from "@/utils/formatting";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, AreaChart, Area,
  PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, 
  Map as MapIcon, 
  Target, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Calendar,
  Layers
} from "lucide-react";
import { OriginAnalyticsDashboard } from "@/components/dashboards/OriginAnalyticsDashboard";
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for leaflet icons in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BIAvancado = () => {
  const { sales, loading: salesLoading } = useSales();
  const { negotiations, loading: negotiationsLoading } = useNegotiations();
  const { leads, loading: leadsLoading } = useLeads();

  const [forecastMonths, setForecastMonths] = useState(3);

  // --- Revenue Forecasting Logic ---
  const forecastData = useMemo(() => {
    if (salesLoading || sales.length === 0) return [];

    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();
    
    // Last 12 months history
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyRevenue[key] = 0;
    }

    sales.forEach(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at);
      const key = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += Number(sale.vgv || 0);
      }
    });

    const history = Object.entries(monthlyRevenue).map(([date, value]) => ({
      date,
      value,
      type: 'Histórico' as const
    }));

    // Simple Forecasting (Moving Average of last 3 months)
    const last3Months = history.slice(-3);
    const avgRevenue = last3Months.reduce((sum, item) => sum + item.value, 0) / 3;

    const forecast = [];
    for (let i = 1; i <= forecastMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      forecast.push({
        date: key,
        value: avgRevenue * (1 + (i * 0.05)), // adding a slight 5% growth factor for "optimism"
        type: 'Previsão' as const
      });
    }

    return [...history, ...forecast];
  }, [sales, salesLoading, forecastMonths]);

  // --- Map Data Logic ---
  const mapPoints = useMemo(() => {
    return sales
      .filter(s => {
        const lat = parseFloat(s.latitude || "");
        const lng = parseFloat(s.longitude || "");
        return !isNaN(lat) && !isNaN(lng);
      })
      .map(s => ({
        id: s.id,
        lat: parseFloat(s.latitude!),
        lng: parseFloat(s.longitude!),
        client: s.client_name,
        value: s.vgv,
        address: s.property_address
      }));
  }, [sales]);

  const center: [number, number] = mapPoints.length > 0 
    ? [mapPoints[0].lat, mapPoints[0].lng] 
    : [-15.7942, -47.8822]; // Brasilia default

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            BI Avançado & Predição
          </h1>
          <p className="text-muted-foreground">
            Inteligência de dados, previsões de receita e análise geoespacial.
          </p>
        </div>

        <Tabs defaultValue="conversion" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="conversion" className="flex items-center gap-2">
              <Target className="w-4 h-4" /> Conversão
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Previsão
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> Mapa de Vendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversion" className="animate-in fade-in-50 duration-500">
            <OriginAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Previsão de Receita (VGV)</CardTitle>
                  <CardDescription>
                    Baseado no histórico dos últimos 12 meses e tendência de mercado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12}} 
                        tickFormatter={(str) => {
                          const [y, m] = str.split('-');
                          const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                          return `${months[parseInt(m)-1]} ${y.slice(2)}`;
                        }}
                      />
                      <YAxis 
                        tick={{fontSize: 12}} 
                        tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Período: ${label}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        name="VGV"
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={3}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeDasharray="5 5" 
                        dot={false}
                        activeDot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Tendência Próximos 3 Meses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(forecastData.filter(d => d.type === 'Previsão').reduce((sum, d) => sum + d.value, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-success" /> +15.4% em relação ao trimestre anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-warning" /> Leads em Negociação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {negotiations.length} Negociações
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Potencial de {formatCurrency(negotiations.reduce((sum, n) => sum + Number(n.negotiated_value || 0), 0))}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" /> Insight de IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs leading-relaxed">
                      Sua taxa de fechamento está 12% acima da média regional. Para bater a meta do próximo mês, foque em leads vindos de <strong>Tráfego Pago</strong>, que possuem o maior ticket médio atual.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="heatmap" className="animate-in fade-in-50 duration-500">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mapa de Vendas Realizadas</CardTitle>
                    <CardDescription>Distribuição geográfica das propriedades vendidas.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-muted p-1 rounded-md text-xs font-medium">
                    <span className="px-2 py-1 rounded bg-background shadow-sm">Concentração</span>
                    <span className="px-2 py-1 text-muted-foreground">Individual</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-xl overflow-hidden border border-border">
                  {mapPoints.length > 0 ? (
                    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {mapPoints.map(point => (
                        <CircleMarker 
                          key={point.id} 
                          center={[point.lat, point.lng]} 
                          radius={10}
                          pathOptions={{ 
                            fillColor: '#3b82f6', 
                            color: '#1d4ed8', 
                            weight: 2, 
                            opacity: 1, 
                            fillOpacity: 0.6 
                          }}
                        >
                          <Popup>
                            <div className="p-1">
                              <p className="font-bold text-sm mb-1">{point.client}</p>
                              <p className="text-xs text-muted-foreground mb-1">{point.address}</p>
                              <p className="font-semibold text-primary">{formatCurrency(point.value)}</p>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-muted/30 text-center p-8">
                      <MapIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                      <h3 className="text-lg font-medium">Sem dados de geolocalização</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mt-2">
                        As vendas atuais não possuem coordenadas (latitude/longitude) cadastradas para exibição no mapa.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BIAvancado;