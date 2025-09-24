import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  User,
  MapPin,
  DollarSign 
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'date' | 'range' | 'text';
  options?: { value: any; label: string }[];
  icon?: React.ReactNode;
}

interface ActiveFilter {
  id: string;
  label: string;
  value: any;
  displayValue: string;
}

interface SearchWithFiltersProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterOption[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filterId: string, value: any) => void;
  onClearFilter: (filterId: string) => void;
  onClearAllFilters: () => void;
  className?: string;
  showResultCount?: boolean;
  resultCount?: number;
}

const SearchWithFilters: React.FC<SearchWithFiltersProps> = ({
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  filters,
  activeFilters,
  onFilterChange,
  onClearFilter,
  onClearAllFilters,
  className,
  showResultCount = false,
  resultCount = 0,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 300);

  React.useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" 
            aria-hidden="true"
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Campo de busca"
          />
        </div>

        {/* Filter Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "gap-2 min-w-[120px]",
                hasActiveFilters && "border-primary"
              )}
              aria-expanded={isFilterOpen}
              aria-haspopup="true"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAllFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Limpar tudo
                  </Button>
                )}
              </div>

              {/* Filter Options */}
              <div className="space-y-3">
                {filters.map((filter) => {
                  const activeFilter = activeFilters.find(af => af.id === filter.id);
                  
                  return (
                    <div key={filter.id} className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        {filter.icon}
                        {filter.label}
                      </label>
                      
                      {filter.type === 'select' && (
                        <Select
                          value={activeFilter?.value || ''}
                          onValueChange={(value) => onFilterChange(filter.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {filter.type === 'text' && (
                        <Input
                          value={activeFilter?.value || ''}
                          onChange={(e) => onFilterChange(filter.id, e.target.value)}
                          placeholder={`Filtrar por ${filter.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.id} 
              variant="secondary" 
              className="gap-1 pl-2 pr-1"
            >
              <span className="text-xs">
                {filter.label}: {filter.displayValue}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClearFilter(filter.id)}
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                aria-label={`Remover filtro ${filter.label}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Result Count */}
      {showResultCount && (
        <div className="text-sm text-muted-foreground">
          {resultCount === 0 
            ? "Nenhum resultado encontrado" 
            : `${resultCount} resultado${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}`
          }
        </div>
      )}
    </div>
  );
};

export default SearchWithFilters;

// Example usage hook
export const useSearchAndFilters = function<T>(
  data: T[],
  searchFields: (keyof T)[],
  filterConfigs: FilterOption[],
  customFilters?: Record<string, (data: T[], value: any) => T[]>
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const filteredData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && 
            String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply active filters
    activeFilters.forEach(filter => {
      const config = filterConfigs.find(f => f.id === filter.id);
      if (config) {
        // Check if there's a custom filter function
        if (customFilters && customFilters[filter.id]) {
          result = customFilters[filter.id](result, filter.value);
        } else {
          result = result.filter(item => {
            // Handle date-based filters (month/year)
            if (filter.id === 'month' || filter.id === 'year') {
              // Assume the item has sale_date or created_at field
              const saleDate = new Date((item as any).sale_date || (item as any).created_at || '');
              
              if (filter.id === 'month') {
                return saleDate.getMonth() + 1 === filter.value; // getMonth() returns 0-11
              } else if (filter.id === 'year') {
                return saleDate.getFullYear() === filter.value;
              }
            }
            
            // Handle other filters
            const itemValue = item[filter.id as keyof T];
            return itemValue === filter.value;
          });
        }
      }
    });

    return result;
  }, [data, searchTerm, activeFilters, searchFields, filterConfigs, customFilters]);

  const handleFilterChange = (filterId: string, value: any) => {
    if (!value) {
      handleClearFilter(filterId);
      return;
    }

    const config = filterConfigs.find(f => f.id === filterId);
    if (!config) return;

    const displayValue = config.options?.find(opt => opt.value === value)?.label || String(value);
    
    setActiveFilters(prev => {
      const existing = prev.find(f => f.id === filterId);
      if (existing) {
        return prev.map(f => 
          f.id === filterId 
            ? { ...f, value, displayValue }
            : f
        );
      }
      return [...prev, { id: filterId, label: config.label, value, displayValue }];
    });
  };

  const handleClearFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    activeFilters,
    filteredData,
    handleFilterChange,
    handleClearFilter,
    handleClearAllFilters,
    resultCount: filteredData.length,
  };
};