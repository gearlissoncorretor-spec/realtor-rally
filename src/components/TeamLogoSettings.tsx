import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Image, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TeamLogoSettings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const teamId = profile?.team_id;

  const { data: team, isLoading } = useQuery({
    queryKey: ['team-logo', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('id', teamId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;

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
      const ext = file.name.split('.').pop();
      const fileName = `team-logo-${teamId}-${Date.now()}.${ext}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: publicUrl } as any)
        .eq('id', teamId);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['team-logo', teamId] });
      toast({ title: 'Logo da equipe atualizada!', description: 'A logo foi salva com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!teamId) return;
    try {
      const { error } = await supabase
        .from('teams')
        .update({ logo_url: null } as any)
        .eq('id', teamId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['team-logo', teamId] });
      toast({ title: 'Logo removida' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  if (!teamId) {
    return (
      <div className="text-center py-6">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Você não está vinculado a nenhuma equipe.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="h-20 animate-pulse bg-muted rounded-lg" />;
  }

  const logoUrl = (team as any)?.logo_url;
  const teamName = team?.name || 'Equipe';
  const initial = teamName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Equipe: {teamName}</p>
        <p className="text-xs text-muted-foreground">
          Faça upload da logo da sua equipe. Ela será exibida na sidebar e no dashboard.
        </p>
      </div>

      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Atual</p>
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo da equipe" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{initial}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-3">
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
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG • Máx. 2MB</p>
          </div>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleRemoveLogo}
            >
              <Trash2 className="w-4 h-4" /> Remover Logo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamLogoSettings;
