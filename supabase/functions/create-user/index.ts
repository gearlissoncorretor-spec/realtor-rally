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

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      throw new Error('Unauthorized: Only admins can create users')
    }

    // Get request body
    const { full_name, email, password, role, allowed_screens, team_id } = await req.json()

    // Validate required fields
    if (!full_name || !email || !password || !role || !allowed_screens || allowed_screens.length === 0) {
      throw new Error('Missing required fields')
    }

    // Validate manager has team
    if (role === 'gerente' && !team_id) {
      throw new Error('Managers must be assigned to a team')
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Create profile
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
      // If profile creation fails, delete the auth user
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw profileInsertError
    }

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})