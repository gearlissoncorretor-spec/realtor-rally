import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BrokerNote {
  id: string;
  broker_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useBrokerNotes = (brokerId: string) => {
  const [notes, setNotes] = useState<BrokerNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('broker_notes')
        .select('*')
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Erro ao carregar anotações',
        description: 'Não foi possível carregar as anotações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (note: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('broker_notes')
        .insert({
          broker_id: brokerId,
          note,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setNotes(prev => [data, ...prev]);
      toast({
        title: 'Anotação criada',
        description: 'Anotação adicionada com sucesso.',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Erro ao criar anotação',
        description: 'Não foi possível criar a anotação.',
        variant: 'destructive',
      });
    }
  };

  const updateNote = async (noteId: string, note: string) => {
    try {
      const { data, error } = await supabase
        .from('broker_notes')
        .update({ note })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      
      setNotes(prev => prev.map(n => n.id === noteId ? data : n));
      toast({
        title: 'Anotação atualizada',
        description: 'Anotação atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Erro ao atualizar anotação',
        description: 'Não foi possível atualizar a anotação.',
        variant: 'destructive',
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('broker_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast({
        title: 'Anotação excluída',
        description: 'Anotação removida com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Erro ao excluir anotação',
        description: 'Não foi possível excluir a anotação.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [brokerId]);

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes: fetchNotes,
  };
};
