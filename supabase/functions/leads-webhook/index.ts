// Webhook público para recebimento de leads externos (Meta Ads, site, etc.)
// Aceita POST com payload simples e GET para verificação de webhook do Facebook.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.95.0/cors';

interface LeadPayload {
  company_id?: string;
  agency_id?: string;
  form_id?: string;
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
    const raw = await req.json();
    console.log('leads-webhook payload:', JSON.stringify(raw).slice(0, 2000));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ---- Formato nativo do Meta (Lead Ads): { object: "page", entry: [{ changes: [{ field: "leadgen", value: {...} }] }] }
    if (raw?.object === 'page' && Array.isArray(raw?.entry)) {
      const APP_ID = Deno.env.get('FACEBOOK_APP_ID') ?? '';
      const APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') ?? '';
      const results: unknown[] = [];

      for (const entry of raw.entry) {
        for (const change of entry?.changes ?? []) {
          if (change?.field !== 'leadgen') continue;
          const v = change.value ?? {};
          const leadgenId = String(v.leadgen_id ?? '');
          const formId = String(v.form_id ?? '');
          const pageId = String(v.page_id ?? entry.id ?? '');

          const { data: form } = await supabaseAdmin
            .from('facebook_lead_forms')
            .select('id, company_id, agency_id, user_id, status, form_name, leads_count, page_id')
            .eq('form_id', formId)
            .maybeSingle();

          if (!form || form.status !== 'active') {
            results.push({ leadgenId, ignored: true, reason: form ? 'form_paused' : 'form_not_registered' });
            continue;
          }

          const { data: page } = await supabaseAdmin
            .from('facebook_pages')
            .select('id, page_access_token, company_id, agency_id')
            .eq('id', form.page_id)
            .maybeSingle();

          // Busca os dados do lead na Graph API
          const token =
            page?.page_access_token && page.page_access_token !== 'manual'
              ? page.page_access_token
              : APP_ID && APP_SECRET
                ? `${APP_ID}|${APP_SECRET}`
                : '';

          let fields: Record<string, string> = {};
          let fetchError: string | null = null;
          if (token && leadgenId) {
            const res = await fetch(
              `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${encodeURIComponent(token)}`,
            );
            const body = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(body?.field_data)) {
              for (const f of body.field_data) {
                fields[String(f.name).toLowerCase()] = String(f.values?.[0] ?? '');
              }
            } else {
              fetchError = body?.error?.message ?? `HTTP ${res.status}`;
            }
          } else {
            fetchError = 'sem token para consultar a Graph API';
          }

          const name =
            fields['full_name'] || fields['nome'] || fields['name'] || fields['first_name'] || 'Lead do Facebook';
          const phone = fields['phone_number'] || fields['telefone'] || fields['phone'] || null;
          const email = fields['email'] || fields['e-mail'] || null;

          const { data: inserted, error: insErr } = await supabaseAdmin
            .from('leads')
            .insert({
              company_id: form.company_id ?? page?.company_id ?? null,
              agency_id: form.agency_id ?? page?.agency_id ?? null,
              name: name.slice(0, 200),
              phone: phone?.slice(0, 30) ?? null,
              email: email?.slice(0, 200) ?? null,
              source: 'facebook',
              campaign: form.form_name?.slice(0, 200) ?? null,
              notes: fetchError ? `Não foi possível ler os campos do formulário: ${fetchError}` : null,
              raw_payload: { leadgen_id: leadgenId, form_id: formId, page_id: pageId, fields },
              status: 'novo',
            })
            .select('id')
            .single();

          if (insErr) {
            console.error('lead insert error:', insErr.message);
            results.push({ leadgenId, error: insErr.message });
            continue;
          }

          await supabaseAdmin
            .from('facebook_lead_forms')
            .update({ leads_count: (form.leads_count ?? 0) + 1, last_synced_at: new Date().toISOString() })
            .eq('id', form.id);

          results.push({ leadgenId, lead_id: inserted.id });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const payload = raw as LeadPayload;

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

    // Rate limit: 60 requests per 10 minutes per IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      _bucket: 'leads-webhook',
      _identifier: ip,
      _max_requests: 60,
      _window_minutes: 10,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json', 'Retry-After': '600' },
      });
    }

    // Se o payload traz o form_id (campanha do Facebook), respeita a escolha feita no sistema:
    // só recebe leads de formulários cadastrados e com status "active".
    let formRow: { company_id: string | null; agency_id: string | null; user_id: string | null; status: string | null; form_name: string | null; id: string; leads_count: number } | null = null;
    const formId = payload.form_id?.toString().trim();
    if (formId) {
      const { data } = await supabase
        .from('facebook_lead_forms')
        .select('id, company_id, agency_id, user_id, status, form_name, leads_count')
        .eq('form_id', formId)
        .maybeSingle();
      formRow = data ?? null;

      if (!formRow || formRow.status !== 'active') {
        return new Response(
          JSON.stringify({ success: true, ignored: true, reason: formRow ? 'form_paused' : 'form_not_registered' }),
          { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
        );
      }
    }

    const insert = {
      company_id: payload.company_id ?? formRow?.company_id ?? null,
      agency_id: payload.agency_id ?? formRow?.agency_id ?? null,
      name: payload.name.trim().slice(0, 200),
      phone: payload.phone?.toString().slice(0, 30) ?? null,
      email: payload.email?.toString().slice(0, 200) ?? null,
      source: payload.source ?? 'facebook',
      campaign: payload.campaign?.toString().slice(0, 200) ?? formRow?.form_name?.slice(0, 200) ?? null,
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

    if (formRow) {
      await supabase
        .from('facebook_lead_forms')
        .update({ leads_count: (formRow.leads_count ?? 0) + 1, last_synced_at: new Date().toISOString() })
        .eq('id', formRow.id);
    }


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
