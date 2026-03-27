import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const body = await req.json();
    const birthDateISO: string | undefined = body?.birthDateISO;

    let estimatedAge = 26;
    if (birthDateISO) {
      estimatedAge = computeAgeFromISO(birthDateISO);
    }

    const isAdult = estimatedAge >= 18;

    return jsonResponse({
      approved: isAdult,
      confidence: 0.9,
      estimatedAge,
      isAdult,
      reason: isAdult ? undefined : "Idade estimada menor que 18 anos.",
    });
  } catch (error) {
    console.error("kyc-verify-age error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function computeAgeFromISO(isoDate: string): number {
  const birthDate = new Date(isoDate);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDelta = now.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
