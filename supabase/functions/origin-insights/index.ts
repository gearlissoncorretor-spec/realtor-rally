import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      return new Response(
        JSON.stringify({ insight: 'API key da IA não configurada. Configure GEMINI_API_KEY nas secrets do projeto.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { origins, totals } = await req.json();

    const prompt = `Você é um consultor de vendas imobiliárias expert. Analise os dados de origem dos clientes abaixo e gere insights estratégicos em português brasileiro.

DADOS DAS ORIGENS:
${origins.map((o: any) => `- ${o.name}: ${o.leads} leads, ${o.vendas} vendas, ${o.conversao}% conversão, R$ ${(o.valorTotal / 1000).toFixed(0)}K valor total, Ticket médio: R$ ${(o.ticketMedio / 1000).toFixed(0)}K`).join('\n')}

TOTAIS:
- Total de leads: ${totals.totalLeads}
- Total de vendas: ${totals.totalVendas}
- Conversão geral: ${Math.round(totals.conversaoGeral)}%
- Ticket médio geral: R$ ${(totals.ticketMedioGeral / 1000).toFixed(0)}K

Gere uma análise objetiva com:
1. 📊 Diagnóstico geral (2-3 linhas)
2. 🏆 Top origens e por que performam bem
3. ⚠️ Origens com baixa conversão e possíveis causas
4. 💡 3 recomendações práticas e acionáveis
5. 🎯 Onde investir mais recursos

Seja direto, use dados concretos e foque em ações práticas. Máximo 300 palavras.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await response.json();
    const insight = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar insights.';

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ insight: 'Erro ao processar insights. Tente novamente.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
