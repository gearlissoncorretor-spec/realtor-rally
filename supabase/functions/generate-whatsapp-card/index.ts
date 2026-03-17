import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const {
      cardType = "goal", // "goal" | "ranking" | "sale"
      brokerName,
      goalTitle,
      currentValue,
      targetValue,
      motivationalPhrase,
      // ranking fields
      position,
      totalSales,
      vgv,
      // sale fields
      clientName,
      propertyValue,
      propertyType,
    } = await req.json();

    const fmtBRL = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

    let prompt = "";

    if (cardType === "goal") {
      const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
      const remaining = Math.max(targetValue - currentValue, 0);

      prompt = `Create a modern, impactful and motivational image for a real estate broker.

Style: technological, clean, premium, with dark blue and black colors (high-performance CRM / SaaS style).
Format: square (1:1), ideal for sending on WhatsApp.
Background: dark blue gradient with subtle lighting and subtle growth elements (ascending graphs, buildings, digital lines).

Visual elements:
- progress bar or circle highlighting ${percentage.toFixed(0)}%
- minimalist and professional design

Text in the image (ALL IN PORTUGUESE):

${brokerName || "Corretor"},

Falta apenas ${fmtBRL(remaining)}
para bater a meta:

${goalTitle}

Progresso:
${fmtBRL(currentValue)} / ${fmtBRL(targetValue)}
(${percentage.toFixed(0)}%)

Frase motivacional (destaque):
"${motivationalPhrase}"

Rodapé: Axis CRM

Rules:
- visually highlight the remaining value
- highlight the percentage
- strong and modern typography
- clear visual hierarchy
- do not clutter the image`;

    } else if (cardType === "ranking") {
      const medal = position === 1 ? "🥇 1º Lugar" : position === 2 ? "🥈 2º Lugar" : position === 3 ? "🥉 3º Lugar" : `#${position}`;

      prompt = `Create a modern, impactful and celebratory image for a real estate broker ranking.

Style: technological, premium, with dark blue, gold and black colors (high-performance SaaS style).
Format: square (1:1), ideal for sending on WhatsApp.
Background: dark blue/black gradient with gold accents, subtle trophy/crown elements.

Visual elements:
- trophy or medal icon
- position highlight: ${medal}
- minimalist and professional design

Text in the image (ALL IN PORTUGUESE):

🏆 RANKING SEMANAL

${medal}
${brokerName}

${totalSales} vendas
VGV: ${fmtBRL(vgv || 0)}

"${motivationalPhrase}"

Rodapé: Axis CRM

Rules:
- highlight the position and broker name prominently
- gold/amber accents for winners
- strong and modern typography
- clear visual hierarchy`;

    } else if (cardType === "sale") {
      prompt = `Create a modern, celebratory image for a real estate sale achievement.

Style: technological, premium, with dark blue, emerald green and black colors (high-performance SaaS style).
Format: square (1:1), ideal for sending on WhatsApp.
Background: dark gradient with emerald/green accents, subtle celebration elements (confetti, sparkles).

Visual elements:
- celebration icons
- property value prominently displayed
- minimalist and professional design

Text in the image (ALL IN PORTUGUESE):

🎉 VENDA FECHADA!

Corretor: ${brokerName}
Cliente: ${clientName}
${propertyType ? `Tipo: ${propertyType}` : ""}
Valor: ${fmtBRL(propertyValue || 0)}

"${motivationalPhrase}"

Rodapé: Axis CRM

Rules:
- highlight the sale value prominently
- emerald/green celebratory accents
- strong and modern typography
- clear visual hierarchy`;
    }

    console.log(`Generating WhatsApp card image (type: ${cardType})...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

    let response: Response;
    try {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
          signal: controller.signal,
        }
      );
    } catch (abortErr) {
      clearTimeout(timeout);
      console.error("AI gateway timeout or fetch error:", abortErr);
      return new Response(
        JSON.stringify({ error: "Timeout ao gerar imagem. Tente novamente." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Falha ao gerar imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const base64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Url) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem gerada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload to Supabase storage for a public URL
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract base64 data
    const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `whatsapp-cards/${cardType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("media")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Fallback: return base64
      return new Response(
        JSON.stringify({ imageUrl: base64Url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("media")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ imageUrl: publicUrlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-whatsapp-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
