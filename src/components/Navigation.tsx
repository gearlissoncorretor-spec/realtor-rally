import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  LayoutGrid, 
  Trophy, 
  Home, 
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
  DollarSign,
  PieChart,
  CalendarDays,
  Download,
  ChevronDown,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import AuthButton from "@/components/AuthButton";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useContextualIdentity } from "@/hooks/useContextualIdentity";
import { UserAvatar } from "@/components/UserAvatar";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CommandPalette } from "@/components/CommandPalette";

// Nav item type
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  screen: string;
}

// Group definition
interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const Navigation = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { hasAccess, isAdmin, getUserRole, profile } = useAuth();
  const navigate = useNavigate();
  const { settings } = useOrganizationSettings();
  const { displayName, subtitle } = useContextualIdentity();
  const [commandOpen, setCommandOpen] = useState(false);

  const allNavItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutGrid, screen: "dashboard" },
    { href: "/dashboard-equipes", label: "Dashboard Equipes", icon: Building2, screen: "dashboard-equipes" },
    { href: "/ranking", label: "Ranking", icon: Trophy, screen: "ranking" },
    { href: "/vendas", label: "Vendas", icon: Home, screen: "vendas" },
    { href: "/negociacoes", label: "Negociações", icon: Handshake, screen: "negociacoes" },
    { href: "/follow-up", label: "Follow Up", icon: Users, screen: "follow-up" },
    { href: "/metas", label: "Metas", icon: Target, screen: "metas" },
    { href: "/meta-gestao", label: "Meta Gestão", icon: PieChart, screen: "meta-gestao" },
    { href: "/atividades", label: "Atividades", icon: ClipboardList, screen: "atividades" },
    { href: "/tarefas-kanban", label: "Tarefas", icon: Columns3, screen: "tarefas-kanban" },
    { href: "/acompanhamento", label: "Status Vendas", icon: DollarSign, screen: "acompanhamento" },
    { href: "/relatorios", label: "Relatórios", icon: TrendingUp, screen: "relatorios" },
    { href: "/corretores", label: "Corretores", icon: Users, screen: "corretores" },
    { href: "/equipes", label: "Equipes", icon: Users, screen: "equipes" },
    { href: "/x1", label: "X1", icon: Columns3, screen: "x1" },
    { href: "/agenda", label: "Agenda", icon: CalendarDays, screen: "agenda" },
    { href: "/gestao-usuarios", label: "Gestão de Usuários", icon: Users, screen: "gestao-usuarios" },
    { href: "/configuracoes", label: "Configurações", icon: Settings, screen: "configuracoes" },
    { href: "/instalar", label: "Instalar App", icon: Download, screen: "instalar" },
  ];

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => {
    const userRole = getUserRole();
    if (isAdmin() || userRole === 'diretor') return true;
    if (item.screen === 'instalar') return true;
    
    const ROLE_SCREENS: Record<string, string[]> = {
      gerente: ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'meta-gestao', 'atividades', 'corretores', 'equipes', 'ranking', 'acompanhamento', 'tarefas-kanban', 'x1', 'configuracoes', 'agenda'],
      corretor: ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'tarefas-kanban', 'configuracoes', 'agenda'],
    };
    
    const roleScreens = ROLE_SCREENS[userRole] || [];
    return roleScreens.includes(item.screen) && hasAccess(item.screen);
  });

  // Group filtered items into categories
  const navGroups: NavGroup[] = [
    {
      label: "Principal",
      defaultOpen: true,
      items: navItems.filter(i => ['dashboard', 'dashboard-equipes', 'ranking'].includes(i.screen)),
    },
    {
      label: "Comercial",
      defaultOpen: true,
      items: navItems.filter(i => ['vendas', 'negociacoes', 'follow-up', 'acompanhamento'].includes(i.screen)),
    },
    {
      label: "Produtividade",
      items: navItems.filter(i => ['metas', 'meta-gestao', 'atividades', 'tarefas-kanban', 'x1', 'agenda'].includes(i.screen)),
    },
    {
      label: "Relatórios",
      items: navItems.filter(i => ['relatorios'].includes(i.screen)),
    },
    {
      label: "Gestão",
      items: navItems.filter(i => ['corretores', 'equipes', 'gestao-usuarios'].includes(i.screen)),
    },
    {
      label: "Sistema",
      items: navItems.filter(i => ['configuracoes', 'instalar'].includes(i.screen)),
    },
  ].filter(g => g.items.length > 0);

  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;

  const renderLogo = () => (
    <div className="flex items-center gap-4">
      {effectiveLogo ? (
        <button onClick={() => navigate('/')} className="w-11 h-11 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden" title="Ir ao Dashboard">
          <img src={effectiveLogo} alt={displayName} className="w-full h-full object-contain" />
        </button>
      ) : (
        <button onClick={() => navigate('/')} className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg shadow-primary/25" title="Ir ao Dashboard">
          <span className="text-lg font-bold text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-foreground tracking-tight truncate">{displayName}</h1>
        {subtitle && <p className="text-xs text-muted-foreground font-medium truncate">{subtitle}</p>}
      </div>
    </div>
  );

  const renderMobileLogo = () => (
    <div className="flex items-center gap-3">
      {effectiveLogo ? (
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden" title="Ir ao Dashboard">
          <img src={effectiveLogo} alt={displayName} className="w-full h-full object-contain" />
        </button>
      ) : (
        <button onClick={() => navigate('/')} className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg shadow-primary/25" title="Ir ao Dashboard">
          <span className="text-sm font-bold text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
        </button>
      )}
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground tracking-tight truncate max-w-[120px]">{displayName}</h1>
      </div>
    </div>
  );

  const renderUserProfile = () => (
    <UserProfileDialog>
      <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors w-full">
        <UserAvatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="md" />
        <div className="text-left min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'Usuário'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
        </div>
      </button>
    </UserProfileDialog>
  );

  const renderNavLink = (item: NavItem, onClick?: () => void) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "stroke-[1.5]")} />
        {item.label}
      </Link>
    );
  };

  const renderGroupedNav = (onClick?: () => void) => (
    <div className="space-y-1">
      {navGroups.map((group) => {
        const hasActive = group.items.some(i => location.pathname === i.href);
        return (
          <Collapsible key={group.label} defaultOpen={group.defaultOpen || hasActive}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors group">
              <span>{group.label}</span>
              <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-0.5">
              {group.items.map(item => renderNavLink(item, onClick))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );

  return <>
    {/* Command Palette */}
    <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

    {/* Mobile Header */}
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-xl border-b border-border/50 z-50 flex items-center justify-between px-4">
      {renderMobileLogo()}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setCommandOpen(true)}>
          <Search className="w-4 h-4" />
        </Button>
        <UserProfileDialog>
          <button className="p-1">
            <UserAvatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="sm" />
          </button>
        </UserProfileDialog>
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
        </Button>
      </div>
    </div>

    {/* Desktop Sidebar */}
    <nav className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-72 bg-card/80 backdrop-blur-xl border-r border-border/50 z-50 overflow-hidden">
      <div className="p-6 flex flex-col h-full min-h-0">
        <div className="mb-4 shrink-0">
          {renderLogo()}
        </div>

        {/* Quick Search */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-3 px-3 py-2 mb-4 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors text-sm shrink-0"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left text-xs">Buscar...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Grouped Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pr-1">
          {renderGroupedNav()}
        </div>
        
        {/* User Profile & Actions */}
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3 shrink-0">
          {renderUserProfile()}
          <div className="flex items-center justify-between px-3">
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Sidebar Overlay */}
    {isMobileOpen && (
      <div className="lg:hidden fixed inset-0 z-50">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsMobileOpen(false)} />
        <nav className="absolute left-0 top-0 h-full w-72 bg-card/90 backdrop-blur-xl border-r border-border/50 flex flex-col overflow-hidden animate-slide-in-left">
          <div className="p-6 flex flex-col h-full min-h-0">
            <div className="mb-4 shrink-0">{renderLogo()}</div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pr-1">
              {renderGroupedNav(() => setIsMobileOpen(false))}
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 space-y-3 shrink-0">
              {renderUserProfile()}
              <div className="flex items-center justify-between px-3">
                <AuthButton />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
      </div>
    )}

    {/* Mobile Bottom Navigation */}
    <MobileBottomNav />
  </>;
};

// Mobile Bottom Navigation Component
const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const bottomItems = [
    { href: "/", label: "Home", icon: LayoutGrid },
    { href: "/vendas", label: "Vendas", icon: Home },
    { href: "/negociacoes", label: "Negociações", icon: Handshake },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/metas", label: "Metas", icon: Target },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-t border-border/50 z-40 flex items-center justify-around px-2 safe-area-bottom">
      {bottomItems.map(item => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
