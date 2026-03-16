import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export interface StickyNote {
  id: string;
  user_id: string;
  company_id: string | null;
  title: string;
  content: string;
  color: string;
  visibility_mode: string;
  is_minimized: boolean;
  is_pinned: boolean;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export type CreateStickyNote = {
  title: string;
  content: string;
  color: string;
  visibility_mode: 'global' | 'agenda';
};

export const useStickyNotes = (mode?: 'global' | 'agenda' | 'all') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['sticky-notes', mode],
    queryFn: async () => {
      let query = supabase
        .from('sticky_notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (mode && mode !== 'all') {
        query = query.eq('visibility_mode', mode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StickyNote[];
    },
    enabled: !!user,
  });

  const createNote = useMutation({
    mutationFn: async (note: CreateStickyNote) => {
      const { data, error } = await supabase
        .from('sticky_notes')
        .insert({
          ...note,
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes'] });
      toast({ title: 'Nota criada', description: 'Sua nota adesiva foi criada com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível criar a nota.', variant: 'destructive' });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StickyNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('sticky_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes'] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sticky_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes'] });
      toast({ title: 'Nota excluída' });
    },
  });

  return { notes, isLoading, createNote, updateNote, deleteNote };
};
