import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Palette, 
  Bell,
  Shield,
  Database,
  Globe,
  User,
  Users,
  CheckCircle,
  Monitor
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagementHub } from "@/components/UserManagementHub";
import TeamManager from "@/components/TeamManager";
import TeamMemberManager from "@/components/TeamMemberManager";
import BrandingSettings from "@/components/BrandingSettings";
import { NotificationSettings } from "@/components/NotificationSettings";
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

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  const handleConfigureSection = (sectionTitle: string) => {
    toast({
      title: `Configurar ${sectionTitle}`,
      description: `Abrindo configurações de ${sectionTitle.toLowerCase()}.`,
    });
  };

  const configSections = [
    {
      title: "Aparência",
      description: "Personalize cores e tema do sistema",
      icon: <Palette className="w-6 h-6 text-primary" />,
      color: "bg-primary/10"
    },
    {
      title: "Notificações",
      description: "Configure alertas e lembretes",
      icon: <Bell className="w-6 h-6 text-info" />,
      color: "bg-info/10"
    },
    {
      title: "Segurança",
      description: "Gerencie permissões e acessos",
      icon: <Shield className="w-6 h-6 text-warning" />,
      color: "bg-warning/10"
    },
    {
      title: "Dados",
      description: "Backup e importação de dados",
      icon: <Database className="w-6 h-6 text-success" />,
      color: "bg-success/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
            Configurações
          </h1>
          <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Personalize o sistema conforme suas necessidades
          </p>
        </div>

        <div className="grid gap-8">
          {/* Branding Settings - Only visible to Admins */}
          {isAdmin() && (
            <div className="mb-8">
              <BrandingSettings />
            </div>
          )}

          {/* Configurações Gerais */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Configurações Gerais</h2>
                <p className="text-muted-foreground">Ajustes básicos do sistema</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input id="company-name" placeholder="Sua Imobiliária" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Input id="currency" value="BRL (R$)" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Input id="timezone" value="America/Sao_Paulo" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Input id="language" value="Português (BR)" disabled />
              </div>
            </div>
            
            <div className="mt-6">
              <Button onClick={handleSaveSettings}>Salvar Alterações</Button>
            </div>
          </Card>

          {/* Seções de Configuração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configSections.map((section, index) => (
              <Card key={section.title} className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
                <div className={`w-16 h-16 ${section.color} rounded-lg flex items-center justify-center mb-4`}>
                  {section.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{section.title}</h3>
                <p className="text-muted-foreground mb-4">{section.description}</p>
                <Button variant="outline" size="sm" onClick={() => handleConfigureSection(section.title)}>
                  Configurar
                </Button>
              </Card>
            ))}
          </div>

          {/* Notificações Push */}
          <NotificationSettings />
          {/* Team Management - Only for Directors */}
          {isDiretor() && (
            <div className="mb-8">
              <TeamManager />
            </div>
          )}

          {/* Team Member Management - For Directors and Managers */}
          {(isDiretor() || isGerente()) && (
            <div className="mb-8">
              <TeamMemberManager />
            </div>
          )}

          {/* Screen Access Management - Only for Admins and Directors */}
          {(isAdmin() || isDiretor()) && (
            <div className="mb-8">
              <ScreenAccessManager />
            </div>
          )}

          {/* User Management Hub - Only visible to Admins */}
          {isAdmin() && (
            <div className="mb-8">
              <UserManagementHub />
            </div>
          )}

          {/* Preferências do Usuário */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Preferências do Usuário
              </CardTitle>
              <CardDescription>
                Configure suas preferências pessoais do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Tema</Label>
                  <p className="text-sm text-muted-foreground">
                    Alterne entre tema claro, escuro ou automático
                  </p>
                </div>
                <ThemeToggle />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications" className="text-base font-medium">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
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
                  <Label htmlFor="auto-refresh" className="text-base font-medium">Atualização Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualizar dados automaticamente a cada 30 segundos
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
              
              <div className="pt-4">
                <Button onClick={handleSaveSettings} className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;