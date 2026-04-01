import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Thermometer, Clock } from "lucide-react";

const TEMPERATURE_OPTIONS = [
  { value: 'fria', label: '❄️ Fria' },
  { value: 'morna', label: '🌤️ Morna' },
  { value: 'quente', label: '🔥 Quente' },
];

interface NegotiationFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterTemperature: string;
  setFilterTemperature: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  showStatusFilter: boolean;
  flowStatuses: Array<{ value: string; label: string; icon?: string }>;
}

export function NegotiationFilters({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterTemperature,
  setFilterTemperature,
  sortOrder,
  setSortOrder,
  showStatusFilter,
  flowStatuses,
}: NegotiationFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar negociações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {showStatusFilter && (
            <>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {flowStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span>{status.icon}</span>
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Termômetro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4" />
                      Todas
                    </div>
                  </SelectItem>
                  {TEMPERATURE_OPTIONS.map((temp) => (
                    <SelectItem key={temp.value} value={temp.value}>
                      {temp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Mais recentes
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Mais antigas
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
