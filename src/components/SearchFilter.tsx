import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  selectedFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchFilter = ({
  searchValue,
  onSearchChange,
  filters = [],
  selectedFilters = {},
  onFilterChange,
  onClearFilters,
  placeholder = "Buscar...",
  className = ""
}: SearchFilterProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.values(selectedFilters).some(value => value && value !== '');

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-4 w-4" />
          Buscar e Filtrar
        </CardTitle>
        <CardDescription>
          Use os filtros para encontrar os dados que você precisa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          {filters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {Object.values(selectedFilters).filter(v => v && v !== '').length}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Filters Section */}
        {showFilters && filters.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Filtros Avançados</Label>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {filter.label}
                    </Label>
                    <Select
                      value={selectedFilters[filter.key] || ''}
                      onValueChange={(value) => onFilterChange?.(filter.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecionar ${filter.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(selectedFilters).map(([key, value]) => {
              if (!value || value === '') return null;
              
              const filter = filters.find(f => f.key === key);
              const option = filter?.options.find(o => o.value === value);
              
              return (
                <div
                  key={key}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                >
                  <span className="font-medium">{filter?.label}:</span>
                  <span>{option?.label || value}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange?.(key, '')}
                    className="h-auto w-auto p-0 text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};