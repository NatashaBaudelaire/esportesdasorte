// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const selfieImageBase64: string | undefined = body?.selfieImageBase64;

    if (!selfieImageBase64) {
      return jsonResponse({ error: "selfieImageBase64 is required" }, 400);
    }

    const deepfakeApiUrl = Deno.env.get("DEEPFAKE_API_URL") ?? "";
    const deepfakeApiKey = Deno.env.get("DEEPFAKE_API_KEY") ?? "";

    const approxBytes = Math.floor((selfieImageBase64.length * 3) / 4);
    const quality = clamp(normalize(approxBytes, 80_000, 2_500_000), 0, 1);
    let deepfakeProbability = clamp(0.25 - quality * 0.2, 0.01, 0.5);
    let providerWarning: string | undefined;

    if (deepfakeApiUrl) {
      try {
        const remoteProbability = await runDeepfakeProvider({
          apiUrl: deepfakeApiUrl,
          apiKey: deepfakeApiKey,
          imageBase64: selfieImageBase64,
        });
        deepfakeProbability = clamp(remoteProbability, 0, 1);
      } catch (providerError) {
        providerWarning = "Provider deepfake indisponivel; aplicado fallback local.";
        console.error("kyc-detect-deepfake provider error:", providerError);
      }
    } else {
      providerWarning = "DEEPFAKE_API_URL ausente; aplicado fallback local.";
    }

    const approved = deepfakeProbability <= 0.18;

    return jsonResponse({
      approved,
      confidence: approved ? 0.9 : 0.6,
      deepfakeProbability,
      inconsistencies: approved
        ? []
        : ["padrao de textura inconsistente", "artefatos faciais em alta frequencia"],
      reason: approved ? providerWarning : "Risco elevado de deepfake/manipulacao.",
    });
  } catch (error) {
    console.error("kyc-detect-deepfake error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function normalize(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function runDeepfakeProvider(params: {
  apiUrl: string;
  apiKey: string;
  imageBase64: string;
}): Promise<number> {
  const response = await fetch(params.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.apiKey ? { Authorization: `Bearer ${params.apiKey}` } : {}),
    },
    body: JSON.stringify({ imageBase64: params.imageBase64 }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Deepfake provider failed (${response.status}): ${text}`);
  }

  const payload = await response.json();

  // Accept different provider schemas.
  if (typeof payload?.deepfakeProbability === "number") {
    return payload.deepfakeProbability;
  }
  if (typeof payload?.probability === "number") {
    return payload.probability;
  }
  if (typeof payload?.score === "number") {
    return payload.score;
  }

  throw new Error("Deepfake provider response does not contain a supported score field.");
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
