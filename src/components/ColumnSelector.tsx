import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Eye, EyeOff } from "lucide-react";
import type { ColumnConfig } from "@/components/ui/responsive-table";

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onColumnToggle: (columnKey: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  visibleColumns,
  onColumnToggle,
  onSelectAll,
  onSelectNone,
}) => {
  const visibleCount = visibleColumns.length;
  const totalCount = columns.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Colunas</span>
          <Badge variant="secondary" className="text-xs">
            {visibleCount}/{totalCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">Configurar Colunas</h4>
              <Badge variant="outline" className="text-xs">
                {visibleCount} de {totalCount} visíveis
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSelectAll}
                className="text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Todas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSelectNone}
                className="text-xs"
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Nenhuma
              </Button>
            </div>
          </div>
          
          <div className="p-4 max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {columns.map((column) => (
                <div 
                  key={column.key} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`column-${column.key}`}
                    checked={visibleColumns.includes(column.key)}
                    onCheckedChange={() => onColumnToggle(column.key)}
                  />
                  <label
                    htmlFor={`column-${column.key}`}
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {column.label}
                  </label>
                  {column.priority === 'high' && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};