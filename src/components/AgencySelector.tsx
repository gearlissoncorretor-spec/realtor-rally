import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useAgencies } from '@/hooks/useAgencies';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AgencySelector = () => {
  const { isDiretor } = useAuth();
  const { selectedAgencyId, setSelectedAgencyId } = useAgency();
  const { agencies, loading } = useAgencies();

  if (!isDiretor()) return null;

  const currentAgency = selectedAgencyId === 'all' 
    ? { name: 'Todas as Agências' } 
    : agencies.find(a => a.id === selectedAgencyId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-between gap-2 px-3 h-10 bg-muted/30 border-border/40 hover:bg-muted/50 transition-all duration-200 group"
          disabled={loading}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="truncate text-xs font-medium text-foreground/80 group-hover:text-foreground">
              {currentAgency?.name || 'Carregando...'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] p-1 shadow-xl border-border/40 backdrop-blur-xl">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">
          Selecionar Unidade
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        <DropdownMenuItem 
          onClick={() => setSelectedAgencyId('all')}
          className={cn(
            "flex items-center gap-2 cursor-pointer transition-colors px-2 py-2 rounded-md",
            selectedAgencyId === 'all' ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
          )}
        >
          <Building2 className="w-4 h-4 opacity-70" />
          <span className="text-sm">Todas as Agências</span>
        </DropdownMenuItem>
        
        {agencies.map((agency) => (
          <DropdownMenuItem
            key={agency.id}
            onClick={() => setSelectedAgencyId(agency.id)}
            className={cn(
              "flex items-center gap-2 cursor-pointer transition-colors px-2 py-2 rounded-md mt-0.5",
              selectedAgencyId === agency.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
            )}
          >
            <div className="w-4 h-4 rounded-sm border border-border/60 flex items-center justify-center text-[10px] font-bold">
              {agency.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm truncate">{agency.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
