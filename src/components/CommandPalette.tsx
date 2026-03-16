import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutGrid, Trophy, Home, Settings, TrendingUp, Users, Target,
  Columns3, Building2, ClipboardList, Handshake, DollarSign,
  PieChart, CalendarDays, Download
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const screens = [
  { label: "Dashboard", href: "/", icon: LayoutGrid, group: "Principal" },
  { label: "Central do Gestor", href: "/central-gestor", icon: TrendingUp, group: "Principal" },
  { label: "Dashboard Equipes", href: "/dashboard-equipes", icon: Building2, group: "Principal" },
  { label: "Ranking", href: "/ranking", icon: Trophy, group: "Principal" },
  { label: "Vendas", href: "/vendas", icon: Home, group: "Comercial" },
  { label: "Negociações", href: "/negociacoes", icon: Handshake, group: "Comercial" },
  { label: "Follow-up / Clientes", href: "/follow-up", icon: Users, group: "Comercial" },
  { label: "Status Vendas", href: "/acompanhamento", icon: DollarSign, group: "Comercial" },
  { label: "Metas", href: "/metas", icon: Target, group: "Produtividade" },
  { label: "Meta Gestão", href: "/meta-gestao", icon: PieChart, group: "Produtividade" },
  { label: "Atividades", href: "/atividades", icon: ClipboardList, group: "Produtividade" },
  { label: "Tarefas", href: "/tarefas-kanban", icon: Columns3, group: "Produtividade" },
  { label: "X1", href: "/x1", icon: Columns3, group: "Produtividade" },
  { label: "Agenda", href: "/agenda", icon: CalendarDays, group: "Produtividade" },
  { label: "Relatórios", href: "/relatorios", icon: TrendingUp, group: "Relatórios" },
  { label: "Corretores", href: "/corretores", icon: Users, group: "Gestão" },
  { label: "Equipes", href: "/equipes", icon: Users, group: "Gestão" },
  { label: "Gestão de Usuários", href: "/gestao-usuarios", icon: Users, group: "Gestão" },
  { label: "Configurações", href: "/configuracoes", icon: Settings, group: "Sistema" },
  { label: "Instalar App", href: "/instalar", icon: Download, group: "Sistema" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = useCallback((href: string) => {
    onOpenChange(false);
    navigate(href);
  }, [navigate, onOpenChange]);

  const groups = [...new Set(screens.map(s => s.group))];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar telas, corretores, vendas..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {groups.map((group, i) => (
          <div key={group}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {screens.filter(s => s.group === group).map(screen => {
                const Icon = screen.icon;
                return (
                  <CommandItem
                    key={screen.href}
                    value={screen.label}
                    onSelect={() => handleSelect(screen.href)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span>{screen.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
