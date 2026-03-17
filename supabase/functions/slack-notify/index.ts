import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/slack/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'LOVABLE_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SLACK_API_KEY = Deno.env.get('SLACK_API_KEY');
  if (!SLACK_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'SLACK_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { event_type, data, channel } = await req.json();

    let message = '';
    let emoji = '';

    switch (event_type) {
      case 'nova_venda': {
        emoji = '🎉';
        const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.property_value || 0);
        const vgv = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.vgv || 0);
        message = [
          `${emoji} *Nova Venda Registrada!*`,
          ``,
          `👤 *Corretor:* ${data.broker_name || 'N/A'}`,
          `🏠 *Cliente:* ${data.client_name || 'N/A'}`,
          `📍 *Endereço:* ${data.property_address || 'N/A'}`,
          `🏷️ *Tipo:* ${data.property_type || 'N/A'}`,
          `💰 *Valor:* ${value}`,
          `📊 *VGV:* ${vgv}`,
          data.sale_date ? `📅 *Data:* ${data.sale_date}` : '',
        ].filter(Boolean).join('\n');
        break;
      }
      case 'meta_atingida': {
        emoji = '🏆';
        message = [
          `${emoji} *Meta Atingida!*`,
          ``,
          `📋 *Meta:* ${data.title || 'N/A'}`,
          `👤 *Responsável:* ${data.assigned_name || 'Equipe'}`,
          `🎯 *Valor Alcançado:* ${data.current_value || 0} / ${data.target_value || 0}`,
          ``,
          `Parabéns pela conquista! 🎊`,
        ].join('\n');
        break;
      }
      case 'negociacao_parada': {
        emoji = '⚠️';
        message = [
          `${emoji} *Alerta: Negociações Paradas*`,
          ``,
          `Existem *${data.count || 0}* negociações sem movimentação há mais de 7 dias.`,
          data.total_value ? `💰 *Valor total em risco:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total_value)}` : '',
          ``,
          `Acesse o sistema para verificar.`,
        ].filter(Boolean).join('\n');
        break;
      }
      case 'followup_atrasado': {
        emoji = '📋';
        message = [
          `${emoji} *Follow-ups Atrasados*`,
          ``,
          `Existem *${data.count || 0}* follow-ups com contato atrasado.`,
          ``,
          `Acesse o sistema para atualizar.`,
        ].join('\n');
        break;
      }
      default: {
        message = data.message || 'Notificação do Gestão Master';
      }
    }

    // Find channel by name if not an ID
    let channelId = channel || 'general';
    
    if (!channelId.startsWith('C') && !channelId.startsWith('G')) {
      // Look up channel by name
      const listRes = await fetch(`${GATEWAY_URL}/conversations.list?types=public_channel&limit=200`, {
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': SLACK_API_KEY,
        },
      });
      const listData = await listRes.json();
      
      if (listData.ok && listData.channels) {
        const found = listData.channels.find((c: any) => c.name === channelId.replace('#', ''));
        if (found) {
          channelId = found.id;
        }
      }
    }

    const response = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': SLACK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        text: message,
        username: 'Gestão Axis',
        icon_emoji: ':chart_with_upwards_trend:',
      }),
    });

    const result = await response.json();
    
    if (!response.ok || !result.ok) {
      throw new Error(`Slack API error [${response.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, ts: result.ts }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending Slack notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
