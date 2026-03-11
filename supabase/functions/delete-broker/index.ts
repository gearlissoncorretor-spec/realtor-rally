import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify requesting user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error('Invalid user')

    // Check permissions
    const { data: isAdmin } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    const { data: isDiretor } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'diretor' })
    const { data: isGerente } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'gerente' })

    if (!isAdmin && !isDiretor && !isGerente) {
      throw new Error('Unauthorized: Sem permissão para excluir corretores')
    }

    const { broker_id } = await req.json()
    if (!broker_id) throw new Error('broker_id é obrigatório')

    // Get broker info (user_id, team_id)
    const { data: broker, error: brokerError } = await supabaseClient
      .from('brokers')
      .select('id, user_id, created_by, team_id')
      .eq('id', broker_id)
      .single()

    if (brokerError || !broker) throw new Error('Corretor não encontrado')

    // Gerentes can only delete brokers in their own team
    if (isGerente && !isAdmin && !isDiretor) {
      const { data: managerProfile } = await supabaseClient
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single()

      if (!managerProfile?.team_id || managerProfile.team_id !== broker.team_id) {
        throw new Error('Gerentes só podem excluir corretores da própria equipe')
      }
    }

    const userId = broker.user_id

    // Delete related data in order (respect FK constraints)
    // 1. broker_notes
    await supabaseClient.from('broker_notes').delete().eq('broker_id', broker_id)
    // 2. broker_activities
    await supabaseClient.from('broker_activities').delete().eq('broker_id', broker_id)
    // 3. broker_weekly_activities
    await supabaseClient.from('broker_weekly_activities').delete().eq('broker_id', broker_id)
    // 4. broker_tasks
    const { data: tasks } = await supabaseClient.from('broker_tasks').select('id').eq('broker_id', broker_id)
    if (tasks && tasks.length > 0) {
      const taskIds = tasks.map(t => t.id)
      await supabaseClient.from('task_attachments').delete().in('task_id', taskIds)
      await supabaseClient.from('task_comments').delete().in('task_id', taskIds)
      await supabaseClient.from('task_history').delete().in('task_id', taskIds)
      await supabaseClient.from('broker_tasks').delete().eq('broker_id', broker_id)
    }
    // 5. column_targets
    await supabaseClient.from('column_targets').delete().eq('broker_id', broker_id)
    // 6. follow_ups and contacts
    const { data: followUps } = await supabaseClient.from('follow_ups').select('id').eq('broker_id', broker_id)
    if (followUps && followUps.length > 0) {
      const followUpIds = followUps.map(f => f.id)
      await supabaseClient.from('follow_up_contacts').delete().in('follow_up_id', followUpIds)
      await supabaseClient.from('follow_ups').delete().eq('broker_id', broker_id)
    }
    // 7. negotiations
    await supabaseClient.from('negotiations').delete().eq('broker_id', broker_id)
    // 8. sales (nullify broker_id to preserve sale records)
    await supabaseClient.from('sales').update({ broker_id: null }).eq('broker_id', broker_id)
    // 9. goals
    await supabaseClient.from('goals').delete().eq('broker_id', broker_id)
    // 10. targets
    await supabaseClient.from('targets').delete().eq('broker_id', broker_id)

    // Delete broker record
    const { error: deleteBrokerError } = await supabaseClient
      .from('brokers')
      .delete()
      .eq('id', broker_id)

    if (deleteBrokerError) throw new Error(`Erro ao excluir corretor: ${deleteBrokerError.message}`)

    // Delete auth user and profile if exists
    if (userId) {
      await supabaseClient.from('user_roles').delete().eq('user_id', userId)
      await supabaseClient.from('profiles').delete().eq('id', userId)
      await supabaseClient.auth.admin.deleteUser(userId)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Corretor excluído com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in delete-broker:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
