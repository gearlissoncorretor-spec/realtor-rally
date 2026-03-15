import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_name, phone, primary_color } = await req.json();

    if (!company_name?.trim()) {
      return new Response(JSON.stringify({ error: "Nome da empresa é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if user already has a company
    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      return new Response(JSON.stringify({ error: "Usuário já possui uma empresa vinculada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create company
    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({ name: company_name.trim(), status: "ativo", max_users: 10 })
      .select()
      .single();

    if (companyError) throw companyError;

    // 2. Create organization_settings
    await adminClient.from("organization_settings").insert({
      company_id: company.id,
      organization_name: company_name.trim(),
      primary_color: primary_color || "#3b82f6",
      created_by: user.id,
    });

    // 3. Update profile with company_id
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        company_id: company.id,
        approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        allowed_screens: [
          "dashboard", "vendas", "corretores", "ranking", "acompanhamento",
          "relatorios", "configuracoes", "equipes", "metas", "central-gestor",
          "tarefas-kanban", "atividades", "negociacoes", "follow-up",
          "meta-gestao", "agenda", "instalar", "gestao-usuarios", "comissoes",
          "dashboard-equipes", "x1",
        ],
      })
      .eq("id", user.id);

    if (profileError) throw profileError;

    // 4. Delete existing role and assign 'admin'
    await adminClient.from("user_roles").delete().eq("user_id", user.id);
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: user.id, role: "admin" });

    if (roleError) throw roleError;

    return new Response(JSON.stringify({ company }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("setup-company error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
