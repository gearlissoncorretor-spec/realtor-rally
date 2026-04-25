import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'check'

  try {
    const vapidKeys = await getOrCreateVapidKeys(supabase)
    webpush.setVapidDetails(
      'mailto:noreply@axis.app',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    )

    if (action === 'vapid-public-key') {
      return jsonResponse({ publicKey: vapidKeys.publicKey })
    }

    if (action === 'subscribe') {
      const userId = await authenticateUser(req, supabaseUrl)
      if (!userId) return errorResponse('Unauthorized', 401)

      const { subscription } = await req.json()
      const keys = subscription.keys || {}

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }, { onConflict: 'endpoint,user_id' })

      if (error) throw error
      return jsonResponse({ success: true })
    }

    if (action === 'unsubscribe') {
      const userId = await authenticateUser(req, supabaseUrl)
      if (!userId) return errorResponse('Unauthorized', 401)

      const { endpoint } = await req.json()
      await supabase.from('push_subscriptions').delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint)

      return jsonResponse({ success: true })
    }

    if (action === 'check') {
      // Require authentication or cron secret for check action
      const cronSecret = req.headers.get('x-cron-secret')
      const expectedSecret = Deno.env.get('CRON_SECRET')
      const userId = await authenticateUser(req, supabaseUrl)
      
      if (!userId && (!expectedSecret || cronSecret !== expectedSecret)) {
        return errorResponse('Unauthorized', 401)
      }
      
      const results = await checkAndNotify(supabase)
      return jsonResponse(results)
    }

    if (action === 'test') {
      const userId = await authenticateUser(req, supabaseUrl)
      if (!userId) return errorResponse('Unauthorized', 401)

      const sent = await sendPushToUser(supabase, userId, {
        title: '🔔 Teste de notificação',
        body: 'As notificações push estão funcionando! Você receberá alertas mesmo com o app fechado.',
        tag: 'test-notification',
        url: '/configuracoes'
      })

      return jsonResponse({ success: true, sent })
    }

    return errorResponse('Unknown action', 400)
  } catch (error) {
    console.error('Push notification error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return errorResponse(message, 500)
  }
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function authenticateUser(req: Request, supabaseUrl: string): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  })

  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return null

  return user.id
}

async function getOrCreateVapidKeys(supabase: any) {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'vapid_keys')
    .single()

  if (data?.value?.publicKey && data?.value?.privateKey) {
    return data.value as { publicKey: string; privateKey: string }
  }

  const keys = webpush.generateVAPIDKeys()
  await supabase.from('system_settings').upsert({
    key: 'vapid_keys',
    value: { publicKey: keys.publicKey, privateKey: keys.privateKey },
    description: 'VAPID keys for Web Push notifications'
  }, { onConflict: 'key' })

  return keys
}

async function sendPushToUser(supabase: any, userId: string, payload: any) {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (!subscriptions?.length) return 0

  let sent = 0
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        JSON.stringify(payload)
      )
      sent++
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
      console.error(`Push failed for ${sub.id}:`, err.message)
    }
  }
  return sent
}

async function checkAndNotify(supabase: any) {
  const results = { stale: 0, followups: 0, goals: 0, sales: 0 }
  const now = new Date()

  // 1. Stale negotiations (no update in 2+ days)
  const twoDaysAgo = new Date(now)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const { data: staleNegotiations } = await supabase
    .from('negotiations')
    .select('id, client_name, broker_id, brokers!inner(user_id)')
    .in('status', ['em_contato', 'em_aprovacao', 'em_analise'])
    .lt('updated_at', twoDaysAgo.toISOString())

  if (staleNegotiations?.length) {
    const byBroker = groupByBrokerUserId(staleNegotiations)
    for (const [userId, items] of byBroker) {
      await sendPushToUser(supabase, userId, {
        title: `⚠️ ${items.length} negociação(ões) parada(s)`,
        body: `Sem atualização há 2+ dias: ${items.slice(0, 2).map((n: any) => n.client_name).join(', ')}`,
        tag: 'stale-negotiations',
        url: '/negociacoes'
      })
      results.stale += items.length
    }
  }

  // 2. Overdue follow-ups
  const today = now.toISOString().split('T')[0]

  const { data: overdueFollowUps } = await supabase
    .from('follow_ups')
    .select('id, client_name, broker_id, brokers!inner(user_id)')
    .lt('next_contact_date', today)
    .not('status', 'eq', 'convertido')

  if (overdueFollowUps?.length) {
    const byBroker = groupByBrokerUserId(overdueFollowUps)
    for (const [userId, items] of byBroker) {
      await sendPushToUser(supabase, userId, {
        title: `📋 ${items.length} follow-up(s) vencido(s)`,
        body: `Contatos atrasados: ${items.slice(0, 3).map((f: any) => f.client_name).join(', ')}`,
        tag: 'overdue-followups',
        url: '/follow-up'
      })
      results.followups += items.length
    }
  }

  // 3. Goals at risk (deadline in 3 days, below 80%)
  const threeDays = new Date(now)
  threeDays.setDate(threeDays.getDate() + 3)

  const { data: atRiskGoals } = await supabase
    .from('goals')
    .select('id, title, target_value, current_value, assigned_to')
    .gte('end_date', today)
    .lte('end_date', threeDays.toISOString().split('T')[0])
    .eq('status', 'em_andamento')

  if (atRiskGoals?.length) {
    const behind = atRiskGoals.filter((g: any) => g.current_value < g.target_value * 0.8)
    for (const goal of behind) {
      if (goal.assigned_to) {
        await sendPushToUser(supabase, goal.assigned_to, {
          title: '🎯 Meta em risco!',
          body: `"${goal.title}" vence em breve e está abaixo de 80%`,
          tag: `goal-${goal.id}`,
          url: '/metas'
        })
        results.goals++
      }
    }
  }

  // 4. New sales in last 30 minutes
  const thirtyMinAgo = new Date(now)
  thirtyMinAgo.setMinutes(thirtyMinAgo.getMinutes() - 30)

  const { data: newSales } = await supabase
    .from('sales')
    .select('id, client_name, vgv, broker_id, brokers!inner(user_id, team_id)')
    .gte('created_at', thirtyMinAgo.toISOString())
    .eq('status', 'confirmada')

  if (newSales?.length) {
    // Notify managers and directors about new sales
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .or('id.in.(select user_id from user_roles where role in (\'diretor\',\'gerente\',\'admin\'))')

    // Simplified: notify all users with push subscriptions about new sales
    const { data: allSubs } = await supabase
      .from('push_subscriptions')
      .select('user_id')

    if (allSubs?.length) {
      const uniqueUsers = [...new Set(allSubs.map((s: any) => s.user_id))] as string[]
      for (const userId of uniqueUsers) {
        for (const sale of newSales) {
          // Don't notify the broker who made the sale
          if (sale.brokers?.user_id === userId) continue
          await sendPushToUser(supabase, userId, {
            title: '🎉 Nova venda registrada!',
            body: `Cliente: ${sale.client_name} - VGV: R$ ${Number(sale.vgv).toLocaleString('pt-BR')}`,
            tag: `sale-${sale.id}`,
            url: '/vendas'
          })
          results.sales++
        }
      }
    }
  }

  return results
}

function groupByBrokerUserId(items: any[]): Map<string, any[]> {
  const map = new Map<string, any[]>()
  for (const item of items) {
    const userId = item.brokers?.user_id
    if (!userId) continue
    if (!map.has(userId)) map.set(userId, [])
    map.get(userId)!.push(item)
  }
  return map
}
