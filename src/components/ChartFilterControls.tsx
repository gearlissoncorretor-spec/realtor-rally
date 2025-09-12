import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { BarChart3, Filter } from "lucide-react";
import type { Broker } from "@/contexts/DataContext";

interface ChartFilterControlsProps {
  brokers: Broker[];
  selectedBroker: string;
  onBrokerChange: (brokerId: string) => void;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
}

const ChartFilterControls = ({
  brokers,
  selectedBroker,
  onBrokerChange,
  selectedMetric,
  onMetricChange
}: ChartFilterControlsProps) => {
  const metrics = [
    { value: 'revenue', label: 'Receita Total' },
    { value: 'sales_count', label: 'Número de Vendas' },
    { value: 'average_ticket', label: 'Ticket Médio' },
    { value: 'property_types', label: 'Tipos de Imóveis' },
    { value: 'monthly_performance', label: 'Performance Mensal' },
  ];

  return (
    <Card className="p-4 mb-6 bg-gradient-card border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Filtros do Gráfico:</span>
        </div>
        
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Corretor:</span>
            <Select value={selectedBroker} onValueChange={onBrokerChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar corretor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Corretores</SelectItem>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Métrica:</span>
            <Select value={selectedMetric} onValueChange={onMetricChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar métrica" />
              </SelectTrigger>
              <SelectContent>
                {metrics.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChartFilterControls;