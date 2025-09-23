import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveRowProps {
  data: Record<string, any>;
  columns: ColumnConfig[];
  actions?: ActionConfig[];
  expandedContent?: React.ReactNode;
  isExpandable?: boolean;
  className?: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
  hideOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low'; // high = always visible, medium = hidden on mobile, low = hidden on tablet
}

interface ActionConfig {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: Record<string, any>) => void;
  variant?: 'default' | 'destructive';
}

const ResponsiveTable = React.forwardRef<HTMLDivElement, ResponsiveTableProps>(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("w-full", className)} 
      {...props}
      role="table"
      aria-label="Tabela de dados responsiva"
    >
      {children}
    </div>
  )
);
ResponsiveTable.displayName = "ResponsiveTable";

const ResponsiveTableHeader: React.FC<{ columns: ColumnConfig[] }> = ({ columns }) => {
  const getColumnSpan = (index: number, total: number) => {
    // Give more space to first column (names) and adjust others accordingly
    if (total <= 6) {
      if (index === 0) return "col-span-3"; // More space for names
      if (index === 1) return "col-span-2"; // Property type
      return "col-span-1"; // Other columns
    }
    return "col-span-1";
  };

  return (
    <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-5 bg-muted/50 font-medium text-sm border-b text-muted-foreground" role="row">
      <div className="col-span-1" aria-hidden="true"></div>
      {columns.map((column, index) => (
        <div 
          key={column.key}
          className={cn(
            getColumnSpan(index, columns.length),
            "text-left font-semibold",
            column.hideOnMobile && "hidden md:block",
            column.priority === 'low' && "hidden lg:block"
          )}
          role="columnheader"
          tabIndex={0}
        >
          {column.label}
        </div>
      ))}
      <div className="col-span-1 font-semibold" role="columnheader">Ações</div>
    </div>
  );
};

const ResponsiveTableRow: React.FC<ResponsiveRowProps> = ({ 
  data, 
  columns, 
  actions = [], 
  expandedContent,
  isExpandable = false,
  className 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isExpandable) {
        setIsExpanded(!isExpanded);
      }
    }
  };

  if (isMobile) {
    // Mobile card layout
    return (
      <Card className={cn("mb-6", className)}>
        <div 
          className="p-6 space-y-4"
          role="row"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpandable ? isExpanded : undefined}
        >
          {/* Primary info - always visible */}
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-3">
              {columns
                .filter(col => col.priority === 'high')
                .map(column => (
                  <div key={column.key} className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {column.label}
                    </span>
                    <span className="text-sm font-medium">
                      {column.render ? column.render(data[column.key], data) : data[column.key]}
                    </span>
                  </div>
                ))}
            </div>
            
            {/* Actions dropdown */}
            {actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 h-8 w-8"
                    aria-label="Mais ações"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => action.onClick(data)}
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Secondary info - collapsible */}
          {(isExpandable || expandedContent) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full justify-between p-2 h-8"
                aria-expanded={isExpanded}
                aria-controls={`expanded-content-${data.id || 'row'}`}
              >
                <span className="text-xs">Ver mais detalhes</span>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              
              {isExpanded && (
                <div 
                  id={`expanded-content-${data.id || 'row'}`}
                  className="pt-4 border-t space-y-3"
                  role="region"
                  aria-label="Detalhes expandidos"
                >
                  {expandedContent || (
                    <div className="grid grid-cols-1 gap-4">
                      {columns
                        .filter(col => col.priority !== 'high')
                        .map(column => (
                          <div key={column.key} className="flex justify-between py-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {column.label}:
                            </span>
                            <span className="text-xs">
                              {column.render ? column.render(data[column.key], data) : data[column.key]}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    );
  }

  // Desktop table layout
  return (
    <>
      <div 
        className={cn(
          "grid grid-cols-12 gap-6 px-6 py-5 hover:bg-muted/30 border-b transition-colors duration-200 cursor-pointer", 
          className
        )}
        role="row"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpandable ? isExpanded : undefined}
      >
        <div className="col-span-1 flex items-center">
          {(isExpandable || expandedContent) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
        
        {columns.map((column, index) => {
          const getColumnSpan = (index: number, total: number) => {
            // Give more space to first column (names) and adjust others accordingly
            if (total <= 6) {
              if (index === 0) return "col-span-3"; // More space for names
              if (index === 1) return "col-span-2"; // Property type
              return "col-span-1"; // Other columns
            }
            return "col-span-1";
          };

          return (
            <div 
              key={column.key}
              className={cn(
                getColumnSpan(index, columns.length),
                "flex items-center text-sm min-w-0 truncate",
                column.hideOnMobile && "hidden md:block",
                column.priority === 'low' && "hidden lg:block"
              )}
              role="gridcell"
              title={typeof data[column.key] === 'string' ? data[column.key] : ''}
            >
              <div className="truncate w-full">
                {column.render ? column.render(data[column.key], data) : data[column.key]}
              </div>
            </div>
          );
        })}
        
        <div className="col-span-1 flex items-center">
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.slice(0, 2).map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="ghost"
                  onClick={() => action.onClick(data)}
                  className={cn(
                    "p-2 h-8 w-8",
                    action.variant === 'destructive' && "text-destructive hover:text-destructive"
                  )}
                  aria-label={action.label}
                >
                  {action.icon}
                </Button>
              ))}
              
              {actions.length > 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 h-8 w-8" aria-label="Mais ações">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {actions.slice(2).map((action, index) => (
                      <DropdownMenuItem
                        key={index + 2}
                        onClick={() => action.onClick(data)}
                        className={action.variant === 'destructive' ? 'text-destructive' : ''}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded content for desktop */}
      {isExpanded && expandedContent && (
        <div 
          className="col-span-12 bg-muted/20 px-6 py-5 border-b"
          role="region"
          aria-label="Detalhes expandidos"
        >
          {expandedContent}
        </div>
      )}
    </>
  );
};

export { 
  ResponsiveTable, 
  ResponsiveTableHeader, 
  ResponsiveTableRow,
  type ColumnConfig,
  type ActionConfig 
};