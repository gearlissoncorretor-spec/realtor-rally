import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kwsnnwiwflsvsqiuzfja.supabase.co';

export const useWebPush = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const isSupported = typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator;

  // Fetch VAPID public key
  useEffect(() => {
    if (!isSupported) return;
    fetch(`${SUPABASE_URL}/functions/v1/push-notifications?action=vapid-public-key`, {
      headers: { 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        if (data.publicKey) setVapidPublicKey(data.publicKey);
      })
      .catch(err => console.error('Failed to fetch VAPID key:', err));
  }, [isSupported]);

  // Check current subscription status
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setIsSubscribed(!!sub);
      });
    });
  }, [isSupported]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = useCallback(async () => {
    if (!vapidPublicKey || !user || !isSupported) return false;
    setIsLoading(true);

    try {
      // First request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permissão de notificações negada');
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/push-notifications?action=subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      });

      if (!response.ok) throw new Error('Failed to save subscription');

      setIsSubscribed(true);
      toast.success('Notificações push ativadas! Você receberá alertas mesmo com o app fechado.');
      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      toast.error('Falha ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [vapidPublicKey, user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${SUPABASE_URL}/functions/v1/push-notifications?action=unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          });
        }
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      toast.error('Falha ao desativar notificações push');
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  const testPush = useCallback(async () => {
    if (!user || !isSubscribed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/push-notifications?action=test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        toast.success('Notificação de teste enviada!');
      } else {
        toast.error('Falha ao enviar teste');
      }
    } catch (error) {
      console.error('Test push failed:', error);
      toast.error('Falha ao enviar notificação de teste');
    }
  }, [user, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testPush,
  };
};
