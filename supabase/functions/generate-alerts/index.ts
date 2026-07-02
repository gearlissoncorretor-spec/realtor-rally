import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Runs periodically (via pg_cron) to create in-app notifications for:
// - Leads without activity in the last 7 days (owner)
// - Negotiations pending update > 2 days (broker owner)
// Deduplicated by a synthetic key stored in metadata to avoid spam.

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const created: Record<string, number> = { leads_frios: 0, negociacoes_paradas: 0 };

    // ---- Leads frios (>7d sem update) ----
    const { data: coldLeads } = await supabase
      .from('leads')
      .select('id, name, user_id, company_id, updated_at')
      .not('user_id', 'is', null)
      .not('status', 'in', '("ganho","perdido","convertido")')
      .lt('updated_at', sevenDaysAgo)
      .limit(500);

    if (coldLeads?.length) {
      // Group per owner
      const byOwner = new Map<string, typeof coldLeads>();
      for (const l of coldLeads) {
        if (!l.user_id) continue;
        const arr = byOwner.get(l.user_id) ?? [];
        arr.push(l);
        byOwner.set(l.user_id, arr);
      }
      for (const [userId, list] of byOwner) {
        // Skip if we already notified this user today for this alert type
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'lead_frio')
          .gte('created_at', dayStart)
          .limit(1);
        if (existing?.length) continue;

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'lead_frio',
          title: `${list.length} lead${list.length > 1 ? 's' : ''} sem contato há +7 dias`,
          message: `Você tem ${list.length} lead${list.length > 1 ? 's' : ''} parado${list.length > 1 ? 's' : ''}. Retome o contato para não perder oportunidades.`,
          link: '/follow-up',
          read: false,
        });
        created.leads_frios += 1;
      }
    }

    // ---- Negociações paradas (>2d) ----
    const { data: stale } = await supabase
      .from('negotiations')
      .select('id, client_name, broker_id, updated_at, brokers!inner(user_id)')
      .in('status', ['em_contato', 'em_aprovacao', 'em_analise', 'em_andamento'])
      .lt('updated_at', twoDaysAgo)
      .limit(500);

    if (stale?.length) {
      const byUser = new Map<string, number>();
      for (const n of stale as any[]) {
        const uid = n.brokers?.user_id;
        if (!uid) continue;
        byUser.set(uid, (byUser.get(uid) ?? 0) + 1);
      }
      for (const [userId, count] of byUser) {
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'negociacao_parada')
          .gte('created_at', dayStart)
          .limit(1);
        if (existing?.length) continue;

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'negociacao_parada',
          title: `${count} negociação${count > 1 ? 'ões' : ''} sem atualização`,
          message: `Você tem ${count} negociação${count > 1 ? 'ões' : ''} parada${count > 1 ? 's' : ''} há mais de 2 dias.`,
          link: '/negociacoes',
          read: false,
        });
        created.negociacoes_paradas += 1;
      }
    }

    return new Response(JSON.stringify({ ok: true, created }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-alerts error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
