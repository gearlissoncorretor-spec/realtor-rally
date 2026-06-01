/**
 * Notification system overview
 * ----------------------------
 * - `NotificationBell` (this is the popover in the top nav) shows the user's
 *   latest in-app notifications stored in the `notifications` table.
 * - `NotificationCenter` is the full-page settings UI for configuring which
 *   notification *types* the user wants to receive (preferences), not a feed.
 *
 * Keep these distinct: Bell = feed, Center = preferences.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

const PAGE_SIZE = 50;

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pageCount, setPageCount] = useState(1);

  const query = useQuery({
    queryKey: ['notifications', user?.id, pageCount],
    queryFn: async () => {
      if (!user) return [] as AppNotification[];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE * pageCount);
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

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
    },
    // Optimistic — flip the flag instantly so the dot disappears with no flicker
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const previous = queryClient.getQueriesData<AppNotification[]>({ queryKey: ['notifications', user?.id] });
      previous.forEach(([key, list]) => {
        if (!list) return;
        queryClient.setQueryData(key, list.map((n) => (n.id === id ? { ...n, read: true } : n)));
      });
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      ctx?.previous?.forEach(([key, list]) => queryClient.setQueryData(key, list));
    },
    onSettled: invalidate,
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const previous = queryClient.getQueriesData<AppNotification[]>({ queryKey: ['notifications', user?.id] });
      previous.forEach(([key, list]) => {
        if (!list) return;
        queryClient.setQueryData(key, list.map((n) => ({ ...n, read: true })));
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      ctx?.previous?.forEach(([key, list]) => queryClient.setQueryData(key, list));
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const previous = queryClient.getQueriesData<AppNotification[]>({ queryKey: ['notifications', user?.id] });
      previous.forEach(([key, list]) => {
        if (!list) return;
        queryClient.setQueryData(key, list.filter((n) => n.id !== id));
      });
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      ctx?.previous?.forEach(([key, list]) => queryClient.setQueryData(key, list));
    },
    onSettled: invalidate,
  });

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasMore = notifications.length >= PAGE_SIZE * pageCount;
  const loadMore = () => setPageCount((p) => p + 1);

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasMore,
    loadMore,
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

  await supabase.from('notifications').insert([{
    user_id: opts.userId,
    company_id: opts.companyId ?? null,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    link_to: opts.linkTo ?? null,
    severity: opts.severity ?? 'info',
    metadata: (opts.metadata ?? {}) as never,
  }]);
}
