import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Image, Building2 } from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

const BrandingSettings = () => {
  const { settings, updateSettings, isUpdating } = useOrganizationSettings();
  
  const [formData, setFormData] = useState({
    organization_name: 'Gestão Senador Canedo',
    organization_tagline: 'Sistema Premium de Gestão Imobiliária',
    logo_url: '',
    logo_icon_url: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        organization_name: settings.organization_name || 'Gestão Senador Canedo',
        organization_tagline: settings.organization_tagline || 'Sistema Premium de Gestão Imobiliária',
        logo_url: settings.logo_url || '',
        logo_icon_url: settings.logo_icon_url || '',
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      organization_name: formData.organization_name,
      organization_tagline: formData.organization_tagline,
      logo_url: formData.logo_url || null,
      logo_icon_url: formData.logo_icon_url || null,
    });
  };

  return (
    <Card className="p-6 animate-fade-in">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Identidade Visual</CardTitle>
            <CardDescription>
              Personalize o nome e logo da sua agência
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {/* Nome da Organização */}
        <div className="space-y-2">
          <Label htmlFor="org-name" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Nome da Agência/Sistema
          </Label>
          <Input
            id="org-name"
            value={formData.organization_name}
            onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
            placeholder="Gestão Senador Canedo"
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground">
            Este nome será exibido no topo, menu lateral e na tela de login
          </p>
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="org-tagline">Subtítulo/Slogan</Label>
          <Input
            id="org-tagline"
            value={formData.organization_tagline || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, organization_tagline: e.target.value }))}
            placeholder="Sistema Premium de Gestão Imobiliária"
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground">
            Texto descritivo exibido abaixo do nome principal
          </p>
        </div>

        {/* Logo Principal URL */}
        <div className="space-y-2">
          <Label htmlFor="logo-url" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            URL da Logo Principal (opcional)
          </Label>
          <Input
            id="logo-url"
            value={formData.logo_url}
            onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
            placeholder="https://exemplo.com/logo.png"
            className="max-w-md"
          />
          {formData.logo_url && (
            <div className="mt-2 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <img 
                src={formData.logo_url} 
                alt="Preview da logo" 
                className="max-h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Logo exibida na tela de login e no topo do sistema (recomendado: 200x60px)
          </p>
        </div>

        {/* Ícone/Logo Compacto URL */}
        <div className="space-y-2">
          <Label htmlFor="icon-url" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            URL do Ícone (opcional)
          </Label>
          <Input
            id="icon-url"
            value={formData.logo_icon_url}
            onChange={(e) => setFormData(prev => ({ ...prev, logo_icon_url: e.target.value }))}
            placeholder="https://exemplo.com/icone.png"
            className="max-w-md"
          />
          {formData.logo_icon_url && (
            <div className="mt-2 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <img 
                src={formData.logo_icon_url} 
                alt="Preview do ícone" 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Ícone quadrado exibido no menu lateral (recomendado: 48x48px)
          </p>
        </div>

        {/* Botão Salvar */}
        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="gap-2"
          >
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandingSettings;
