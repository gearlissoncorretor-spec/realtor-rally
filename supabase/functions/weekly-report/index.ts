// Weekly sales report: aggregates last 7 days per company and emails admins.
// Trigger via pg_cron (weekly) or manually with POST { companyId?: string }.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const fmtDate = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })

interface SaleRow {
  company_id: string
  valor_venda: number | null
  valor_comissao: number | null
  corretor_nome: string | null
  status: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    let targetCompanyId: string | null = null
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      targetCompanyId = body?.companyId ?? null
    }

    const now = new Date()
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const periodLabel = `${fmtDate(start)} a ${fmtDate(now)}`

    // Fetch sales in the window
    let query = supabase
      .from('sales')
      .select('company_id, valor_venda, valor_comissao, corretor_nome, status')
      .gte('data_venda', start.toISOString().slice(0, 10))
    if (targetCompanyId) query = query.eq('company_id', targetCompanyId)

    const { data: sales, error } = await query
    if (error) throw error

    // Exclude cancelled/distrato per project rule
    const isValid = (s: SaleRow) => {
      const st = (s.status || '').toLowerCase()
      return !st.includes('distrato') && !st.includes('cancel')
    }

    // Group by company
    const byCompany = new Map<string, SaleRow[]>()
    for (const s of (sales as SaleRow[]) ?? []) {
      if (!isValid(s)) continue
      if (!byCompany.has(s.company_id)) byCompany.set(s.company_id, [])
      byCompany.get(s.company_id)!.push(s)
    }

    const results: Array<{ company: string; sent: boolean; recipients: number }> = []

    for (const [companyId, rows] of byCompany.entries()) {
      const totalVgv = rows.reduce((sum, r) => sum + Number(r.valor_venda || 0), 0)
      const totalCommission = rows.reduce((sum, r) => sum + Number(r.valor_comissao || 0), 0)

      // Top broker
      const brokerAgg = new Map<string, number>()
      for (const r of rows) {
        const n = r.corretor_nome || '—'
        brokerAgg.set(n, (brokerAgg.get(n) || 0) + Number(r.valor_venda || 0))
      }
      const [topBroker, topBrokerVgv] =
        Array.from(brokerAgg.entries()).sort((a, b) => b[1] - a[1])[0] ?? [null, 0]

      // Company info
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .maybeSingle()

      // Recipients: sócios / diretores of the company
      const { data: admins } = await supabase
        .from('profiles')
        .select('email, funcao')
        .eq('company_id', companyId)
        .in('funcao', ['Sócio', 'Diretor', 'Super Admin'])

      const recipients = (admins ?? [])
        .map((a: any) => a.email)
        .filter((e: string | null): e is string => !!e)

      if (recipients.length === 0) {
        results.push({ company: company?.name ?? companyId, sent: false, recipients: 0 })
        continue
      }

      for (const to of recipients) {
        await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
          },
          body: JSON.stringify({
            templateName: 'weekly-report',
            to,
            idempotencyKey: `weekly-${companyId}-${start.toISOString().slice(0, 10)}-${to}`,
            templateData: {
              companyName: company?.name ?? 'Sua empresa',
              periodLabel,
              totalVgv: BRL(totalVgv),
              totalSales: rows.length,
              totalCommission: BRL(totalCommission),
              topBroker,
              topBrokerVgv: BRL(topBrokerVgv as number),
            },
          }),
        })
      }

      results.push({
        company: company?.name ?? companyId,
        sent: true,
        recipients: recipients.length,
      })
    }

    return new Response(JSON.stringify({ ok: true, period: periodLabel, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('weekly-report error', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
