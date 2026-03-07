import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Play, Pause, Volume2, Music, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SETTING_KEY = 'tv_mode_sound_url';

export const useTVModeSound = () => {
  const { data: soundUrl, isLoading } = useQuery({
    queryKey: ['tv-mode-sound'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return (data?.value as string) || null;
    },
    staleTime: 10 * 60 * 1000,
  });

  return { soundUrl, isLoading };
};

export const TVModeSoundSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: currentUrl, isLoading } = useQuery({
    queryKey: ['tv-mode-sound'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const soundUrl = currentUrl?.value as string | null;

  const saveSoundUrl = async (url: string | null) => {
    if (currentUrl?.id) {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(url), updated_at: new Date().toISOString() })
        .eq('id', currentUrl.id);
      if (error) throw error;
    } else if (url) {
      const { error } = await supabase
        .from('system_settings')
        .insert({ key: SETTING_KEY, value: JSON.stringify(url), description: 'URL do som utilizado no Modo TV do Ranking' });
      if (error) throw error;
    }
    queryClient.invalidateQueries({ queryKey: ['tv-mode-sound'] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use MP3, MP4, WAV, OGG ou WebM.', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O arquivo deve ter no máximo 10MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `tv-sound-${Date.now()}.${ext}`;
      const filePath = `sounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      await saveSoundUrl(publicUrl);

      toast({ title: 'Som enviado!', description: 'O som do Modo TV foi atualizado.' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    try {
      await saveSoundUrl(null);
      if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
      toast({ title: 'Som removido', description: 'O som padrão será utilizado no Modo TV.' });
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

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Som do Modo TV</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Faça upload de um som (fanfarra, música) que será tocado durante a revelação do ranking no Modo TV. Formatos: MP3, MP4, WAV, OGG, WebM. Máx: 10MB.
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
            <Button size="icon" variant="ghost" onClick={handleRemove} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/20 text-center">
          <Volume2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum som personalizado</p>
          <p className="text-xs text-muted-foreground/70">O som padrão (procedural) será usado</p>
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/mp4"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          {uploading ? 'Enviando...' : soundUrl ? 'Trocar som' : 'Enviar som'}
        </Button>
      </div>
    </div>
  );
};
