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

    const { email, password, full_name, role, is_password_reset } = await req.json()

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
    const origin = req.headers.get('origin') || 'https://gestaoequipembsc.lovable.app'

    if (is_password_reset) {
      // For password resets, send a recovery link so user can also set their own password
      // The temp password is shown on screen to the manager
      const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${origin}/reset-password`,
        }
      })

      if (linkError) {
        console.error('Recovery link generation failed:', linkError.message)
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Senha resetada para ${email}`,
            note: `O email automático não pôde ser enviado. Compartilhe as credenciais manualmente: Email: ${email} | Senha temporária: ${password}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Credenciais processadas para ${email}`,
          note: `Um link de recuperação foi enviado para ${email}. O usuário também pode usar a senha temporária informada pelo gestor para acessar o sistema.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Original flow for new user invites
    const { error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
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
        email,
        options: {
          redirectTo: `${origin}/reset-password`,
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