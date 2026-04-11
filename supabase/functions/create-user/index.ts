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

    // Check if user has permission to create users
    const { data: isSuperAdmin } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'super_admin' })

    const { data: isSocio } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'socio' })

    const { data: isAdmin } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })
    
    const { data: isDiretor } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'diretor' })
    
    const { data: isGerente } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'gerente' })

    const canCreateUsers = isSuperAdmin || isSocio || isAdmin || isDiretor || isGerente

    if (!canCreateUsers) {
      console.error('Unauthorized access attempt by:', user.id)
      throw new Error('Unauthorized: Apenas administradores, diretores e gerentes podem criar usuários')
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
      status,
      nickname,
      birth_date,
      company_id,
      created_by: providedCreatedBy
    } = body
    const resolvedName = (full_name || name || '').toString().trim()
    const createdByUserId = providedCreatedBy || user.id
    console.log('Creating user:', { email, role, team_id, allowed_screens, company_id })

    // Validate required fields
    if (!resolvedName || !email || !password || !role) {
      console.error('Missing required fields:', { resolvedName: !!resolvedName, email: !!email, password: !!password, role: !!role })
      throw new Error('❌ Campos obrigatórios: nome, email, senha e cargo')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email)
      throw new Error('❌ Formato de email inválido')
    }

    // Validate password strength
    if (password.length < 8) {
      console.error('Password too short')
      throw new Error('❌ A senha deve ter pelo menos 8 caracteres')
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      console.error('Password lacks numbers or letters')
      throw new Error('❌ A senha deve conter letras e números')
    }

    // Validate role is valid
    const validRoles = ['admin', 'diretor', 'gerente', 'corretor', 'super_admin']
    if (!validRoles.includes(role)) {
      console.error('Invalid role:', role)
      throw new Error('❌ Cargo inválido')
    }

    // Gerentes só podem criar corretores da sua própria equipe
    if (isGerente && !isAdmin && !isDiretor) {
      if (role !== 'corretor') {
        throw new Error('❌ Gerentes só podem criar corretores')
      }
      
      // Get manager's team
      const { data: managerProfile } = await supabaseClient
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single()
      
      if (!managerProfile?.team_id) {
        throw new Error('❌ Gerente não está associado a uma equipe')
      }
      
      // Force team_id to be the manager's team
      if (team_id && team_id !== managerProfile.team_id) {
        throw new Error('❌ Gerentes só podem criar corretores na sua própria equipe')
      }
    }

    // Set default allowed_screens if not provided
    const gerenteScreens = ['dashboard', 'central-gestor', 'vendas', 'corretores', 'equipes', 'ranking', 'metas', 'acompanhamento', 'relatorios', 'x1', 'dashboard-equipes', 'atividades', 'negociacoes', 'follow-up', 'meta-gestao', 'configuracoes', 'agenda', 'comissoes', 'instalar']
    const corretorScreens = ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'configuracoes']
    const finalAllowedScreens = allowed_screens || (role === 'corretor' ? corretorScreens : role === 'gerente' ? gerenteScreens : ['dashboard'])

    // Validate manager has team
    if (role === 'gerente' && !team_id) {
      console.error('Manager without team')
      throw new Error('❌ Gerentes devem ser associados a uma equipe')
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
      throw new Error(`⚠️ Este email já está cadastrado no sistema (${existingUser.full_name})`)
    }

    // Create user in Supabase Auth
    console.log('Creating user in auth...')
    // Resolve company_id: use provided, or get from requesting user's profile
    let targetCompanyId = company_id
    if (!targetCompanyId) {
      const { data: requesterProfile } = await supabaseClient
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      targetCompanyId = requesterProfile?.company_id
    }

    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: resolvedName, company_id: targetCompanyId }
    })

    if (authError) {
      console.error('Auth error:', authError)
      // Provide more specific error messages
      if (authError.message?.includes('User already registered')) {
        throw new Error('⚠️ Este email já está cadastrado no sistema')
      }
      if (authError.message?.includes('Database error')) {
        throw new Error('❌ Erro no banco de dados. Tente novamente ou contate o suporte.')
      }
      throw new Error(`❌ Erro na autenticação: ${authError.message}`)
    }
    if (!authData.user) {
      console.error('User creation failed - no user returned')
      throw new Error('❌ Falha ao criar usuário')
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
          team_id: team_id || null,
          nickname: nickname || null,
          phone: phone || null,
          birth_date: birth_date || null,
          company_id: targetCompanyId,
        })
        .eq('id', authData.user.id)

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError)
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw new Error(`❌ Erro ao atualizar perfil: ${profileUpdateError.message}`)
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
          team_id: team_id || null,
          nickname: nickname || null,
          phone: phone || null,
          birth_date: birth_date || null,
          company_id: targetCompanyId,
        })

      if (profileInsertError) {
        console.error('Profile creation error:', profileInsertError)
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw new Error(`❌ Erro ao criar perfil: ${profileInsertError.message}`)
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
        throw new Error(`❌ Erro ao atribuir cargo: ${roleInsertError.message}`)
      }
      console.log('User role assigned successfully')
    } else {
      console.log('Role already exists, skipping insert')
    }

    // Create broker if role is corretor
    if (role === 'corretor') {
      console.log('Ensuring broker entry...')
      const { data: existingBrokerByUserId } = await supabaseClient
        .from('brokers')
        .select('id')
        .eq('user_id', authData.user.id)
        .maybeSingle()

      const { data: existingBrokerByEmail } = await supabaseClient
        .from('brokers')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingBrokerByEmail && !existingBrokerByUserId) {
        // Broker exists with this email but linked to different/no user - update it
        const { error: brokerUpdateError } = await supabaseClient
          .from('brokers')
          .update({
            user_id: authData.user.id,
            name: resolvedName,
            phone: phone || null,
            team_id: team_id || null,
            company_id: targetCompanyId || null,
            status: status || 'ativo',
          })
          .eq('id', existingBrokerByEmail.id)

        if (brokerUpdateError) {
          console.error('Broker update error:', brokerUpdateError)
          await supabaseClient.from('user_roles').delete().eq('user_id', authData.user.id)
          await supabaseClient.from('profiles').delete().eq('id', authData.user.id)
          await supabaseClient.auth.admin.deleteUser(authData.user.id)
          throw new Error(`❌ Erro ao vincular corretor existente: ${brokerUpdateError.message}`)
        }
        console.log('Existing broker linked to new user successfully')
      } else if (!existingBrokerByUserId && !existingBrokerByEmail) {
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
            team_id: team_id || null,
            company_id: targetCompanyId || null,
            created_by: createdByUserId
          })

        if (brokerInsertError) {
          console.error('Broker creation error:', brokerInsertError)
          await supabaseClient.from('user_roles').delete().eq('user_id', authData.user.id)
          await supabaseClient.from('profiles').delete().eq('id', authData.user.id)
          await supabaseClient.auth.admin.deleteUser(authData.user.id)
          throw new Error(`❌ Erro ao criar corretor: ${brokerInsertError.message}`)
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
        message: '✅ Usuário criado com sucesso!',
        user: { 
          id: authData.user.id, 
          email, 
          full_name: resolvedName, 
          role,
          allowed_screens: finalAllowedScreens
        } 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 
      }
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    
    // Map errors to safe client messages
    const msg = error.message || '';
    let clientMessage = 'Falha ao criar usuário';
    if (msg.includes('already') || msg.includes('duplicate')) clientMessage = 'Este email já está em uso';
    else if (msg.includes('Unauthorized') || msg.includes('Não autorizado')) clientMessage = 'Acesso não autorizado';
    else if (msg.includes('senha') || msg.includes('Password') || msg.includes('password')) clientMessage = msg;
    else if (msg.includes('Cargo') || msg.includes('cargo') || msg.includes('Gerentes')) clientMessage = msg;
    else if (msg.startsWith('❌')) clientMessage = msg;
    
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})