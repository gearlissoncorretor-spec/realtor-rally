// Webhook público para recebimento de leads externos (Meta Ads, site, etc.)
// Aceita POST com payload simples e GET para verificação de webhook do Facebook.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.95.0/cors';

interface LeadPayload {
  company_id?: string;
  agency_id?: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  campaign?: string;
  adset?: string;
  ad?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  notes?: string;
}

const headers = corsHeaders ?? {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  // Facebook webhook verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
      return new Response(challenge ?? '', { status: 200, headers });
    }
    return new Response('Forbidden', { status: 403, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = (await req.json()) as LeadPayload;

    if (!payload?.name || typeof payload.name !== 'string') {
      return new Response(JSON.stringify({ error: 'Field "name" is required' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const insert = {
      company_id: payload.company_id ?? null,
      agency_id: payload.agency_id ?? null,
      name: payload.name.trim().slice(0, 200),
      phone: payload.phone?.toString().slice(0, 30) ?? null,
      email: payload.email?.toString().slice(0, 200) ?? null,
      source: payload.source ?? 'facebook',
      campaign: payload.campaign?.toString().slice(0, 200) ?? null,
      adset: payload.adset?.toString().slice(0, 200) ?? null,
      ad: payload.ad?.toString().slice(0, 200) ?? null,
      utm_source: payload.utm_source?.toString().slice(0, 200) ?? null,
      utm_campaign: payload.utm_campaign?.toString().slice(0, 200) ?? null,
      utm_medium: payload.utm_medium?.toString().slice(0, 200) ?? null,
      notes: payload.notes?.toString().slice(0, 2000) ?? null,
      raw_payload: payload as unknown as Record<string, unknown>,
      status: 'novo',
    };

    const { data, error } = await supabase.from('leads').insert(insert).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, lead_id: data.id }), {
      status: 201,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('leads-webhook error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
