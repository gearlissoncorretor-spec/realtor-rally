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
    console.log('Create user function invoked')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Invalid user:', userError)
      throw new Error('Invalid user')
    }

    console.log('Request from user:', user.id)

    // Check if user is admin using new role system
    const { data: adminCheck, error: adminError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (adminError || !adminCheck) {
      console.error('Unauthorized access attempt by:', user.id)
      throw new Error('Unauthorized: Only admins can create users')
    }

    // Get request body
    const { 
      full_name, 
      email, 
      password, 
      role, 
      allowed_screens, 
      team_id,
      phone,
      cpf,
      creci,
      avatar_url,
      meta_monthly,
      observations,
      status
    } = await req.json()
    console.log('Creating user:', { email, role, team_id, allowed_screens })

    // Validate required fields
    if (!full_name || !email || !password || !role) {
      console.error('Missing required fields')
      throw new Error('Campos obrigatórios faltando: nome, email, senha e cargo')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido')
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres')
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      throw new Error('A senha deve conter letras e números')
    }

    // Set default allowed_screens if not provided
    const finalAllowedScreens = allowed_screens || (role === 'corretor' ? ['dashboard', 'vendas'] : ['dashboard'])

    // Validate manager has team
    if (role === 'gerente' && !team_id) {
      console.error('Manager without team')
      throw new Error('Managers must be assigned to a team')
    }

    // Create user in Supabase Auth
    console.log('Creating user in auth...')
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) {
      console.error('Auth error:', authError)
      // Provide more specific error messages
      if (authError.message?.includes('User already registered')) {
        throw new Error('Este email já está cadastrado no sistema')
      }
      if (authError.message?.includes('Database error')) {
        throw new Error('Erro no banco de dados. Verifique se o email já existe ou contate o suporte.')
      }
      throw new Error(authError.message || 'Erro ao criar usuário na autenticação')
    }
    if (!authData.user) {
      console.error('User creation failed - no user returned')
      throw new Error('User creation failed')
    }

    console.log('User created in auth:', authData.user.id)

    // Create profile (without role - now in user_roles table)
    console.log('Creating profile...')
    const { error: profileInsertError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        allowed_screens: finalAllowedScreens,
        approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        team_id: team_id || null
      })

    if (profileInsertError) {
      console.error('Profile creation error:', profileInsertError)
      // If profile creation fails, delete the auth user
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw profileInsertError
    }

    console.log('Profile created successfully')

    // Create role in user_roles table (SECURE ROLE SYSTEM)
    console.log('Creating user role...')
    const { error: roleInsertError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role,
        created_by: user.id
      })

    if (roleInsertError) {
      console.error('Role creation error:', roleInsertError)
      // If role creation fails, delete profile and auth user
      await supabaseClient.from('profiles').delete().eq('id', authData.user.id)
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw roleInsertError
    }

    console.log('User role assigned successfully')

    // Create broker if role is corretor
    if (role === 'corretor') {
      console.log('Creating broker entry...')
      const { error: brokerInsertError } = await supabaseClient
        .from('brokers')
        .insert({
          user_id: authData.user.id,
          name: full_name,
          email,
          phone: phone || null,
          cpf: cpf || null,
          creci: creci || null,
          avatar_url: avatar_url || null,
          meta_monthly: meta_monthly || 0,
          observations: observations || null,
          status: status || 'ativo',
          team_id: team_id || null
        })

      if (brokerInsertError) {
        console.error('Broker creation error:', brokerInsertError)
        // If broker creation fails, delete role, profile and auth user
        await supabaseClient.from('user_roles').delete().eq('user_id', authData.user.id)
        await supabaseClient.from('profiles').delete().eq('id', authData.user.id)
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw brokerInsertError
      }

      console.log('Broker created successfully')
    }

    console.log('User created successfully:', authData.user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: authData.user.id, 
          email, 
          full_name, 
          role 
        } 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})