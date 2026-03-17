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
  Search,
  LogOut,
  RefreshCw
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

const Navigation = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { hasAccess, isAdmin, getUserRole, profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = useOrganizationSettings();
  const { displayName, subtitle } = useContextualIdentity();
  const [commandOpen, setCommandOpen] = useState(false);
  const pendingCount = usePendingUsersCount();

  const allNavItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutGrid, screen: "dashboard" },
    { href: "/central-gestor", label: "Central do Gestor", icon: TrendingUp, screen: "central-gestor" },
    { href: "/dashboard-equipes", label: "Dashboard Equipes", icon: Building2, screen: "dashboard-equipes" },
    { href: "/ranking", label: "Ranking", icon: Trophy, screen: "ranking" },
    { href: "/vendas", label: "Vendas", icon: Home, screen: "vendas" },
    { href: "/negociacoes", label: "Negociações", icon: Handshake, screen: "negociacoes" },
    { href: "/follow-up", label: "Follow-up / Clientes", icon: Users, screen: "follow-up" },
    { href: "/metas", label: "Metas", icon: Target, screen: "metas" },
    { href: "/meta-gestao", label: "Meta Gestão", icon: PieChart, screen: "meta-gestao" },
    { href: "/tarefas-kanban", label: "Tarefas & Atividades", icon: Columns3, screen: "tarefas-kanban" },
    { href: "/acompanhamento", label: "Status Vendas", icon: DollarSign, screen: "acompanhamento" },
    { href: "/comissoes", label: "Comissões", icon: DollarSign, screen: "comissoes" },
    { href: "/relatorios", label: "Relatórios", icon: TrendingUp, screen: "relatorios" },
    { href: "/corretores", label: "Corretores", icon: Users, screen: "corretores" },
    { href: "/equipes", label: "Equipes", icon: Users, screen: "equipes" },
    { href: "/x1", label: "X1", icon: Columns3, screen: "x1" },
    { href: "/agenda", label: "Agenda", icon: CalendarDays, screen: "agenda" },
    { href: "/gestao-usuarios", label: "Gestão de Usuários", icon: Users, screen: "gestao-usuarios" },
    { href: "/configuracoes", label: "Configurações", icon: Settings, screen: "configuracoes" },
    { href: "/instalar", label: "Instalar App", icon: Download, screen: "instalar" },
  ];

  const navItems = allNavItems.filter(item => {
    const userRole = getUserRole();
    if (isAdmin() || userRole === 'diretor') return true;
    if (item.screen === 'instalar') return true;
    return roleHasScreenAccess(userRole, item.screen) && hasAccess(item.screen);
  });

  const navGroups: NavGroup[] = [
    {
      label: "Principal",
      defaultOpen: true,
      items: navItems.filter(i => ['dashboard', 'central-gestor', 'dashboard-equipes', 'ranking', 'agenda'].includes(i.screen)),
    },
    {
      label: "Comercial",
      defaultOpen: true,
      items: navItems.filter(i => ['vendas', 'negociacoes', 'follow-up', 'acompanhamento'].includes(i.screen)),
    },
    {
      label: "Produtividade",
      items: navItems.filter(i => ['metas', 'meta-gestao', 'tarefas-kanban', 'x1'].includes(i.screen)),
    },
    {
      label: "Relatórios",
      items: navItems.filter(i => ['relatorios'].includes(i.screen)),
    },
    {
      label: "Gestão",
      items: navItems.filter(i => ['corretores', 'equipes', 'gestao-usuarios', 'comissoes'].includes(i.screen)),
    },
    {
      label: "Sistema",
      items: navItems.filter(i => ['configuracoes', 'instalar'].includes(i.screen)),
    },
  ].filter(g => g.items.length > 0);

  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;
  const userRole = getUserRole();
  const roleLabelMap: Record<string, string> = {
    admin: 'Admin',
    diretor: 'Diretor',
    gerente: 'Gerente',
    corretor: 'Corretor',
    super_admin: 'Super Admin',
  };

  const renderLogo = () => (
    <div className="flex items-center gap-3">
      {effectiveLogo ? (
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden ring-1 ring-border/30" title="Ir ao Dashboard">
          <img src={effectiveLogo} alt={displayName} className="w-full h-full object-contain" />
        </button>
      ) : (
        <button onClick={() => navigate('/')} className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg shadow-primary/20" title="Ir ao Dashboard">
          <span className="text-base font-bold text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-semibold text-foreground tracking-tight truncate leading-tight">{displayName}</h1>
        {subtitle && <p className="text-[11px] text-muted-foreground font-medium truncate leading-tight mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  const renderMobileLogo = () => (
    <div className="flex items-center gap-3">
      {effectiveLogo ? (
        <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden ring-1 ring-border/30" title="Ir ao Dashboard">
          <img src={effectiveLogo} alt={displayName} className="w-full h-full object-contain" />
        </button>
      ) : (
        <button onClick={() => navigate('/')} className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-md shadow-primary/20" title="Ir ao Dashboard">
          <span className="text-sm font-bold text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
        </button>
      )}
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-foreground tracking-tight truncate max-w-[120px] leading-tight">{displayName}</h1>
      </div>
    </div>
  );

  const renderUserProfile = () => (
    <UserProfileDialog>
      <button className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/60 transition-all duration-200 w-full group">
        <UserAvatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="md" />
        <div className="text-left min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate leading-tight">{profile?.full_name || 'Usuário'}</p>
          <p className="text-[11px] text-muted-foreground truncate leading-tight">{profile?.email}</p>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          {roleLabelMap[userRole] || userRole}
        </Badge>
      </button>
    </UserProfileDialog>
  );

  const renderNavLink = (item: NavItem, onClick?: () => void) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    const showBadge = item.screen === 'gestao-usuarios' && pendingCount > 0;
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
        )}
        <Icon className={cn(
          "w-[18px] h-[18px] shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
        )} />
        <span className="truncate">{item.label}</span>
        {showBadge && (
          <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center">
            {pendingCount}
          </Badge>
        )}
      </Link>
    );
  };

  const renderGroupedNav = (onClick?: () => void) => (
    <div className="space-y-3">
      {navGroups.map((group) => {
        const hasActive = group.items.some(i => location.pathname === i.href);
        return (
          <Collapsible key={group.label} defaultOpen={group.defaultOpen || hasActive}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors group">
              <span>{group.label}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground/40 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {group.items.map(item => renderNavLink(item, onClick))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );

  return <>
    <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

    {/* Mobile Header */}
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-xl border-b border-border/40 z-50 flex items-center justify-between px-4">
      {renderMobileLogo()}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0" onClick={() => setCommandOpen(true)}>
          <Search className="w-4 h-4" />
        </Button>
        <UserProfileDialog>
          <button className="p-1">
            <UserAvatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="sm" />
          </button>
        </UserProfileDialog>
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>
    </div>

    {/* Desktop Sidebar */}
    <nav className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-72 bg-card/95 backdrop-blur-xl border-r border-border/40 z-50 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.01] pointer-events-none" />
      
      <div className="relative p-5 flex flex-col h-full min-h-0">
        {/* Logo */}
        <div className="mb-5 shrink-0">
          {renderLogo()}
        </div>

        {/* Search */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 mb-5 rounded-lg bg-muted/40 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-border/50 transition-all duration-200 text-sm shrink-0 group"
        >
          <Search className="w-3.5 h-3.5 opacity-50 group-hover:opacity-80 transition-opacity" />
          <span className="flex-1 text-left text-xs">Buscar...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/40 bg-background/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60">
            ⌘K
          </kbd>
        </button>

        {/* Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-track-muted/20 pr-1 -mr-1">
          {renderGroupedNav()}
        </div>
        
        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border/30 space-y-2 shrink-0">
          {renderUserProfile()}
          <div className="flex items-center justify-between px-2">
            <AuthButton />
            <ThemeToggle />
          </div>
          {user && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                onClick={() => window.location.reload()}
                title="Atualizar sistema"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>

    {/* Mobile Sidebar Overlay */}
    {isMobileOpen && (
      <div className="lg:hidden fixed inset-0 z-50">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsMobileOpen(false)} />
        <nav className="absolute left-0 top-0 h-full w-72 bg-card/95 backdrop-blur-xl border-r border-border/40 flex flex-col overflow-hidden animate-slide-in-left">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.01] pointer-events-none" />
          <div className="relative p-5 flex flex-col h-full min-h-0">
            <div className="mb-5 shrink-0">{renderLogo()}</div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-track-muted/20 pr-1 -mr-1">
              {renderGroupedNav(() => setIsMobileOpen(false))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/30 space-y-2 shrink-0">
              {renderUserProfile()}
              <div className="flex items-center justify-between px-2">
                <AuthButton />
                <ThemeToggle />
              </div>
              {user && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                    onClick={() => window.location.reload()}
                    title="Atualizar sistema"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    )}

    {/* Mobile Bottom Navigation */}
    <MobileBottomNav />
  </>;
};

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getUserRole } = useAuth();
  const role = getUserRole();

  const corretorItems = [
    { href: "/", label: "Painel", icon: LayoutGrid },
    { href: "/negociacoes", label: "Negociações", icon: Handshake },
    { href: "/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/follow-up", label: "Follow-up / Clientes", icon: Users },
    { href: "/vendas", label: "Vendas", icon: Home },
  ];

  const defaultItems = [
    { href: "/", label: "Home", icon: LayoutGrid },
    { href: "/vendas", label: "Vendas", icon: Home },
    { href: "/negociacoes", label: "Negociações", icon: Handshake },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/metas", label: "Metas", icon: Target },
  ];

  const bottomItems = role === 'corretor' ? corretorItems : defaultItems;

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
    </div>
  );
};

export default Navigation;
