import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, Mic, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { X1AudioPlayer } from './X1AudioPlayer';

const uploadMedia = async (file: File, type: 'image' | 'audio'): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const fileName = `x1-${type}-${Date.now()}.${ext}`;
  const filePath = `x1/${fileName}`;
  const { error } = await supabase.storage.from('media').upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
  return publicUrl;
};

interface NoteFormProps {
  initialNote?: string;
  initialImageUrl?: string | null;
  initialAudioUrl?: string | null;
  onSave: (note: string, imageUrl: string | null, audioUrl: string | null) => Promise<void>;
  onCancel: () => void;
}

export const X1NoteForm = ({
  initialNote = '',
  initialImageUrl = null,
  initialAudioUrl = null,
  onSave,
  onCancel,
}: NoteFormProps) => {
  const [note, setNote] = useState(initialNote);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingImage(true);
    try {
      const url = await uploadMedia(file, 'image');
      setImageUrl(url);
    } catch { /* handled */ } finally {
      setUploadingImage(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const url = await uploadMedia(file, 'audio');
      setAudioUrl(url);
    } catch { /* handled */ } finally {
      setUploadingAudio(false);
    }
  };

  const handleSave = async () => {
    if (!note.trim() && !imageUrl && !audioUrl) return;
    setSaving(true);
    await onSave(note, imageUrl, audioUrl);
    setSaving(false);
  };

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Digite sua anotação do X1..."
        className="min-h-[80px] text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {imageUrl && (
          <div className="relative group">
            <img src={imageUrl} alt="Anexo" className="w-20 h-20 object-cover rounded-lg border" />
            <Button size="icon" variant="destructive" className="absolute -top-1.5 -right-1.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setImageUrl(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        {audioUrl && (
          <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 border">
            <X1AudioPlayer src={audioUrl} />
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setAudioUrl(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
          {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
          Imagem
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio}>
          {uploadingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
          Áudio
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-7">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Salvar
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7">
          Cancelar
        </Button>
      </div>
    </div>
  );
};
