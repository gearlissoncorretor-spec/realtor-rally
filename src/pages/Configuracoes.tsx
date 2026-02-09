import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Settings, 
  Palette, 
  Bell,
  Shield,
  Database,
  User,
  CheckCircle,
  Monitor,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagementHub } from "@/components/UserManagementHub";
import TeamManager from "@/components/TeamManager";
import TeamMemberManager from "@/components/TeamMemberManager";
import BrandingSettings from "@/components/BrandingSettings";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import ScreenAccessManager from "@/components/ScreenAccessManager";

const Configuracoes = () => {
  const { toast } = useToast();
  const { isAdmin, isDiretor, isGerente } = useAuth();
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState({
    companyName: "Sua Imobiliária",
    notifications: true,
    darkMode: theme === 'dark',
    autoRefresh: true
  });

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    branding: false,
    preferences: false,
    notifications: false,
    teams: false,
    teamMembers: false,
    screenAccess: false,
    userManagement: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-3 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 animate-fade-in">
              Configurações
            </h1>
            <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Personalize o sistema conforme suas necessidades
            </p>
          </div>

          <div className="space-y-3">
            {/* Preferências do Usuário */}
            <CollapsibleSection
              title="Preferências do Usuário"
              icon={<User className="h-5 w-5 text-primary" />}
              description="Tema, notificações e atualizações"
              isOpen={openSections.preferences}
              onToggle={() => toggleSection('preferences')}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Tema</Label>
                    <p className="text-xs text-muted-foreground">
                      Alterne entre claro, escuro ou automático
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications" className="text-sm font-medium">Notificações por Email</Label>
                    <p className="text-xs text-muted-foreground">
                      Receber alertas sobre vendas e metas
                    </p>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={settings.notifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, notifications: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-refresh" className="text-sm font-medium">Atualização Automática</Label>
                    <p className="text-xs text-muted-foreground">
                      Atualizar dados a cada 30 segundos
                    </p>
                  </div>
                  <Switch 
                    id="auto-refresh" 
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoRefresh: checked }))
                    }
                  />
                </div>
                
                <Button onClick={handleSaveSettings} size="sm" className="w-full sm:w-auto">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvar Preferências
                </Button>
              </div>
            </CollapsibleSection>

            {/* Notificações Push */}
            <CollapsibleSection
              title="Notificações Push"
              icon={<Bell className="h-5 w-5 text-info" />}
              description="Alertas em tempo real no navegador"
              isOpen={openSections.notifications}
              onToggle={() => toggleSection('notifications')}
            >
              <NotificationCenter />
            </CollapsibleSection>

            {/* Configurações Gerais */}
            <CollapsibleSection
              title="Configurações Gerais"
              icon={<Settings className="h-5 w-5 text-primary" />}
              description="Nome da empresa, moeda e idioma"
              isOpen={openSections.general}
              onToggle={() => toggleSection('general')}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company-name" className="text-sm">Nome da Empresa</Label>
                    <Input id="company-name" placeholder="Sua Imobiliária" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="text-sm">Moeda</Label>
                    <Input id="currency" value="BRL (R$)" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone" className="text-sm">Fuso Horário</Label>
                    <Input id="timezone" value="America/Sao_Paulo" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="language" className="text-sm">Idioma</Label>
                    <Input id="language" value="Português (BR)" disabled />
                  </div>
                </div>
                <Button onClick={handleSaveSettings} size="sm">Salvar Alterações</Button>
              </div>
            </CollapsibleSection>

            {/* Branding Settings - Only visible to Admins */}
            {isAdmin() && (
              <CollapsibleSection
                title="Identidade Visual"
                icon={<Palette className="h-5 w-5 text-primary" />}
                description="Logo, nome e cores da marca"
                isOpen={openSections.branding}
                onToggle={() => toggleSection('branding')}
              >
                <BrandingSettings />
              </CollapsibleSection>
            )}

            {/* Team Management - Only for Directors */}
            {isDiretor() && (
              <CollapsibleSection
                title="Gestão de Equipes"
                icon={<Shield className="h-5 w-5 text-warning" />}
                description="Criar e gerenciar equipes"
                isOpen={openSections.teams}
                onToggle={() => toggleSection('teams')}
              >
                <TeamManager />
              </CollapsibleSection>
            )}

            {/* Team Member Management - For Directors and Managers */}
            {(isDiretor() || isGerente()) && (
              <CollapsibleSection
                title="Membros das Equipes"
                icon={<User className="h-5 w-5 text-info" />}
                description="Atribuir membros às equipes"
                isOpen={openSections.teamMembers}
                onToggle={() => toggleSection('teamMembers')}
              >
                <TeamMemberManager />
              </CollapsibleSection>
            )}

            {/* Screen Access Management - Only for Admins and Directors */}
            {(isAdmin() || isDiretor()) && (
              <CollapsibleSection
                title="Acesso às Telas"
                icon={<Monitor className="h-5 w-5 text-primary" />}
                description="Controle quais telas cada usuário pode acessar"
                isOpen={openSections.screenAccess}
                onToggle={() => toggleSection('screenAccess')}
              >
                <ScreenAccessManager />
              </CollapsibleSection>
            )}

            {/* User Management Hub - Only visible to Admins */}
            {isAdmin() && (
              <CollapsibleSection
                title="Gestão de Usuários"
                icon={<Database className="h-5 w-5 text-success" />}
                description="Criar, aprovar e gerenciar usuários"
                isOpen={openSections.userManagement}
                onToggle={() => toggleSection('userManagement')}
              >
                <UserManagementHub />
              </CollapsibleSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable collapsible section component
const CollapsibleSection = ({
  title,
  icon,
  description,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <Collapsible open={isOpen} onOpenChange={onToggle}>
    <Card className="overflow-hidden">
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-0">
          <Separator className="mb-4" />
          {children}
        </div>
      </CollapsibleContent>
    </Card>
  </Collapsible>
);

export default Configuracoes;