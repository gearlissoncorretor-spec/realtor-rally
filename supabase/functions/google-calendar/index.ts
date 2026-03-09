import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.user.id;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, code, redirectUri, timeMin, timeMax, maxResults = 50 } = await req.json();

    // Generate auth URL
    if (action === 'auth-url') {
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
        access_type: 'offline',
        prompt: 'consent',
        state: userId,
      });
      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for tokens
    if (action === 'exchange-code') {
      if (!code || !redirectUri) throw new Error('Missing code or redirectUri');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      if (tokenData.error) throw new Error(`OAuth error: ${tokenData.error_description || tokenData.error}`);

      // Get user email from Google
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      // Upsert tokens
      const { error: upsertError } = await supabaseAdmin
        .from('google_calendar_tokens')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          calendar_email: userInfo.email || null,
        }, { onConflict: 'user_id' });

      if (upsertError) throw new Error(`Failed to save tokens: ${upsertError.message}`);

      return new Response(JSON.stringify({ success: true, email: userInfo.email }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Disconnect
    if (action === 'disconnect') {
      const { error: delError } = await supabaseAdmin
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', userId);

      if (delError) throw new Error(`Failed to disconnect: ${delError.message}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check connection status
    if (action === 'status') {
      const { data: tokenRow } = await supabaseAdmin
        .from('google_calendar_tokens')
        .select('calendar_email, token_expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      return new Response(JSON.stringify({
        connected: !!tokenRow,
        email: tokenRow?.calendar_email || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List events (user-specific)
    if (action === 'list') {
      const { data: tokenRow } = await supabaseAdmin
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!tokenRow) {
        return new Response(JSON.stringify({ error: 'not_connected', events: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let accessToken = tokenRow.access_token;

      // Refresh token if expired
      if (new Date(tokenRow.token_expires_at) <= new Date()) {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: tokenRow.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshRes.json();
        if (refreshData.error) {
          // Token revoked, clean up
          await supabaseAdmin.from('google_calendar_tokens').delete().eq('user_id', userId);
          return new Response(JSON.stringify({ error: 'token_revoked', events: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        accessToken = refreshData.access_token;
        const newExpiry = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

        await supabaseAdmin
          .from('google_calendar_tokens')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiry,
          })
          .eq('user_id', userId);
      }

      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: String(maxResults),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const calResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!calResponse.ok) {
        const errBody = await calResponse.text();
        console.error('Calendar API error:', errBody);
        throw new Error(`Google Calendar API error [${calResponse.status}]`);
      }

      const calData = await calResponse.json();
      const events = (calData.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || '(Sem título)',
        description: item.description || '',
        location: item.location || '',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        htmlLink: item.htmlLink || '',
      }));

      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Google Calendar error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
