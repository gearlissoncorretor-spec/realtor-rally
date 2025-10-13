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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      console.error('Unauthorized access attempt by:', user.id)
      throw new Error('Unauthorized: Only admins can create users')
    }

    // Get request body
    const { full_name, email, password, role, allowed_screens, team_id } = await req.json()
    console.log('Creating user:', { email, role, team_id, allowed_screens })

    // Validate required fields
    if (!full_name || !email || !password || !role || !allowed_screens || allowed_screens.length === 0) {
      console.error('Missing required fields')
      throw new Error('Missing required fields')
    }

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
      throw authError
    }
    if (!authData.user) {
      console.error('User creation failed - no user returned')
      throw new Error('User creation failed')
    }

    console.log('User created in auth:', authData.user.id)

    // Create profile
    console.log('Creating profile...')
    const { error: profileInsertError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        role,
        allowed_screens,
        is_admin: role === 'diretor',
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