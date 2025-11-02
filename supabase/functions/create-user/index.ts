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
    const body = await req.json()
    const {
      full_name,
      name,
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
    } = body
    const resolvedName = (full_name || name || '').toString().trim()
    console.log('Creating user:', { email, role, team_id, allowed_screens })

    // Validate required fields
    if (!resolvedName || !email || !password || !role) {
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

    // Check if user already exists by email
    console.log('Checking if user already exists...')
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      console.error('User already exists:', existingUser.email)
      throw new Error(`Este email já está cadastrado no sistema (${existingUser.full_name})`)
    }

    // Create user in Supabase Auth
    console.log('Creating user in auth...')
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: resolvedName }
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

    // Ensure profile (handle possible auth trigger that already inserted)
    console.log('Ensuring profile...')
    const { data: profileExists } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileExists) {
      const { error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update({
          full_name: resolvedName,
          email,
          allowed_screens: finalAllowedScreens,
          approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          team_id: team_id || null
        })
        .eq('id', authData.user.id)

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError)
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw profileUpdateError
      }
    } else {
      const { error: profileInsertError } = await supabaseClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: resolvedName,
          email,
          allowed_screens: finalAllowedScreens,
          approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          team_id: team_id || null
        })

      if (profileInsertError) {
        console.error('Profile creation error:', profileInsertError)
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw profileInsertError
      }
    }

    console.log('Profile ensured successfully')

    // Create role in user_roles table (SECURE ROLE SYSTEM)
    console.log('Creating user role...')
    const { data: existingRole } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('user_id', authData.user.id)
      .eq('role', role)
      .maybeSingle()

    if (!existingRole) {
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
    } else {
      console.log('Role already exists, skipping insert')
    }

    // Create broker if role is corretor
    if (role === 'corretor') {
      console.log('Ensuring broker entry...')
      const { data: existingBroker } = await supabaseClient
        .from('brokers')
        .select('id')
        .eq('user_id', authData.user.id)
        .maybeSingle()

      if (!existingBroker) {
        const { error: brokerInsertError } = await supabaseClient
          .from('brokers')
          .insert({
            user_id: authData.user.id,
            name: resolvedName,
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
      } else {
        console.log('Broker already exists, skipping insert')
      }
    }

    console.log('User created successfully:', authData.user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: authData.user.id, 
          email, 
          full_name: resolvedName, 
          role 
        } 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 
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