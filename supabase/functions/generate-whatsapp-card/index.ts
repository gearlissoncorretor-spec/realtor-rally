import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      brokerName,
      goalTitle,
      currentValue,
      targetValue,
      motivationalPhrase,
    } = await req.json();

    const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
    const remaining = Math.max(targetValue - currentValue, 0);

    const fmtBRL = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

    const prompt = `Create a modern, impactful and motivational image for a real estate broker.

Style:
technological, clean, premium, with dark blue and black colors (high-performance CRM / SaaS style).

Format:
square (1:1), ideal for sending on WhatsApp.

Background:
dark blue gradient with subtle lighting and subtle growth elements (ascending graphs, buildings, digital lines).

Visual elements:
- progress bar or circle highlighting ${percentage.toFixed(0)}%
- minimalist and professional design

Text in the image (in Portuguese):

${brokerName},

Falta apenas ${fmtBRL(remaining)}
para bater a meta:

${goalTitle}

Progresso:
${fmtBRL(currentValue)} / ${fmtBRL(targetValue)}
(${percentage.toFixed(0)}%)

Motivational phrase (highlight):
"${motivationalPhrase}"

Small footer:
Axis CRM

Rules:
- visually highlight the remaining value (${fmtBRL(remaining)})
- highlight the percentage
- strong and modern typography
- keep clear visual organization and hierarchy
- do not clutter the image
- ALL TEXT MUST BE IN PORTUGUESE (Brazilian Portuguese)

Goal:
generate urgency, focus and emotional encouragement for the broker to hit the goal.`;

    console.log("Generating WhatsApp card image...");

    const response = await fetch(
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
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-whatsapp-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
