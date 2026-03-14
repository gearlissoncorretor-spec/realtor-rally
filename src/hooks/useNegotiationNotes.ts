import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NegotiationNote {
  id: string;
  negotiation_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const useNegotiationNotes = (negotiationId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['negotiation-notes', negotiationId],
    queryFn: async () => {
      if (!negotiationId) return [];
      const { data, error } = await supabase
        .from('negotiation_notes')
        .select('*, profiles:created_by(full_name, avatar_url)')
        .eq('negotiation_id', negotiationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NegotiationNote[];
    },
    enabled: !!negotiationId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ negotiationId, note }: { negotiationId: string; note: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('negotiation_notes')
        .insert({
          negotiation_id: negotiationId,
          note,
          created_by: userData.user?.id,
        })
        .select('*, profiles:created_by(full_name, avatar_url)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negotiation-notes', variables.negotiationId] });
      toast({ title: 'Nota adicionada', description: 'A nota foi registrada com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível adicionar a nota.', variant: 'destructive' });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('negotiation_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiation-notes', negotiationId] });
      toast({ title: 'Nota excluída', description: 'A nota foi removida.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível excluir a nota.', variant: 'destructive' });
    },
  });

  return {
    notes,
    loading: isLoading,
    addNote: addNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
  };
};
