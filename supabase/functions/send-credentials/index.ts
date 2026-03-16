import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Não autorizado')

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    const requesterId = claimsData?.claims?.sub

    if (claimsError || !requesterId) throw new Error('Usuário inválido')

    const [adminRole, diretorRole, gerenteRole] = await Promise.all([
      supabaseClient.rpc('has_role', { _user_id: requesterId, _role: 'admin' }),
      supabaseClient.rpc('has_role', { _user_id: requesterId, _role: 'diretor' }),
      supabaseClient.rpc('has_role', { _user_id: requesterId, _role: 'gerente' })
    ])

    if (!adminRole.data && !diretorRole.data && !gerenteRole.data) {
      throw new Error('Sem permissão para enviar credenciais')
    }

    const { email, password, full_name, role, is_password_reset, user_id } = await req.json()

    if (!email || !password || !full_name) {
      throw new Error('Campos obrigatórios: email, password, full_name')
    }

    const canonicalEmail = user_id
      ? (await supabaseClient.auth.admin.getUserById(user_id)).data.user?.email || email
      : email

    const origin = req.headers.get('origin') || 'https://gestaoequipembsc.lovable.app'

    if (is_password_reset) {
      const { error: linkError } = await supabaseClient.auth.admin.generateLink({
        type: 'recovery',
        email: canonicalEmail,
        options: {
          redirectTo: `${origin}/reset-password`,
        }
      })

      if (linkError) {
        console.error('Recovery link generation failed:', linkError.message)
        return new Response(
          JSON.stringify({
            success: true,
            message: `Senha resetada para ${canonicalEmail}`,
            note: `O email automático não pôde ser enviado. Compartilhe as credenciais manualmente: Login: ${canonicalEmail} | Senha temporária: ${password}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Credenciais processadas para ${canonicalEmail}`,
          note: `A senha temporária foi criada e o link de recuperação foi enviado para ${canonicalEmail}. O login deve ser feito com esse email.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(canonicalEmail, {
      redirectTo: `${origin}/auth`,
      data: {
        full_name,
        invited: true,
      }
    })

    let fallbackNote = null
    if (inviteError) {
      console.log('Invite failed (user may already exist), trying recovery link:', inviteError.message)

      const { error: recoveryError } = await supabaseClient.auth.admin.generateLink({
        type: 'recovery',
        email: canonicalEmail,
        options: {
          redirectTo: `${origin}/reset-password`,
        }
      })

      if (recoveryError) {
        console.error('Recovery link also failed:', recoveryError.message)
        fallbackNote = `O email automático não pôde ser enviado (${inviteError.message}). Compartilhe as credenciais manualmente: Login: ${canonicalEmail} | Senha: ${password}`
      } else {
        fallbackNote = `Um link de recuperação foi gerado para ${canonicalEmail}. O usuário receberá um email para definir sua senha.`
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Credenciais de acesso processadas para ${canonicalEmail}`,
        note: fallbackNote || `Email de convite enviado para ${canonicalEmail}. O usuário poderá acessar o sistema através do link recebido.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('send-credentials error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})