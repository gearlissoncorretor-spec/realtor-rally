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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify requesting user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error('Usuário inválido')

    // Check permissions
    const { data: isAdmin } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    const { data: isDiretor } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'diretor' })
    const { data: isGerente } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'gerente' })

    if (!isAdmin && !isDiretor && !isGerente) {
      throw new Error('Sem permissão para enviar credenciais')
    }

    const { email, password, full_name, role } = await req.json()

    if (!email || !password || !full_name) {
      throw new Error('Campos obrigatórios: email, password, full_name')
    }

    // Get organization settings for branding
    const { data: orgSettings } = await supabaseClient
      .from('organization_settings')
      .select('organization_name')
      .limit(1)
      .maybeSingle()

    const orgName = orgSettings?.organization_name || 'Gestão Imobiliária'
    const roleName = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Usuário'

    // Use Supabase's inviteUserByEmail to send a proper invite email
    // This sends an email through Supabase Auth with a magic link
    const { error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get('origin') || 'https://gestaoequipembsc.lovable.app'}/auth`,
      data: {
        full_name,
        invited: true,
      }
    })

    // If invite fails (user already exists), try generating a recovery link instead
    let fallbackNote = null
    if (inviteError) {
      console.log('Invite failed (user may already exist), trying recovery link:', inviteError.message)
      
      const { error: recoveryError } = await supabaseClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${req.headers.get('origin') || 'https://gestaoequipembsc.lovable.app'}/reset-password`,
        }
      })

      if (recoveryError) {
        console.error('Recovery link also failed:', recoveryError.message)
        fallbackNote = `O email automático não pôde ser enviado (${inviteError.message}). Compartilhe as credenciais manualmente: Email: ${email} | Senha: ${password}`
      } else {
        fallbackNote = 'Um link de recuperação foi gerado. O usuário receberá um email para definir sua senha.'
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Credenciais de acesso processadas para ${email}`,
        note: fallbackNote || `Email de convite enviado para ${email}. O usuário poderá acessar o sistema através do link recebido.`
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
