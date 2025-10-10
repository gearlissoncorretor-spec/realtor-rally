import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, Trophy, Home, Settings, BarChart3, Users, Menu, X, Target, Columns3, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import AuthButton from "@/components/AuthButton";
const Navigation = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { hasAccess, isAdmin, getUserRole } = useAuth();
  
  const allNavItems = [{
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
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
    href: "/metas",
    label: "Metas",
    icon: Target,
    screen: "metas"
  }, {
    href: "/acompanhamento",
    label: "Acompanhamento",
    icon: BarChart3,
    screen: "acompanhamento"
  }, {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
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
      return ['dashboard', 'vendas', 'metas', 'corretores', 'equipes', 'ranking', 'acompanhamento', 'x1'].includes(item.screen);
    } else if (userRole === 'corretor') {
      return ['dashboard', 'vendas', 'metas'].includes(item.screen);
    }
    
    // Dashboard Equipes é apenas para diretores
    if (item.screen === 'dashboard-equipes' && userRole !== 'diretor') {
      return false;
    }
    
    // Admins also have access to everything
    if (isAdmin()) {
      return true;
    }
    
    return hasAccess(item.screen);
  });
  return <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">RealEstate</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(!isMobileOpen)}>
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-gradient-card border-r border-border z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Gestão MB SC</h1>
              <p className="text-sm text-muted-foreground">Dashboard</p>
            </div>
          </div>

          <div className="space-y-2">
            {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return <Link key={item.href} to={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>;
          })}
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-4">
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <nav className="absolute left-0 top-0 h-full w-64 bg-gradient-card border-r border-border">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">RealEstate</h1>
                  <p className="text-sm text-muted-foreground">Dashboard</p>
                </div>
              </div>

              <div className="space-y-2">
                {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return <Link key={item.href} to={item.href} onClick={() => setIsMobileOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>;
            })}
              </div>
            </div>
          </nav>
        </div>}
    </>;
};
export default Navigation;