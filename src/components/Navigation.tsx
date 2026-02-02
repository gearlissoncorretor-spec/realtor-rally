import { Link, useLocation } from "react-router-dom";
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
  PieChart
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

const Navigation = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { hasAccess, isAdmin, getUserRole, signOut, profile } = useAuth();
  const { settings } = useOrganizationSettings();
  const { displayName, subtitle } = useContextualIdentity();
  
  const handleLogoClick = async () => {
    await signOut();
  };
  
  const allNavItems = [{
    href: "/",
    label: "Dashboard",
    icon: LayoutGrid,
    screen: "dashboard"
  }, {
    href: "/dashboard-equipes",
    label: "Dashboard Equipes",
    icon: Building2,
    screen: "dashboard-equipes"
  }, {
    href: "/ranking",
    label: "Ranking",
    icon: Trophy,
    screen: "ranking"
  }, {
    href: "/vendas",
    label: "Vendas",
    icon: Home,
    screen: "vendas"
  }, {
    href: "/negociacoes",
    label: "Negociações",
    icon: Handshake,
    screen: "negociacoes"
  }, {
    href: "/follow-up",
    label: "Follow Up",
    icon: Users,
    screen: "follow-up"
  }, {
    href: "/metas",
    label: "Metas",
    icon: Target,
    screen: "metas"
  }, {
    href: "/meta-gestao",
    label: "Meta Gestão",
    icon: PieChart,
    screen: "meta-gestao"
  }, {
    href: "/atividades",
    label: "Atividades",
    icon: ClipboardList,
    screen: "atividades"
  }, {
    href: "/tarefas-kanban",
    label: "Tarefas",
    icon: Columns3,
    screen: "tarefas-kanban"
  }, {
    href: "/acompanhamento",
    label: "Status Vendas",
    icon: DollarSign,
    screen: "acompanhamento"
  }, {
    href: "/relatorios",
    label: "Relatórios",
    icon: TrendingUp,
    screen: "relatorios"
  }, {
    href: "/corretores",
    label: "Corretores",
    icon: Users,
    screen: "corretores"
  }, {
    href: "/equipes",
    label: "Equipes",
    icon: Users,
    screen: "equipes"
  }, {
    href: "/x1",
    label: "X1",
    icon: Columns3,
    screen: "x1"
  }, {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    screen: "configuracoes"
  }];

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => {
    // Role-based access control
    const userRole = getUserRole();
    
    if (userRole === 'diretor') {
      return true; // Diretor has access to everything
    } else if (userRole === 'gerente') {
      return ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'meta-gestao', 'atividades', 'corretores', 'equipes', 'ranking', 'acompanhamento', 'tarefas-kanban', 'x1', 'configuracoes'].includes(item.screen);
    } else if (userRole === 'corretor') {
      return ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'tarefas-kanban', 'configuracoes'].includes(item.screen);
    }
    
    // Dashboard Equipes é para diretores e admins
    if (item.screen === 'dashboard-equipes' && userRole !== 'diretor' && !isAdmin()) {
      return false;
    }
    
    // Admins also have access to everything
    if (isAdmin()) {
      return true;
    }
    
    return hasAccess(item.screen);
  });

  // Render logo section
  const renderLogo = () => (
    <div className="flex items-center gap-4">
      {settings?.logo_icon_url ? (
        <button 
          onClick={handleLogoClick}
          className="w-11 h-11 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
          title="Sair do sistema"
        >
          <img src={settings.logo_icon_url} alt={displayName} className="w-full h-full object-contain" />
        </button>
      ) : (
        <button 
          onClick={handleLogoClick}
          className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg shadow-primary/25"
          title="Sair do sistema"
        >
          <span className="text-lg font-bold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
          {displayName}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  // Render mobile logo section (smaller)
  const renderMobileLogo = () => (
    <div className="flex items-center gap-3">
      {settings?.logo_icon_url ? (
        <button 
          onClick={handleLogoClick}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
          title="Sair do sistema"
        >
          <img src={settings.logo_icon_url} alt={displayName} className="w-full h-full object-contain" />
        </button>
      ) : (
        <button 
          onClick={handleLogoClick}
          className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg shadow-primary/25"
          title="Sair do sistema"
        >
          <span className="text-sm font-bold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </button>
      )}
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-foreground tracking-tight truncate max-w-[120px]">
          {displayName}
        </h1>
      </div>
    </div>
  );

  // Render user profile section
  const renderUserProfile = () => (
    <UserProfileDialog>
      <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors w-full">
        <UserAvatar 
          name={profile?.full_name} 
          avatarUrl={profile?.avatar_url} 
          size="md" 
        />
        <div className="text-left min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {profile?.full_name || 'Usuário'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {profile?.email}
          </p>
        </div>
      </button>
    </UserProfileDialog>
  );

  return <>
    {/* Mobile Header */}
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-lg border-b border-border z-50 flex items-center justify-between px-4">
      {renderMobileLogo()}
      <div className="flex items-center gap-2">
        <UserProfileDialog>
          <button className="p-1">
            <UserAvatar 
              name={profile?.full_name} 
              avatarUrl={profile?.avatar_url} 
              size="sm" 
            />
          </button>
        </UserProfileDialog>
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
    </div>

    {/* Desktop Sidebar */}
    <nav className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-72 bg-card/95 backdrop-blur-xl border-r border-border z-50">
      <div className="p-7 flex-1 flex flex-col">
        {/* Logo Section */}
        <div className="mb-8">
          {renderLogo()}
        </div>

        {/* Navigation Items */}
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link 
                key={item.href} 
                to={item.href} 
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_hsl(217_91%_60%/0.15)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                )}
              >
                <Icon className={cn("w-5 h-5 stroke-[1.5]", isActive && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </div>
        
        {/* User Profile & Actions */}
        <div className="mt-6 pt-6 border-t border-border space-y-4">
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
        <nav className="absolute left-0 top-0 h-full w-72 bg-card/95 backdrop-blur-xl border-r border-border flex flex-col">
          <div className="p-7 flex-1 flex flex-col">
            <div className="mb-8">
              {renderLogo()}
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    to={item.href} 
                    onClick={() => setIsMobileOpen(false)} 
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_hsl(217_91%_60%/0.15)]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 stroke-[1.5]", isActive && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User Profile & Actions */}
            <div className="mt-6 pt-6 border-t border-border space-y-4">
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
  </>;
};

export default Navigation;
