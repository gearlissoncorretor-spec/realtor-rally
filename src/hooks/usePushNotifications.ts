import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  enabled: boolean;
  pendingNegotiations: boolean;
  newSales: boolean;
  goalProgress: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: false,
  pendingNegotiations: true,
  newSales: true,
  goalProgress: true,
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      // Load saved settings
      const savedSettings = localStorage.getItem('notification_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Não suportado',
        description: 'Notificações push não são suportadas neste navegador.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setSettings(prev => ({ ...prev, enabled: true }));
        localStorage.setItem('notification_settings', JSON.stringify({ ...settings, enabled: true }));
        
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá alertas sobre negociações pendentes.',
        });
        return true;
      } else {
        toast({
          title: 'Permissão negada',
          description: 'Ative as notificações nas configurações do navegador.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, settings, toast]);

  const sendNotification = useCallback((title: string, body: string, data?: Record<string, unknown>) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'axis-notification',
        data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [isSupported, permission]);

  const checkPendingNegotiations = useCallback(async () => {
    if (!user || !settings.pendingNegotiations || permission !== 'granted') return;

    try {
      // Get negotiations that are pending for more than 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: pendingNegotiations, error } = await supabase
        .from('negotiations')
        .select('id, client_name, updated_at')
        .in('status', ['em_contato', 'em_aprovacao', 'em_analise'])
        .lt('updated_at', twoDaysAgo.toISOString())
        .limit(5);

      if (error) throw error;

      if (pendingNegotiations && pendingNegotiations.length > 0) {
        const count = pendingNegotiations.length;
        sendNotification(
          `${count} negociação${count > 1 ? 'ões' : ''} pendente${count > 1 ? 's' : ''}`,
          `Você tem ${count} negociação${count > 1 ? 'ões' : ''} sem atualização há mais de 2 dias.`,
          { type: 'pending_negotiations', count }
        );
      }
    } catch (error) {
      console.error('Error checking pending negotiations:', error);
    }
  }, [user, settings.pendingNegotiations, permission, sendNotification]);

  // Setup periodic check for pending negotiations
  useEffect(() => {
    if (permission === 'granted' && settings.enabled && settings.pendingNegotiations) {
      // Check immediately on load
      checkPendingNegotiations();

      // Then check every 30 minutes
      checkInterval.current = setInterval(checkPendingNegotiations, 30 * 60 * 1000);
    }

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [permission, settings.enabled, settings.pendingNegotiations, checkPendingNegotiations]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('notification_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    isSupported,
    permission,
    settings,
    requestPermission,
    sendNotification,
    updateSettings,
    checkPendingNegotiations,
  };
};
