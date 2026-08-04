// Facebook Lead Ads - OAuth (por usuário) + gestão de páginas
// Ações: start | callback | pages | sync | subscribe | disconnect
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const FB_API = 'https://graph.facebook.com/v21.0';
const SCOPES = ['pages_show_list', 'leads_retrieval', 'pages_read_engagement', 'pages_manage_metadata'];

const APP_ID = Deno.env.get('FACEBOOK_APP_ID') ?? '';
const APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/facebook-oauth/callback`;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data?.user ?? null;
}

async function fbFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${FB_API}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.error) {
    const msg = body?.error?.message ?? `Facebook API error ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

async function syncPages(userId: string, connectionId: string, userToken: string) {
  const data = await fbFetch('/me/accounts', {
    access_token: userToken,
    fields: 'id,name,category,access_token,picture{url}',
    limit: '100',
  });

  const pages = (data?.data ?? []) as any[];
  for (const p of pages) {
    await admin.from('facebook_pages').upsert(
      {
        connection_id: connectionId,
        user_id: userId,
        page_id: p.id,
        page_name: p.name,
        page_access_token: p.access_token,
        category: p.category ?? null,
        picture_url: p.picture?.data?.url ?? null,
      },
      { onConflict: 'user_id,page_id' },
    );
  }

  await admin
    .from('facebook_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connectionId);

  return pages.length;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.pathname.split('/').filter(Boolean).pop();

  try {
    const NEEDS_APP = ['start', 'callback', 'sync', 'subscribe'];
    if ((!APP_ID || !APP_SECRET) && NEEDS_APP.includes(action ?? '')) {
      if (action === 'callback') {
        return new Response('Integração do Facebook não configurada (FACEBOOK_APP_ID/SECRET).', { status: 500 });
      }
      return json({ error: 'not_configured', message: 'Faltam os segredos FACEBOOK_APP_ID e FACEBOOK_APP_SECRET. Use a conexão manual (Page ID + Form ID).' }, 400);
    }


    // ---- OAuth callback (Meta redireciona aqui) ----
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state') ?? '';
      const { data: stateRow } = await admin
        .from('facebook_oauth_states')
        .select('*')
        .eq('state', state)
        .maybeSingle();

      const redirectTo = stateRow?.redirect_to || `${url.origin}`;
      const fail = (msg: string) =>
        Response.redirect(`${redirectTo}?fb=error&message=${encodeURIComponent(msg)}`, 302);

      if (!code || !stateRow) return fail('Sessão de autorização inválida ou expirada.');
      if (new Date(stateRow.expires_at) < new Date()) return fail('Sessão de autorização expirada.');

      // troca code -> token curto -> token longo
      const short = await fbFetch('/oauth/access_token', {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      });
      const long = await fbFetch('/oauth/access_token', {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: short.access_token,
      });
      const accessToken = long.access_token as string;
      const expiresIn = Number(long.expires_in ?? 0);

      const me = await fbFetch('/me', { access_token: accessToken, fields: 'id,name,email' });

      const { data: conn, error: connErr } = await admin
        .from('facebook_connections')
        .upsert(
          {
            user_id: stateRow.user_id,
            facebook_user_id: me.id,
            facebook_user_name: me.name ?? null,
            facebook_user_email: me.email ?? null,
            access_token: accessToken,
            token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
            scopes: SCOPES,
            status: 'active',
          },
          { onConflict: 'user_id,facebook_user_id' },
        )
        .select()
        .single();

      if (connErr || !conn) return fail(connErr?.message ?? 'Falha ao salvar a conexão.');

      await syncPages(stateRow.user_id, conn.id, accessToken);
      await admin.from('facebook_oauth_states').delete().eq('state', state);

      return Response.redirect(`${redirectTo}?fb=connected`, 302);
    }

    // ---- Ações autenticadas ----
    const user = await getUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    if (action === 'start') {
      const state = crypto.randomUUID();
      await admin.from('facebook_oauth_states').insert({
        state,
        user_id: user.id,
        redirect_to: typeof body.redirect_to === 'string' ? body.redirect_to : null,
      });
      const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
      authUrl.searchParams.set('client_id', APP_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('scope', SCOPES.join(','));
      authUrl.searchParams.set('response_type', 'code');
      return json({ url: authUrl.toString() });
    }

    if (action === 'pages') {
      const { data: conns } = await admin
        .from('facebook_connections')
        .select('id, facebook_user_id, facebook_user_name, facebook_user_email, status, last_synced_at, token_expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const conn = (conns ?? [])[0] ?? null;

      const { data: pages } = await admin
        .from('facebook_pages')
        .select('id, page_id, page_name, category, picture_url, subscribed, last_lead_at')
        .eq('user_id', user.id)
        .order('page_name');

      const { data: forms } = await admin
        .from('facebook_lead_forms')
        .select('id, page_id, form_id, form_name, status, leads_count')
        .eq('user_id', user.id)
        .order('created_at');

      return json({
        connection: conn,
        manual: conn?.facebook_user_id?.startsWith('manual:') ?? false,
        pages: pages ?? [],
        forms: forms ?? [],
      });
    }

    // ---- Conexão manual: cadastrar página + formulário sem OAuth ----
    if (action === 'manual-page') {
      const pageId = String(body.page_id ?? '').trim();
      const pageName = String(body.page_name ?? '').trim();
      const formId = String(body.form_id ?? '').trim();
      const formName = String(body.form_name ?? '').trim();

      if (!/^\d{5,25}$/.test(pageId)) return json({ error: 'invalid_page_id', message: 'Page ID deve conter apenas números (5 a 25 dígitos).' }, 400);
      if (!pageName || pageName.length > 120) return json({ error: 'invalid_page_name', message: 'Informe um nome de página válido (até 120 caracteres).' }, 400);
      if (formId && !/^\d{5,25}$/.test(formId)) return json({ error: 'invalid_form_id', message: 'Form ID deve conter apenas números (5 a 25 dígitos).' }, 400);
      if (formName.length > 120) return json({ error: 'invalid_form_name', message: 'Nome do formulário muito longo.' }, 400);

      const { data: profile } = await admin
        .from('profiles')
        .select('company_id, agency_id')
        .eq('id', user.id)
        .maybeSingle();

      const { data: conn, error: connErr } = await admin
        .from('facebook_connections')
        .upsert(
          {
            user_id: user.id,
            company_id: profile?.company_id ?? null,
            agency_id: profile?.agency_id ?? null,
            facebook_user_id: `manual:${user.id}`,
            facebook_user_name: 'Conexão manual',
            facebook_user_email: null,
            access_token: 'manual',
            scopes: [],
            status: 'active',
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,facebook_user_id' },
        )
        .select()
        .single();
      if (connErr || !conn) return json({ error: 'connection_error', message: connErr?.message ?? 'Falha ao salvar conexão.' }, 400);

      const { data: page, error: pageErr } = await admin
        .from('facebook_pages')
        .upsert(
          {
            connection_id: conn.id,
            user_id: user.id,
            company_id: profile?.company_id ?? null,
            agency_id: profile?.agency_id ?? null,
            page_id: pageId,
            page_name: pageName,
            page_access_token: 'manual',
            category: 'Manual',
            subscribed: true,
          },
          { onConflict: 'user_id,page_id' },
        )
        .select()
        .single();
      if (pageErr || !page) return json({ error: 'page_error', message: pageErr?.message ?? 'Falha ao salvar página.' }, 400);

      if (formId) {
        const { error: formErr } = await admin.from('facebook_lead_forms').upsert(
          {
            page_id: page.id,
            user_id: user.id,
            company_id: profile?.company_id ?? null,
            agency_id: profile?.agency_id ?? null,
            form_id: formId,
            form_name: formName || `Formulário ${formId}`,
            status: 'active',
          },
          { onConflict: 'page_id,form_id' },
        );
        if (formErr) return json({ error: 'form_error', message: formErr.message }, 400);
      }

      return json({ ok: true, page_id: page.id });
    }

    if (action === 'manual-form') {
      const pageRowId = String(body.page_row_id ?? '');
      const formId = String(body.form_id ?? '').trim();
      const formName = String(body.form_name ?? '').trim();
      if (!/^\d{5,25}$/.test(formId)) return json({ error: 'invalid_form_id', message: 'Form ID deve conter apenas números (5 a 25 dígitos).' }, 400);

      const { data: page } = await admin
        .from('facebook_pages')
        .select('id, company_id, agency_id')
        .eq('id', pageRowId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!page) return json({ error: 'page_not_found' }, 404);

      const { error } = await admin.from('facebook_lead_forms').upsert(
        {
          page_id: page.id,
          user_id: user.id,
          company_id: page.company_id,
          agency_id: page.agency_id,
          form_id: formId,
          form_name: formName || `Formulário ${formId}`,
          status: 'active',
        },
        { onConflict: 'page_id,form_id' },
      );
      if (error) return json({ error: 'form_error', message: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'manual-remove') {
      const pageRowId = body.page_row_id ? String(body.page_row_id) : null;
      const formRowId = body.form_row_id ? String(body.form_row_id) : null;
      if (formRowId) {
        await admin.from('facebook_lead_forms').delete().eq('id', formRowId).eq('user_id', user.id);
      } else if (pageRowId) {
        await admin.from('facebook_lead_forms').delete().eq('page_id', pageRowId).eq('user_id', user.id);
        await admin.from('facebook_pages').delete().eq('id', pageRowId).eq('user_id', user.id);
      }
      return json({ ok: true });
    }



    if (action === 'sync') {
      const { data: conn } = await admin
        .from('facebook_connections')
        .select('id, access_token')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (!conn) return json({ error: 'no_connection' }, 400);
      const count = await syncPages(user.id, conn.id, conn.access_token);
      return json({ ok: true, pages: count });
    }

    if (action === 'subscribe') {
      const pageRowId = String(body.page_id ?? '');
      const enable = body.enable !== false;
      const { data: page } = await admin
        .from('facebook_pages')
        .select('*')
        .eq('id', pageRowId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!page) return json({ error: 'page_not_found' }, 404);

      // Página cadastrada manualmente: apenas liga/desliga o recebimento no sistema
      if (page.page_access_token === 'manual') {
        await admin.from('facebook_pages').update({ subscribed: enable }).eq('id', page.id);
        return json({ ok: true, subscribed: enable, manual: true });
      }


      const endpoint = `${FB_API}/${page.page_id}/subscribed_apps`;
      const res = await fetch(endpoint, {
        method: enable ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: page.page_access_token,
          subscribed_fields: 'leadgen',
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out?.error) {
        return json({ error: 'facebook_error', details: out?.error?.message ?? `HTTP ${res.status}` }, res.status || 400);
      }

      await admin.from('facebook_pages').update({ subscribed: enable }).eq('id', page.id);
      return json({ ok: true, subscribed: enable });
    }

    if (action === 'disconnect') {
      await admin.from('facebook_pages').delete().eq('user_id', user.id);
      await admin.from('facebook_connections').delete().eq('user_id', user.id);
      return json({ ok: true });
    }

    return json({ error: 'unknown_action' }, 404);
  } catch (err) {
    console.error('facebook-oauth error:', err);
    return json({ error: 'internal_error', message: (err as Error).message }, 500);
  }
});
