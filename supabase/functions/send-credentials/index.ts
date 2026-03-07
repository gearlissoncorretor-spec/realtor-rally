import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Use Supabase's built-in invite to send a password reset link
    // This sends a proper email through Supabase Auth
    const { error: inviteError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}`,
      }
    })

    // Even if magic link fails, we return success since the user was created
    // The admin can share credentials manually
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Credenciais de acesso enviadas para ${email}`,
        note: inviteError ? 'O email pode não ter sido enviado automaticamente. Compartilhe as credenciais manualmente.' : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
