import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization header ausente ou inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify requester identity
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.slice('Bearer '.length).trim();
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    const requesterId = claimsData?.claims?.sub;

    if (claimsError || !requesterId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions
    const [adminRole, diretorRole, gerenteRole, superAdminRole] = await Promise.all([
      adminClient.rpc('has_role', { _user_id: requesterId, _role: 'admin' }),
      adminClient.rpc('has_role', { _user_id: requesterId, _role: 'diretor' }),
      adminClient.rpc('has_role', { _user_id: requesterId, _role: 'gerente' }),
      adminClient.rpc('is_super_admin', { _user_id: requesterId }),
    ]);

    if (!adminRole.data && !diretorRole.data && !gerenteRole.data && !superAdminRole.data) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para alterar email' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      return new Response(
        JSON.stringify({ error: 'userId and newEmail are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update auth email
    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true,
    });

    if (authUpdateError) {
      console.error('Error updating auth email:', authUpdateError);
      return new Response(
        JSON.stringify({ error: authUpdateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sync to profiles table
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile email:', profileError);
    }

    // Sync to brokers table (if linked)
    const { error: brokerError } = await adminClient
      .from('brokers')
      .update({ email: newEmail })
      .eq('user_id', userId);

    if (brokerError) {
      console.error('Error updating broker email:', brokerError);
    }

    console.log('Email updated successfully', {
      requesterId,
      targetUserId: userId,
      newEmail,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Email atualizado com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating email:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
