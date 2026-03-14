import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationConfig {
  staleNegotiations: boolean;
  overdueFollowUps: boolean;
  goalDeadlines: boolean;
  newSales: boolean;
  brokerBirthdays: boolean;
  brokerInactivity: boolean;
  conversionDrop: boolean;
  metaAtRisk: boolean;
}

const STORAGE_KEY = 'axis_notification_config';
const LAST_CHECK_KEY = 'axis_last_notification_check';
const COOLDOWN_MS = 30 * 60 * 1000; // 30 min cooldown per alert type

const defaultConfig: NotificationConfig = {
  staleNegotiations: true,
  overdueFollowUps: true,
  goalDeadlines: true,
  newSales: true,
  brokerBirthdays: true,
  brokerInactivity: true,
  conversionDrop: true,
  metaAtRisk: true,
};

function isInCooldown(alertType: string): boolean {
  try {
    const data = JSON.parse(localStorage.getItem(LAST_CHECK_KEY) || '{}');
    const lastTime = data[alertType];
    if (!lastTime) return false;
    return Date.now() - lastTime < COOLDOWN_MS;
  } catch { return false; }
}

function setCooldown(alertType: string) {
  try {
    const data = JSON.parse(localStorage.getItem(LAST_CHECK_KEY) || '{}');
    data[alertType] = Date.now();
    localStorage.setItem(LAST_CHECK_KEY, JSON.stringify(data));
  } catch {}
}

export const useNotificationSystem = () => {
  const { user, profile, isDiretor, isGerente, isAdmin } = useAuth();
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
      try { setConfig({ ...defaultConfig, ...JSON.parse(saved) }); } catch {}
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
    if (!user || !config.staleNegotiations || isInCooldown('stale')) return;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const { data, error } = await supabase
      .from('negotiations')
      .select('id, client_name, negotiated_value')
      .in('status', ['em_contato', 'em_aprovacao', 'em_analise'])
      .lt('updated_at', twoDaysAgo.toISOString());
    if (!error && data && data.length > 0) {
      const totalValue = data.reduce((s, n) => s + Number(n.negotiated_value || 0), 0);
      sendNotification(
        `⚠️ ${data.length} negociação(ões) parada(s)`,
        `VGV em risco: R$ ${(totalValue / 1000).toFixed(0)}k. Clientes: ${data.slice(0, 2).map(d => d.client_name).join(', ')}`,
        'stale-negotiations'
      );
      toast.warning(`${data.length} negociação(ões) sem atualização há mais de 2 dias`);
      setCooldown('stale');
    }
  }, [user, config.staleNegotiations, sendNotification]);

  const checkOverdueFollowUps = useCallback(async () => {
    if (!user || !config.overdueFollowUps || isInCooldown('overdue')) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('follow_ups')
      .select('id, client_name, estimated_vgv')
      .lt('next_contact_date', today)
      .not('status', 'eq', 'convertido');
    if (!error && data && data.length > 0) {
      sendNotification(
        `📞 ${data.length} follow-up(s) vencido(s)`,
        `Clientes aguardando: ${data.slice(0, 3).map(d => d.client_name).join(', ')}`,
        'overdue-followups'
      );
      toast.warning(`${data.length} follow-up(s) com data de contato vencida`);
      setCooldown('overdue');
    }
  }, [user, config.overdueFollowUps, sendNotification]);

  const checkGoalDeadlines = useCallback(async () => {
    if (!user || !config.goalDeadlines || isInCooldown('goals')) return;
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
          `🎯 ${behind.length} meta(s) próxima(s) do prazo`,
          `Metas em risco: ${behind.slice(0, 2).map(g => g.title).join(', ')}`,
          'goal-deadlines'
        );
        toast.warning(`${behind.length} meta(s) vencem em breve e estão abaixo de 80%`);
        setCooldown('goals');
      }
    }
  }, [user, config.goalDeadlines, sendNotification]);

  const checkBrokerBirthdays = useCallback(async () => {
    if (!user || !config.brokerBirthdays || isInCooldown('birthdays')) return;
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const { data, error } = await supabase
      .from('brokers')
      .select('id, name, birthday')
      .not('birthday', 'is', null)
      .eq('status', 'ativo');

    if (!error && data) {
      const birthdayBrokers = data.filter((b: any) => {
        if (!b.birthday) return false;
        const parts = b.birthday.split('-');
        return parseInt(parts[1]) === todayMonth && parseInt(parts[2]) === todayDay;
      });

      if (birthdayBrokers.length > 0) {
        const names = birthdayBrokers.map((b: any) => b.name).join(', ');
        sendNotification(
          `🎂 Aniversário hoje!`,
          `Parabéns para: ${names}`,
          'broker-birthdays'
        );
        toast.info(`🎂 Aniversariante(s) de hoje: ${names}`);
        setCooldown('birthdays');
      }
    }
  }, [user, config.brokerBirthdays, sendNotification]);

  const checkBrokerInactivity = useCallback(async () => {
    if (!user || !config.brokerInactivity || isInCooldown('inactivity')) return;
    if (!isDiretor?.() && !isGerente?.() && !isAdmin?.()) return;

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const { data: activeBrokers } = await supabase
      .from('brokers')
      .select('id, name')
      .eq('status', 'ativo');

    if (!activeBrokers || activeBrokers.length === 0) return;

    const { data: recentSales } = await supabase
      .from('sales')
      .select('broker_id')
      .gte('sale_date', fiveDaysAgo.toISOString().split('T')[0]);

    const activeSellers = new Set((recentSales || []).map(s => s.broker_id));
    const inactive = activeBrokers.filter(b => !activeSellers.has(b.id));

    if (inactive.length > 0) {
      sendNotification(
        `🔕 ${inactive.length} corretor(es) sem atividade`,
        `Sem vendas há 5+ dias: ${inactive.slice(0, 3).map(b => b.name).join(', ')}`,
        'broker-inactivity'
      );
      toast.warning(`${inactive.length} corretor(es) sem atividade há mais de 5 dias`);
      setCooldown('inactivity');
    }
  }, [user, config.brokerInactivity, sendNotification, isDiretor, isGerente, isAdmin]);

  const checkMetaAtRisk = useCallback(async () => {
    if (!user || !config.metaAtRisk || isInCooldown('meta-risk')) return;
    if (!isDiretor?.() && !isGerente?.() && !isAdmin?.()) return;

    const now = new Date();
    const dayOfMonth = now.getDate();
    if (dayOfMonth < 15) return; // Only check after mid-month

    const { data: currentTargets } = await supabase
      .from('targets')
      .select('target_value')
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear());

    if (!currentTargets || currentTargets.length === 0) return;

    const totalTarget = currentTargets.reduce((s, t) => s + Number(t.target_value || 0), 0);
    if (totalTarget === 0) return;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const { data: monthSales } = await supabase
      .from('sales')
      .select('vgv')
      .gte('sale_date', monthStart)
      .neq('status', 'distrato');

    const currentVGV = (monthSales || []).reduce((s, sale) => s + Number(sale.vgv || 0), 0);
    const percentAchieved = (currentVGV / totalTarget) * 100;
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const expectedPercent = (dayOfMonth / totalDays) * 100;

    if (percentAchieved < expectedPercent * 0.7) {
      sendNotification(
        `🚨 Meta mensal em risco!`,
        `Apenas ${percentAchieved.toFixed(0)}% atingido (esperado: ${expectedPercent.toFixed(0)}%). Ação urgente necessária.`,
        'meta-at-risk'
      );
      toast.error(`Meta mensal em risco: ${percentAchieved.toFixed(0)}% atingido`);
      setCooldown('meta-risk');
    }
  }, [user, config.metaAtRisk, sendNotification, isDiretor, isGerente, isAdmin]);

  const runAllChecks = useCallback(async () => {
    if (permission !== 'granted') return;
    await Promise.all([
      checkStaleNegotiations(),
      checkOverdueFollowUps(),
      checkGoalDeadlines(),
      checkBrokerBirthdays(),
      checkBrokerInactivity(),
      checkMetaAtRisk(),
    ]);
  }, [permission, checkStaleNegotiations, checkOverdueFollowUps, checkGoalDeadlines, checkBrokerBirthdays, checkBrokerInactivity, checkMetaAtRisk]);

  // Run checks on mount and every 15 minutes
  useEffect(() => {
    if (!user || permission !== 'granted') return;
    const timer = setTimeout(() => runAllChecks(), 5000);
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
