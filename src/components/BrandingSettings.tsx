import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, Image, Building2, Upload, Trash2, Link as LinkIcon, 
  LayoutDashboard, TrendingUp, Handshake, Eye 
} from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useToast } from '@/hooks/use-toast';

const BrandingSettings = () => {
  const { settings, updateSettings, isUpdating, uploadLogo } = useOrganizationSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    organization_name: 'Gestão Senador Canedo',
    organization_tagline: 'Sistema Premium de Gestão Imobiliária',
    logo_url: '',
    logo_icon_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        organization_name: settings.organization_name || 'Gestão Senador Canedo',
        organization_tagline: settings.organization_tagline || 'Sistema Premium de Gestão Imobiliária',
        logo_url: settings.logo_url || '',
        logo_icon_url: settings.logo_icon_url || '',
        primary_color: settings.primary_color || '#3b82f6',
        secondary_color: (settings as any).secondary_color || '#10b981',
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      organization_name: formData.organization_name,
      organization_tagline: formData.organization_tagline,
      logo_url: formData.logo_url || null,
      logo_icon_url: formData.logo_icon_url || null,
      primary_color: formData.primary_color,
    } as any);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use PNG, JPG ou SVG.', variant: 'destructive' });
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo grande demais', description: 'Máximo 2MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadLogo(file, 'icon');
      setFormData(prev => ({ ...prev, logo_icon_url: url }));
      toast({ title: 'Logo enviada', description: 'Salve para aplicar no sistema.' });
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_icon_url: '', logo_url: '' }));
  };

  // Determine which logo to show in preview
  const effectiveLogo = formData.logo_icon_url || formData.logo_url || null;
  const initial = formData.organization_name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Nome e Slogan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="org-name" className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="w-4 h-4 text-primary" />
            Nome da Empresa
          </Label>
          <Input
            id="org-name"
            value={formData.organization_name}
            onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
            placeholder="Gestão Senador Canedo"
          />
          <p className="text-xs text-muted-foreground">
            Exibido na sidebar, login e título da aba
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-tagline" className="text-sm font-medium">Slogan</Label>
          <Input
            id="org-tagline"
            value={formData.organization_tagline || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, organization_tagline: e.target.value }))}
            placeholder="Sistema Premium de Gestão Imobiliária"
          />
          <p className="text-xs text-muted-foreground">
            Texto exibido abaixo do nome na tela de login
          </p>
        </div>
      </div>

      <Separator />

      {/* Logo Upload */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Image className="w-4 h-4 text-primary" />
          Logo da Empresa
        </Label>

        {/* Current Logo Preview */}
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground mb-2">Logo Atual</p>
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
              {effectiveLogo ? (
                <img src={effectiveLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">{initial}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {/* Upload Button */}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Enviando...' : 'Enviar Logo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG ou SVG • Máx. 2MB • Recomendado: 200x60px
              </p>
            </div>

            {/* Remove Button */}
            {effectiveLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleRemoveLogo}
              >
                <Trash2 className="w-4 h-4" />
                Remover Logo
              </Button>
            )}
          </div>
        </div>

        {/* URL Alternative */}
        <div className="space-y-2">
          <Label htmlFor="logo-url" className="flex items-center gap-2 text-xs text-muted-foreground">
            <LinkIcon className="w-3 h-3" />
            Ou insira uma URL da logo (alternativo)
          </Label>
          <Input
            id="logo-url"
            value={formData.logo_url}
            onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
            placeholder="https://exemplo.com/logo.png"
            className="text-sm"
          />
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="w-4 h-4 text-primary" />
          Cores da Marca
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color" className="text-xs">Cor Primária</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primary-color"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="flex-1 text-sm font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-color" className="text-xs">Cor Secundária</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="secondary-color"
                value={formData.secondary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <Input
                value={formData.secondary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="flex-1 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* System Preview */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Eye className="w-4 h-4 text-primary" />
          Preview do Sistema
        </Label>
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="flex">
            {/* Mini Sidebar Preview */}
            <div className="w-52 bg-card border-r border-border p-4 space-y-4">
              {/* Logo Area */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ backgroundColor: effectiveLogo ? 'transparent' : formData.primary_color }}>
                  {effectiveLogo ? (
                    <img src={effectiveLogo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-sm font-bold text-white">{initial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {formData.organization_name || 'Sua Empresa'}
                  </p>
                </div>
              </div>

              {/* Nav Items Preview */}
              <div className="space-y-1">
                {[
                  { icon: LayoutDashboard, label: 'Dashboard', active: true },
                  { icon: TrendingUp, label: 'Vendas', active: false },
                  { icon: Handshake, label: 'Negociações', active: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${
                    item.active 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground'
                  }`}>
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area Preview */}
            <div className="flex-1 p-4 bg-background">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: formData.primary_color }} />
                <p className="text-xs font-semibold text-foreground">
                  {formData.organization_name} | Dashboard
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 rounded-lg bg-muted/50 border border-border/50" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <Button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="gap-2"
        >
          {isUpdating ? 'Salvando...' : 'Salvar Identidade Visual'}
        </Button>
      </div>
    </div>
  );
};

export default BrandingSettings;
