import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationConfig {
  staleNegotiations: boolean;
  overdueFollowUps: boolean;
  goalDeadlines: boolean;
  newSales: boolean;
}

const STORAGE_KEY = 'axis_notification_config';

const defaultConfig: NotificationConfig = {
  staleNegotiations: true,
  overdueFollowUps: true,
  goalDeadlines: true,
  newSales: true,
};

export const useNotificationSystem = () => {
  const { user, profile } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [config, setConfig] = useState<NotificationConfig>(defaultConfig);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setConfig(JSON.parse(saved)); } catch {}
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Notificações não suportadas neste navegador');
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success('Notificações ativadas!');
      return true;
    }
    toast.error('Permissão negada. Ative nas configurações do navegador.');
    return false;
  }, [isSupported]);

  const sendNotification = useCallback((title: string, body: string, tag?: string) => {
    if (permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: tag || 'axis-alert',
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch (e) {
      console.error('Notification error:', e);
    }
  }, [permission]);

  const checkStaleNegotiations = useCallback(async () => {
    if (!user || !config.staleNegotiations) return;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const { data, error } = await supabase
      .from('negotiations')
      .select('id')
      .in('status', ['em_contato', 'em_aprovacao', 'em_analise'])
      .lt('updated_at', twoDaysAgo.toISOString());
    if (!error && data && data.length > 0) {
      sendNotification(
        `${data.length} negociação(ões) parada(s)`,
        `Há negociações sem atualização há mais de 2 dias. Verifique agora!`,
        'stale-negotiations'
      );
      toast.warning(`${data.length} negociação(ões) sem atualização há mais de 2 dias`);
    }
  }, [user, config.staleNegotiations, sendNotification]);

  const checkOverdueFollowUps = useCallback(async () => {
    if (!user || !config.overdueFollowUps) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('follow_ups')
      .select('id, client_name')
      .lt('next_contact_date', today)
      .not('status', 'eq', 'convertido');
    if (!error && data && data.length > 0) {
      sendNotification(
        `${data.length} follow-up(s) vencido(s)`,
        `Clientes aguardando contato: ${data.slice(0, 3).map(d => d.client_name).join(', ')}`,
        'overdue-followups'
      );
      toast.warning(`${data.length} follow-up(s) com data de contato vencida`);
    }
  }, [user, config.overdueFollowUps, sendNotification]);

  const checkGoalDeadlines = useCallback(async () => {
    if (!user || !config.goalDeadlines) return;
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('goals')
      .select('id, title, target_value, current_value, end_date')
      .gte('end_date', today)
      .lte('end_date', threeDaysFromNow.toISOString().split('T')[0])
      .eq('status', 'em_andamento');
    if (!error && data && data.length > 0) {
      const behind = data.filter(g => g.current_value < g.target_value * 0.8);
      if (behind.length > 0) {
        sendNotification(
          `${behind.length} meta(s) próxima(s) do prazo`,
          `Metas que precisam de atenção: ${behind.slice(0, 2).map(g => g.title).join(', ')}`,
          'goal-deadlines'
        );
        toast.warning(`${behind.length} meta(s) vencem em breve e estão abaixo de 80%`);
      }
    }
  }, [user, config.goalDeadlines, sendNotification]);

  const runAllChecks = useCallback(async () => {
    if (permission !== 'granted') return;
    await Promise.all([
      checkStaleNegotiations(),
      checkOverdueFollowUps(),
      checkGoalDeadlines(),
    ]);
  }, [permission, checkStaleNegotiations, checkOverdueFollowUps, checkGoalDeadlines]);

  // Run checks on mount and every 15 minutes
  useEffect(() => {
    if (!user || permission !== 'granted') return;
    const timer = setTimeout(() => runAllChecks(), 5000); // 5s after login
    intervalRef.current = setInterval(runAllChecks, 15 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, permission, runAllChecks]);

  const updateConfig = useCallback((updates: Partial<NotificationConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    isSupported,
    permission,
    config,
    requestPermission,
    updateConfig,
    runAllChecks,
    sendNotification,
  };
};
