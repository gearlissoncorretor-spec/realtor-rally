import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { teamId, companyId, managerName } = await req.json();

    // 1. Fetch data for analysis
    
    // Active negotiations with broker info
    const { data: negotiations } = await supabase
      .from('negotiations')
      .select('*, brokers(name)')
      .eq('company_id', companyId)
      .not('status', 'in', '("ganha", "perdida", "cancelada")');

    // Recent activities (last 10 days)
    const { data: activities } = await supabase
      .from('broker_activities')
      .select('*, brokers(name)')
      .eq('company_id', companyId)
      .gte('created_at', new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString());

    // Recent sales (last 30 days)
    const { data: sales } = await supabase
      .from('sales')
      .select('*, brokers(name)')
      .eq('company_id', companyId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Brokers list
    const { data: brokers } = await supabase
      .from('brokers')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'ativo');

    // 2. Prepare context for AI
    const context = {
      managerName,
      date: new Date().toLocaleDateString('pt-BR'),
      negotiations: negotiations?.map(n => ({
        client: n.client_name,
        broker: n.brokers?.name,
        value: n.negotiated_value,
        status: n.status,
        updatedAt: n.updated_at,
        temperature: n.temperature
      })),
      activitiesCount: activities?.length || 0,
      recentSales: sales?.length || 0,
      brokersInactivity: brokers?.map(b => {
        const brokerActivities = activities?.filter(a => a.broker_id === b.id) || [];
        return {
          name: b.name,
          lastActivity: brokerActivities.length > 0 ? brokerActivities[0].created_at : 'Nenhuma recente'
        };
      })
    };

    const prompt = `Você é o "Cérebro" de uma imobiliária de alto desempenho, atuando como um consultor estratégico para o gestor ${managerName}.
    Analise os dados abaixo e gere um relatório matinal conciso e acionável.

    DADOS DO SISTEMA:
    - Negociações Ativas: ${JSON.stringify(context.negotiations)}
    - Vendas nos últimos 30 dias: ${context.recentSales}
    - Atividades totais nos últimos 10 dias: ${context.activitiesCount}
    - Status de atividade por corretor: ${JSON.stringify(context.brokersInactivity)}

    SEU RELATÓRIO DEVE CONTER:
    1. 📉 Previsão de Perda (Churn): Identifique pelo menos 2 negociações que estão em risco (paradas há muito tempo ou com baixa temperatura) e explique o porquê usando os dados.
    2. 📊 Resumo de Performance: Destaque como o time está performando em relação ao volume de atividades.
    3. ⚠️ Alerta de Inatividade: Identifique corretores que não registram atividades há mais de 3 dias.
    4. 💡 3 Ações de Ouro: O que o gestor deve fazer HOJE para aumentar as vendas.

    Formate a resposta com Markdown, use emojis e seja direto. O tom deve ser profissional, motivador e baseado em dados.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    const data = await response.json();
    const insight = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível processar os dados no momento.';

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
