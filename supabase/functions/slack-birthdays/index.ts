// Daily job: post today's broker birthdays to Slack.
// Trigger via pg_cron or manually. Channel from body.channel or SLACK_BIRTHDAY_CHANNEL env.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    let bodyChannel: string | undefined
    let targetCompanyId: string | null = null
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      bodyChannel = body?.channel
      targetCompanyId = body?.companyId ?? null
    }

    // Today in America/Sao_Paulo (MM-DD)
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayMMDD = `${mm}-${dd}`

    let q = supabase
      .from('brokers')
      .select('id, name, birthday, company_id')
      .eq('status', 'ativo')
      .not('birthday', 'is', null)
    if (targetCompanyId) q = q.eq('company_id', targetCompanyId)

    const { data: brokers, error } = await q
    if (error) throw error

    const todays = (brokers ?? []).filter(
      (b: any) => typeof b.birthday === 'string' && b.birthday.slice(5) === todayMMDD,
    )

    if (todays.length === 0) {
      return new Response(JSON.stringify({ ok: true, count: 0, message: 'no birthdays today' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group by company
    const byCompany = new Map<string, any[]>()
    for (const b of todays) {
      const k = b.company_id ?? '_'
      if (!byCompany.has(k)) byCompany.set(k, [])
      byCompany.get(k)!.push(b)
    }

    const defaultChannel = bodyChannel ?? Deno.env.get('SLACK_BIRTHDAY_CHANNEL') ?? 'general'
    const results: any[] = []

    for (const [companyId, rows] of byCompany.entries()) {
      const names = rows.map((r) => `• *${r.name}*`).join('\n')
      const message =
        `🎂 *Aniversariante${rows.length > 1 ? 's' : ''} do dia!*\n\n${names}\n\nNão esqueça de parabenizar! 🎉`

      const res = await fetch(`${supabaseUrl}/functions/v1/slack-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({
          event_type: 'aniversariante',
          data: { message },
          channel: defaultChannel,
        }),
      })
      const out = await res.json().catch(() => ({}))
      results.push({ companyId, count: rows.length, ok: res.ok, response: out })
    }

    return new Response(JSON.stringify({ ok: true, date: `${mm}-${dd}`, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('slack-birthdays error', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
