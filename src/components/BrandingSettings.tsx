import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, Image, Building2, Upload, Trash2, Link as LinkIcon, 
  LayoutDashboard, TrendingUp, Handshake, Eye, Music, Play, Pause, Volume2, Loader2
} from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TV_SOUND_KEY = 'tv_mode_sound_url';

const BrandingSettings = () => {
  const { settings, updateSettings, isUpdating, uploadLogo } = useOrganizationSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const soundFileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [soundUploading, setSoundUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [formData, setFormData] = useState({
    organization_name: 'Gestão Senador Canedo',
    organization_tagline: 'Sistema Premium de Gestão Imobiliária',
    logo_url: '',
    logo_icon_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
  });

  // TV Sound query
  const { data: soundData } = useQuery({
    queryKey: ['tv-mode-sound'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', TV_SOUND_KEY)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const soundUrl = soundData?.value as string | null;

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
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use PNG, JPG ou SVG.', variant: 'destructive' });
      return;
    }
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

  // === Sound functions ===
  const saveSoundUrl = async (url: string | null) => {
    if (soundData?.id) {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(url), updated_at: new Date().toISOString() })
        .eq('id', soundData.id);
      if (error) throw error;
    } else if (url) {
      const { error } = await supabase
        .from('system_settings')
        .insert({ key: TV_SOUND_KEY, value: JSON.stringify(url), description: 'URL do som utilizado no Modo TV do Ranking' });
      if (error) throw error;
    }
    queryClient.invalidateQueries({ queryKey: ['tv-mode-sound'] });
  };

  const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use MP3, MP4, WAV, OGG ou WebM.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 10MB.', variant: 'destructive' });
      return;
    }
    setSoundUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `tv-sound-${Date.now()}.${ext}`;
      const filePath = `sounds/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
      await saveSoundUrl(publicUrl);
      toast({ title: 'Som enviado!', description: 'O som do Modo TV foi atualizado.' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
    } finally {
      setSoundUploading(false);
      if (soundFileInputRef.current) soundFileInputRef.current.value = '';
    }
  };

  const handleRemoveSound = async () => {
    try {
      await saveSoundUrl(null);
      if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
      toast({ title: 'Som removido' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const togglePlayback = () => {
    if (!soundUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = soundUrl;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const effectiveLogo = formData.logo_icon_url || formData.logo_url || null;
  const initial = formData.organization_name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <div className="space-y-2 animate-fade-in">
      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="identity" className="text-xs gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Identidade
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="sound" className="text-xs gap-1.5">
            <Music className="w-3.5 h-3.5" />
            Som do Ranking
          </TabsTrigger>
        </TabsList>

        {/* === IDENTITY TAB === */}
        <TabsContent value="identity" className="space-y-5">
          {/* Name & Tagline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="w-4 h-4 text-primary" />
                Nome do Sistema
              </Label>
              <Input
                id="org-name"
                value={formData.organization_name}
                onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
                placeholder="Nome da Empresa"
              />
              <p className="text-xs text-muted-foreground">
                Exibido na tela de login, sidebar e título da aba
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-tagline" className="text-sm font-medium">Slogan / Subtítulo</Label>
              <Input
                id="org-tagline"
                value={formData.organization_tagline || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, organization_tagline: e.target.value }))}
                placeholder="Texto exibido na tela de login"
              />
              <p className="text-xs text-muted-foreground">
                Texto exibido abaixo do nome na tela de login
              </p>
            </div>
          </div>

          <Separator />

          {/* Logo */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Image className="w-4 h-4 text-primary" />
              Logo da Empresa
            </Label>
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <p className="text-xs text-muted-foreground mb-2">Atual</p>
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
                <div>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Enviando...' : 'Enviar Logo'}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleFileUpload} className="hidden" />
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG • Máx. 2MB</p>
                </div>
                {effectiveLogo && (
                  <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={handleRemoveLogo}>
                    <Trash2 className="w-4 h-4" /> Remover Logo
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-url" className="flex items-center gap-2 text-xs text-muted-foreground">
                <LinkIcon className="w-3 h-3" />
                Ou insira uma URL da logo
              </Label>
              <Input id="logo-url" value={formData.logo_url} onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))} placeholder="https://exemplo.com/logo.png" className="text-sm" />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
              {isUpdating ? 'Salvando...' : 'Salvar Identidade'}
            </Button>
          </div>
        </TabsContent>

        {/* === APPEARANCE TAB === */}
        <TabsContent value="appearance" className="space-y-5">
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
                  <input type="color" id="primary-color" value={formData.primary_color} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={formData.primary_color} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} className="flex-1 text-sm font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color" className="text-xs">Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <input type="color" id="secondary-color" value={formData.secondary_color} onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={formData.secondary_color} onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))} className="flex-1 text-sm font-mono" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="w-4 h-4 text-primary" />
              Preview do Sistema
            </Label>
            <div className="border border-border rounded-2xl overflow-hidden bg-card">
              <div className="flex">
                <div className="w-52 bg-card border-r border-border p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: effectiveLogo ? 'transparent' : formData.primary_color }}>
                      {effectiveLogo ? (
                        <img src={effectiveLogo} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-white">{initial}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{formData.organization_name || 'Sua Empresa'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {[
                      { icon: LayoutDashboard, label: 'Dashboard', active: true },
                      { icon: TrendingUp, label: 'Vendas', active: false },
                      { icon: Handshake, label: 'Negociações', active: false },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${item.active ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                        <item.icon className="w-3.5 h-3.5" /> {item.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-4 bg-background">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: formData.primary_color }} />
                    <p className="text-xs font-semibold text-foreground">{formData.organization_name} | Dashboard</p>
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

          <div className="pt-2">
            <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
              {isUpdating ? 'Salvando...' : 'Salvar Aparência'}
            </Button>
          </div>
        </TabsContent>

        {/* === SOUND TAB === */}
        <TabsContent value="sound" className="space-y-5">
          <div>
            <Label className="text-sm font-medium">Som do Modo TV (Ranking)</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Faça upload de um som (fanfarra, música) que será tocado durante a revelação do ranking no Modo TV.
              <br />Formatos: MP3, MP4, WAV, OGG, WebM • Máx: 10MB
            </p>
          </div>

          {soundUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Som personalizado</p>
                <p className="text-xs text-muted-foreground">Toque para ouvir</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="icon" variant="ghost" onClick={togglePlayback} className="h-8 w-8">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={handleRemoveSound} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/20 text-center">
              <Volume2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum som personalizado</p>
              <p className="text-xs text-muted-foreground/70">O som padrão será usado no Modo TV</p>
            </div>
          )}

          <div>
            <input ref={soundFileInputRef} type="file" accept="audio/*,video/mp4" onChange={handleSoundUpload} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => soundFileInputRef.current?.click()} disabled={soundUploading} className="w-full sm:w-auto">
              {soundUploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              {soundUploading ? 'Enviando...' : soundUrl ? 'Trocar som' : 'Enviar som'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandingSettings;
