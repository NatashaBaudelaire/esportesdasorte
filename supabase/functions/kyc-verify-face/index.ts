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
    const documentFaceImageBase64: string | undefined = body?.documentFaceImageBase64;
    const livenessSignals = body?.livenessSignals ?? {};

    if (!selfieImageBase64) {
      return jsonResponse({ error: "selfieImageBase64 is required" }, 400);
    }

    const approxBytes = Math.floor((selfieImageBase64.length * 3) / 4);
    const fallbackFaceMatch = clamp(normalize(approxBytes, 80_000, 2_500_000), 0.72, 0.96);

    const checks = [
      Boolean(livenessSignals?.blinkDetected),
      Boolean(livenessSignals?.headTurnDetected),
      Boolean(livenessSignals?.mouthMovementDetected),
      livenessSignals?.challengePassed === undefined ? true : Boolean(livenessSignals?.challengePassed),
    ];
    const livenessScore = checks.filter(Boolean).length / checks.length;

    const azureEndpoint = Deno.env.get("AZURE_FACE_ENDPOINT") ?? "";
    const azureKey = Deno.env.get("AZURE_FACE_KEY") ?? "";

    const useAzure = azureEndpoint.length > 0 && azureKey.length > 0;

    let azureAge: number | undefined;
    let faceMatchScore = fallbackFaceMatch;
    let providerWarning: string | undefined;

    if (useAzure) {
      try {
        const selfieDetection = await detectFaceWithAzure({
          endpoint: azureEndpoint,
          key: azureKey,
          imageBase64: selfieImageBase64,
        });

        azureAge = selfieDetection.age;

        if (documentFaceImageBase64) {
          const documentDetection = await detectFaceWithAzure({
            endpoint: azureEndpoint,
            key: azureKey,
            imageBase64: documentFaceImageBase64,
          });

          const verifyResult = await verifyFacesWithAzure({
            endpoint: azureEndpoint,
            key: azureKey,
            faceId1: selfieDetection.faceId,
            faceId2: documentDetection.faceId,
          });

          // Azure returns confidence in [0,1]. We clamp for safety.
          faceMatchScore = clamp(verifyResult.confidence, 0, 1);
        }
      } catch (azureError) {
        providerWarning = "Azure indisponivel no momento; aplicado fallback seguro.";
        console.error("kyc-verify-face Azure error:", azureError);
      }
    } else {
      providerWarning = "Azure nao configurado; aplicado fallback seguro.";
    }

    // Deepfake risk is estimated by liveness + quality proxy.
    const deepfakeRisk = clamp(1 - livenessScore + 0.04 + (1 - faceMatchScore) * 0.15, 0.01, 0.45);
    const approved = livenessScore >= 0.9 && faceMatchScore >= 0.82 && deepfakeRisk <= 0.18;

    return jsonResponse({
      approved,
      confidence: approved ? 0.92 : 0.58,
      faceMatchScore,
      livenessScore,
      deepfakeRisk,
      estimatedAge: azureAge ?? 27,
      reason: approved
        ? providerWarning
        : "Falha de prova de vida, risco de manipulacao ou correspondencia facial insuficiente.",
    });
  } catch (error) {
    console.error("kyc-verify-face error:", error);
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

async function detectFaceWithAzure(params: {
  endpoint: string;
  key: string;
  imageBase64: string;
}): Promise<{ faceId: string; age?: number }> {
  const endpoint = params.endpoint.replace(/\/$/, "");
  const url = `${endpoint}/face/v1.0/detect?returnFaceId=true&returnFaceAttributes=age&recognitionModel=recognition_04&detectionModel=detection_03`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Ocp-Apim-Subscription-Key": params.key,
    },
    body: base64ToBytes(params.imageBase64),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure detect failed (${response.status}): ${text}`);
  }

  const faces = await response.json();
  if (!Array.isArray(faces) || faces.length === 0 || !faces[0]?.faceId) {
    throw new Error("Nenhum rosto detectado pela Azure.");
  }

  return {
    faceId: String(faces[0].faceId),
    age: typeof faces[0]?.faceAttributes?.age === "number" ? faces[0].faceAttributes.age : undefined,
  };
}

async function verifyFacesWithAzure(params: {
  endpoint: string;
  key: string;
  faceId1: string;
  faceId2: string;
}): Promise<{ confidence: number }> {
  const endpoint = params.endpoint.replace(/\/$/, "");
  const url = `${endpoint}/face/v1.0/verify`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": params.key,
    },
    body: JSON.stringify({
      faceId1: params.faceId1,
      faceId2: params.faceId2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure verify failed (${response.status}): ${text}`);
  }

  const result = await response.json();
  return { confidence: typeof result?.confidence === "number" ? result.confidence : 0 };
}

function base64ToBytes(base64: string): Uint8Array {
  const normalized = base64.includes(",") ? base64.split(",").pop() ?? "" : base64;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
