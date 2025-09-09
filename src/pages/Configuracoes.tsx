import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Palette, 
  Bell,
  Shield,
  Database,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Configuracoes = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    companyName: "Sua Imobiliária",
    notifications: true,
    darkMode: true,
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

          {/* Preferências */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Preferências</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">Receber alertas sobre vendas e metas</p>
                </div>
                <Switch id="notifications" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Modo Escuro</Label>
                  <p className="text-sm text-muted-foreground">Usar tema escuro por padrão</p>
                </div>
                <Switch id="dark-mode" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-refresh">Atualização Automática</Label>
                  <p className="text-sm text-muted-foreground">Atualizar dados automaticamente</p>
                </div>
                <Switch id="auto-refresh" defaultChecked />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;