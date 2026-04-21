import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  LayoutGrid, 
  Trophy, 
  ShoppingBag, 
  Settings, 
  TrendingUp, 
  Users, 
  Menu, 
  X, 
  Target, 
  Columns3, 
  Building2,
  ClipboardList,
  Handshake,
  Wallet,
  Receipt,
  FileBarChart,
  PieChart,
  CalendarDays,
  Download,
  ChevronDown,
  Search,
  LogOut,
  RefreshCw,
  Shield,
  UserCog,
  UsersRound,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { roleHasScreenAccess } from "@/lib/roleScreens";
import { usePendingUsersCount } from "@/hooks/useRolePermissions";
import AuthButton from "@/components/AuthButton";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useContextualIdentity } from "@/hooks/useContextualIdentity";
import { UserAvatar } from "@/components/UserAvatar";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CommandPalette } from "@/components/CommandPalette";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  screen: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const MobileBottomNav = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getUserRole } = useAuth();
  const role = getUserRole();

  const corretorItems = [
    { href: "/", label: "Painel", icon: LayoutGrid },
    { href: "/negociacoes", label: "Negociações", icon: Handshake },
    { href: "/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/follow-up", label: "Follow-up / Clientes", icon: Users },
  ];

  const defaultItems = [
    { href: "/", label: "Home", icon: LayoutGrid },
    { href: "/vendas", label: "Vendas", icon: ShoppingBag },
    { href: "/negociacoes", label: "Negociações", icon: Handshake },
    { href: "/ranking", label: "Ranking", icon: Trophy },
  ];

  const bottomItems = role === 'super_admin'
    ? [{ href: "/super-admin", label: "Super Admin", icon: Shield }]
    : role === 'corretor'
      ? corretorItems
      : defaultItems;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-t border-border/40 z-40 flex items-center justify-around px-2 safe-area-bottom">
      {bottomItems.map(item => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 relative",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]")} />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
            {isActive && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 relative text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] font-medium truncate">Menu</span>
      </button>
    </div>
  );
};

const Navigation = () => {
...


export default Navigation;
