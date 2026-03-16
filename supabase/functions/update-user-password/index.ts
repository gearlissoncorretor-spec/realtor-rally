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

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
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

    const [adminRole, diretorRole, gerenteRole, superAdminRole] = await Promise.all([
      adminClient.rpc('has_role', { _user_id: requesterId, _role: 'admin' }),
      adminClient.rpc('has_role', { _user_id: requesterId, _role: 'diretor' }),
      adminClient.rpc('has_role', { _user_id: requesterId, _role: 'gerente' }),
      adminClient.rpc('is_super_admin', { _user_id: requesterId }),
    ]);

    if (!adminRole.data && !diretorRole.data && !gerenteRole.data && !superAdminRole.data) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para resetar senhas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, password } = await req.json();

    if (!userId || !password) {
      return new Response(
        JSON.stringify({ error: 'userId and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: targetUserData, error: targetUserError } = await adminClient.auth.admin.getUserById(userId);

    if (targetUserError || !targetUserData.user) {
      return new Response(
        JSON.stringify({ error: 'Usuário alvo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatedUserMetadata = {
      ...(targetUserData.user.user_metadata ?? {}),
      must_change_password: true,
      temp_password_set_at: new Date().toISOString(),
    };

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password,
      user_metadata: updatedUserMetadata,
    });

    if (updateError) {
      throw updateError;
    }

    console.log('Temporary password updated', {
      requesterId,
      targetUserId: userId,
      targetEmail: targetUserData.user.email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password updated successfully',
        email: targetUserData.user.email,
        mustChangePassword: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating password:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});