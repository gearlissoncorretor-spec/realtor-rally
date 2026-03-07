import { useState, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { useBrokers } from '@/hooks/useBrokers';
import { useBrokerNotes, BrokerNote } from '@/hooks/useBrokerNotes';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Pencil,
  Trash2,
  User,
  MessageSquare,
  Calendar,
  ImagePlus,
  Mic,
  X,
  Play,
  Pause,
  Loader2,
  FileAudio,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Group notes by date
const groupNotesByDate = (notes: BrokerNote[]) => {
  const groups: Record<string, BrokerNote[]> = {};
  notes.forEach(note => {
    const dateKey = format(new Date(note.created_at), 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(note);
  });
  // Sort dates descending
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
};

// Media upload helper
const uploadMedia = async (file: File, type: 'image' | 'audio'): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const fileName = `x1-${type}-${Date.now()}.${ext}`;
  const filePath = `x1/${fileName}`;

  const { error } = await supabase.storage.from('media').upload(filePath, file, { upsert: true });
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
  return publicUrl;
};

// Audio player component
const AudioPlayer = ({ src }: { src: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="gap-1.5 h-7 text-xs">
      {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      <FileAudio className="w-3 h-3" />
      Áudio
    </Button>
  );
};

// Note form for creating/editing
const NoteForm = ({
  initialNote = '',
  initialImageUrl = null as string | null,
  initialAudioUrl = null as string | null,
  onSave,
  onCancel,
}: {
  initialNote?: string;
  initialImageUrl?: string | null;
  initialAudioUrl?: string | null;
  onSave: (note: string, imageUrl: string | null, audioUrl: string | null) => Promise<void>;
  onCancel: () => void;
}) => {
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
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setUploadingImage(true);
    try {
      const url = await uploadMedia(file, 'image');
      setImageUrl(url);
    } catch {
      // toast handled in parent
    } finally {
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
    } catch {
      // toast handled in parent
    } finally {
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

      {/* Media previews */}
      <div className="flex flex-wrap gap-2">
        {imageUrl && (
          <div className="relative group">
            <img src={imageUrl} alt="Anexo" className="w-20 h-20 object-cover rounded-lg border" />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setImageUrl(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        {audioUrl && (
          <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 border">
            <AudioPlayer src={audioUrl} />
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setAudioUrl(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
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

// Broker notes section grouped by date
const BrokerX1Section = ({ brokerId }: { brokerId: string }) => {
  const { notes, loading, createNote, updateNote, deleteNote } = useBrokerNotes(brokerId);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const groupedNotes = groupNotesByDate(notes);

  const handleCreate = async (note: string, imageUrl: string | null, audioUrl: string | null) => {
    await createNote(note, imageUrl, audioUrl);
    setIsAddingNote(false);
  };

  const handleUpdate = async (noteId: string, note: string, imageUrl: string | null, audioUrl: string | null) => {
    await updateNote(noteId, note, imageUrl, audioUrl);
    setEditingNoteId(null);
  };

  const handleDelete = async () => {
    if (!deleteNoteId) return;
    await deleteNote(deleteNoteId);
    setDeleteNoteId(null);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Registros X1 ({notes.length})
          </span>
          {!isAddingNote && (
            <Button size="sm" variant="outline" onClick={() => setIsAddingNote(true)} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Novo Registro
            </Button>
          )}
        </div>

        {isAddingNote && (
          <NoteForm onSave={handleCreate} onCancel={() => setIsAddingNote(false)} />
        )}

        {groupedNotes.length > 0 ? (
          <Accordion type="multiple" className="space-y-1">
            {groupedNotes.map(([dateKey, dateNotes]) => (
              <AccordionItem key={dateKey} value={dateKey} className="border rounded-lg px-1 bg-card">
                <AccordionTrigger className="py-2.5 px-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {format(new Date(dateKey + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {dateNotes.length} {dateNotes.length === 1 ? 'registro' : 'registros'}
                    </Badge>
                    {dateNotes.some(n => n.image_url) && <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                    {dateNotes.some(n => n.audio_url) && <FileAudio className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="space-y-3">
                    {dateNotes.map(note => (
                      <div key={note.id} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                        {editingNoteId === note.id ? (
                          <NoteForm
                            initialNote={note.note}
                            initialImageUrl={note.image_url}
                            initialAudioUrl={note.audio_url}
                            onSave={(text, img, aud) => handleUpdate(note.id, text, img, aud)}
                            onCancel={() => setEditingNoteId(null)}
                          />
                        ) : (
                          <>
                            {note.note && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.note}</p>
                            )}

                            {/* Media display */}
                            <div className="flex flex-wrap gap-2">
                              {note.image_url && (
                                <img
                                  src={note.image_url}
                                  alt="Anexo"
                                  className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setPreviewImage(note.image_url)}
                                />
                              )}
                              {note.audio_url && <AudioPlayer src={note.audio_url} />}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/30">
                              <span>
                                {format(new Date(note.created_at), "HH:mm", { locale: ptBR })}
                              </span>
                              <div className="flex gap-0.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingNoteId(note.id)}
                                  className="h-6 w-6"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteNoteId(note.id)}
                                  className="h-6 w-6 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          !loading && !isAddingNote && (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum registro X1 ainda</p>
              <p className="text-xs mt-1">Clique em "Novo Registro" para começar</p>
            </div>
          )
        )}
      </div>

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Imagem</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function X1() {
  const { brokers, loading } = useBrokers();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8">
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">X1 - Acompanhamento Individual</h1>
          <p className="text-muted-foreground mt-1">
            Selecione um corretor para ver os registros de X1 organizados por data.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="divide-y">
              {(brokers || []).map(broker => (
                <AccordionItem key={broker.id} value={broker.id} className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={broker.avatar_url || undefined} alt={broker.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {getInitials(broker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{broker.name}</p>
                        <p className="text-xs text-muted-foreground">{broker.email}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <BrokerX1Section brokerId={broker.id} />
                  </AccordionContent>
                </AccordionItem>
              ))}

              {(!brokers || brokers.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum corretor encontrado</p>
                </div>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
