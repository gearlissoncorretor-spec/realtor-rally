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
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
    const GOOGLE_CALENDAR_ID = Deno.env.get('GOOGLE_CALENDAR_ID') || 'primary';

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_CALENDAR_API_KEY is not configured');
    }

    const { action, timeMin, timeMax, maxResults = 50 } = await req.json();

    if (action === 'list') {
      const params = new URLSearchParams({
        key: GOOGLE_API_KEY,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: String(maxResults),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events?${params}`
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google Calendar API error [${response.status}]: ${errorBody}`);
      }

      const data = await response.json();
      const events = (data.items || []).map((item: any) => ({
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
