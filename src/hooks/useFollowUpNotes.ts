import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FollowUpNote {
  id: string;
  follow_up_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const useFollowUpNotes = (followUpId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['follow-up-notes', followUpId],
    queryFn: async () => {
      if (!followUpId) return [];
      const { data, error } = await supabase
        .from('follow_up_notes')
        .select('*')
        .eq('follow_up_id', followUpId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const creatorIds = [...new Set((data || []).map(n => n.created_by).filter(Boolean))];
      let profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);
        profiles?.forEach(p => { profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
      }

      return (data || []).map(n => ({
        ...n,
        profiles: n.created_by ? profilesMap[n.created_by] : undefined,
      })) as FollowUpNote[];
    },
    enabled: !!followUpId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ followUpId, note }: { followUpId: string; note: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('follow_up_notes')
        .insert({
          follow_up_id: followUpId,
          note,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-notes', variables.followUpId] });
      toast({ title: 'Nota adicionada', description: 'A nota foi registrada com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível adicionar a nota.', variant: 'destructive' });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('follow_up_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-notes', followUpId] });
      toast({ title: 'Nota excluída' });
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
