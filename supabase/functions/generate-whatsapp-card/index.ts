import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Brand palette (My Broker style)
const BRAND = {
  blueDeep: "#002880",
  gold: "#fece02",
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
      cardType = "sale", // "goal" | "ranking" | "sale"
      brokerName,
      goalTitle,
      currentValue,
      targetValue,
      motivationalPhrase,
      position,
      totalSales,
      vgv,
      clientName,
      propertyValue,
      propertyType,
      logoUrl,          // organization logo (referência)
      brokerPhotoUrl,   // foto do corretor (referência)
    } = await req.json();

    const fmtBRL = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

    // ─── Build prompt ──────────────────────────────────────────────
    let prompt = "";

    const brandBlock = `
Brand palette (STRICT — use these exact colors):
- Deep royal blue background: ${BRAND.blueDeep}
- Gold accents / script highlight: ${BRAND.gold}
- Secondary: pure white (#FFFFFF)

Overall style: premium real estate marketing card, 1:1 square (1024x1024).
Background: deep royal blue (${BRAND.blueDeep}) gradient with subtle diagonal gold light rays and elegant thin gold geometric line accents on the sides.
Bottom edge: two flowing gold wave lines (thin + thick).
Composition: LEFT side = big typography stacked; RIGHT side = person portrait cut out cleanly. No overlap between text and face.
Typography: elegant gold script font for the highlighted word + bold clean uppercase sans-serif in white for the rest.
Logo: place provided logo image at the TOP-LEFT corner, small, clean, do NOT redraw or invent a logo. If a reference image labeled LOGO is provided, integrate it as-is.
Person: use the provided reference photo as the broker portrait on the right. Keep face clean and realistic. If no photo reference, show a professional silhouette of a real estate broker.
NO fake text, NO watermarks, NO placeholder brand names other than what's in the logo image.
`;

    if (cardType === "sale") {
      prompt = `Create a premium celebratory real estate sales card.

${brandBlock}

Text to render in the image (Portuguese, EXACT copy, keep hierarchy):

Top-left: (integrate the logo image reference here)

Main title stack (left side, huge):
- "Parabéns" — gold elegant SCRIPT font, large, with subtle sparkles/stars around it
- "PELA" — white bold uppercase, medium size
- "VENDA" — white bold uppercase, MASSIVE (biggest element)

Below the title, a thin horizontal gold divider with a diamond in the middle.

CTA pill button (gold outline, dark blue fill, gold text):
"→  VAMOS PARA A PRÓXIMA?"

Small caption above CTA (white, subtle):
"${brokerName || "Corretor"} • Cliente: ${clientName || "-"}${propertyValue ? " • " + fmtBRL(propertyValue) : ""}"

Bottom row: three gold outlined diamond icons with labels underneath in white uppercase letter-spacing:
"FOCO"     "DISCIPLINA"     "RESULTADO"

Rules:
- Follow the reference image style (My Broker celebratory sale card): royal blue + gold, portrait right, typography left
- Sharp, crisp text — no misspellings, no gibberish
- Do NOT add any other text, tagline, or watermark
- Do NOT crop or clip the typography — keep safe margins`;
    } else if (cardType === "goal") {
      const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
      const remaining = Math.max(targetValue - currentValue, 0);

      prompt = `Create a premium motivational goal card for a real estate broker.

${brandBlock}

Text to render (Portuguese, EXACT copy):

Top-left: (integrate the logo image reference here)

Main title stack (left, huge):
- "Faltam" — gold script font, large
- "APENAS" — white uppercase bold
- "${fmtBRL(remaining)}" — MASSIVE white
- Small line: "para bater a meta"

Goal name (gold, medium):
"${goalTitle || ""}"

Progress: elegant thin gold circular ring showing ${percentage.toFixed(0)}% with the number in white in the center.

Small caption:
"${brokerName || "Corretor"} • ${fmtBRL(currentValue)} / ${fmtBRL(targetValue)}"

Bottom three diamond icons: "FOCO"  "DISCIPLINA"  "RESULTADO"

Motivational phrase in white italic small text at bottom above the diamonds:
"${motivationalPhrase || ""}"

Rules: same brand rules as sale card. No fake text.`;
    } else if (cardType === "ranking") {
      const medalWord = position === 1 ? "CAMPEÃO" : position === 2 ? "VICE" : position === 3 ? "TOP 3" : `TOP ${position}`;
      prompt = `Create a premium ranking podium card for a real estate broker.

${brandBlock}

Text to render (Portuguese, EXACT copy):

Top-left: (integrate the logo image reference here)

Main title stack (left, huge):
- "RANKING" — gold script font
- "${medalWord}" — MASSIVE white bold uppercase
- Small: "#${position || 1} lugar"

Broker: "${brokerName}" — white bold, large.

Stats block (gold outlined pill):
"${totalSales || 0} vendas  •  ${fmtBRL(vgv || 0)}"

Motivational phrase in italic white:
"${motivationalPhrase || ""}"

Bottom three diamond icons: "FOCO"  "DISCIPLINA"  "RESULTADO"

Right side: broker portrait from the provided reference photo.

Rules: same brand rules. No fake text.`;
    }

    // ─── Build multimodal message content ──────────────────────────
    const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];

    if (logoUrl) {
      content.push({ type: "text", text: "LOGO reference (integrate at top-left, keep colors and shape exactly as-is):" });
      content.push({ type: "image_url", image_url: { url: logoUrl } });
    }
    if (brokerPhotoUrl) {
      content.push({ type: "text", text: "BROKER PORTRAIT reference (use as the person on the right side):" });
      content.push({ type: "image_url", image_url: { url: brokerPhotoUrl } });
    }

    console.log(`Generating WhatsApp card image (type: ${cardType}, model: gemini-3-pro-image, refs: logo=${!!logoUrl} photo=${!!brokerPhotoUrl})`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 90s — Pro is slower

    let response: Response;
    try {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
            messages: [{ role: "user", content }],
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
          JSON.stringify({ error: "Rate limit atingido. Tente novamente em alguns segundos." }),
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
        JSON.stringify({ error: "Falha ao gerar imagem", details: errorText.slice(0, 300) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    // /v1/images/generations returns { data: [{ b64_json }] }
    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem gerada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const imageBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const fileName = `whatsapp-cards/${cardType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("media")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ imageUrl: `data:image/png;base64,${b64}` }),
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
