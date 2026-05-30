import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  user_id: string;
  company_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link_to: string | null;
  severity: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [] as AppNotification[];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as AppNotification[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['notifications', user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    remove: remove.mutate,
  };
};

/** Helper to persist a notification (avoids duplicates by type within last 6h). */
export async function persistNotification(opts: {
  userId: string;
  companyId?: string | null;
  type: string;
  title: string;
  body?: string;
  linkTo?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, unknown>;
}) {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', opts.userId)
    .eq('type', opts.type)
    .gte('created_at', sixHoursAgo)
    .limit(1);
  if (existing && existing.length > 0) return;

  await supabase.from('notifications').insert({
    user_id: opts.userId,
    company_id: opts.companyId ?? null,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    link_to: opts.linkTo ?? null,
    severity: opts.severity ?? 'info',
    metadata: opts.metadata ?? {},
  });
}
