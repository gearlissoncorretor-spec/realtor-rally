import { supabase } from '@/integrations/supabase/client';

type SlackEventType = 'nova_venda' | 'meta_atingida' | 'negociacao_parada' | 'followup_atrasado' | 'custom';

interface SlackNotifyOptions {
  event_type: SlackEventType;
  data: Record<string, any>;
  channel?: string;
}

export const sendSlackNotification = async ({ event_type, data, channel }: SlackNotifyOptions) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('slack-notify', {
      body: { event_type, data, channel },
    });

    if (error) {
      console.error('Slack notification error:', error);
      return { success: false, error };
    }

    return { success: true, data: result };
  } catch (err) {
    console.error('Failed to send Slack notification:', err);
    return { success: false, error: err };
  }
};

export const useSlackNotify = () => {
  return { sendSlackNotification };
};
