import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickFilter {
  id: string;
  label: string;
  filterKey: string;
  filterValue: string | (() => boolean);
  variant?: 'default' | 'success' | 'destructive' | 'warning';
}

interface SalesQuickFiltersProps {
  activeFilters: { id: string; value: any }[];
  onFilterChange: (filterId: string, value: any) => void;
  onClearFilter: (filterId: string) => void;
  totalResults: number;
}

export const SalesQuickFilters = ({
  activeFilters,
  onFilterChange,
  onClearFilter,
  totalResults,
}: SalesQuickFiltersProps) => {
  const quickFilters: QuickFilter[] = [
    { 
      id: 'status-confirmada', 
      label: 'Confirmadas', 
      filterKey: 'status', 
      filterValue: 'confirmada',
      variant: 'success',
    },
    { 
      id: 'status-pendente', 
      label: 'Pendentes', 
      filterKey: 'status', 
      filterValue: 'pendente',
      variant: 'warning',
    },
    { 
      id: 'status-cancelada', 
      label: 'Canceladas', 
      filterKey: 'status', 
      filterValue: 'cancelada',
      variant: 'destructive',
    },
  ];

  const isFilterActive = (filter: QuickFilter) => {
    return activeFilters.some(f => f.id === filter.filterKey && f.value === filter.filterValue);
  };

  const handleFilterClick = (filter: QuickFilter) => {
    if (isFilterActive(filter)) {
      onClearFilter(filter.filterKey);
    } else {
      onFilterChange(filter.filterKey, filter.filterValue);
    }
  };

  const getVariantStyles = (variant?: string, isActive?: boolean) => {
    if (!isActive) return "bg-muted hover:bg-muted/80 text-muted-foreground";
    
    switch (variant) {
      case 'success':
        return "bg-success/20 text-success border-success/30 hover:bg-success/30";
      case 'destructive':
        return "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30";
      case 'warning':
        return "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30";
      default:
        return "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Filtros rápidos:</span>
      {quickFilters.map((filter) => {
        const isActive = isFilterActive(filter);
        return (
          <Button
            key={filter.id}
            variant="outline"
            size="sm"
            onClick={() => handleFilterClick(filter)}
            className={cn(
              "h-7 px-3 text-xs font-medium transition-all duration-200 border",
              getVariantStyles(filter.variant, isActive)
            )}
          >
            {filter.label}
          </Button>
        );
      })}
      
      {totalResults > 0 && (
        <Badge variant="secondary" className="ml-2 text-xs">
          {totalResults} resultados
        </Badge>
      )}
    </div>
  );
};

export default SalesQuickFilters;
