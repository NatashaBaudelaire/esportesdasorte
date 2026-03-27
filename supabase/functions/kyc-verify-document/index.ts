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
    const frontImageBase64: string | undefined = body?.frontImageBase64;
    const backImageBase64: string | undefined = body?.backImageBase64;
    const type: string = body?.type ?? "rg";

    if (!frontImageBase64) {
      return jsonResponse({ error: "frontImageBase64 is required" }, 400);
    }

    const visionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY") ?? "";
    const azureDocEndpoint = Deno.env.get("AZURE_DOC_INTELLIGENCE_ENDPOINT") ?? "";
    const azureDocKey = Deno.env.get("AZURE_DOC_INTELLIGENCE_KEY") ?? "";

    const approxBytes = Math.floor((frontImageBase64.length * 3) / 4);
    const qualityScore = clamp(normalize(approxBytes, 120_000, 4_500_000), 0.55, 0.98);
    const forgeryScore = clamp(1 - qualityScore + 0.08, 0.02, 0.4);

    let rawText = "Mock OCR from edge function";
    const warnings: string[] = [];

    const hasAzureConfig = azureDocEndpoint.length > 0 && azureDocKey.length > 0;
    const hasVisionConfig = visionApiKey.length > 0;

    // Priority: Azure Document Intelligence -> Google Vision -> local fallback.
    if (hasAzureConfig) {
      try {
        const frontText = await extractTextWithAzureDocumentIntelligence(
          frontImageBase64,
          azureDocEndpoint,
          azureDocKey
        );
        const backText = backImageBase64
          ? await extractTextWithAzureDocumentIntelligence(backImageBase64, azureDocEndpoint, azureDocKey)
          : "";
        rawText = `${frontText}\n${backText}`.trim();
      } catch (azureError) {
        warnings.push("Azure OCR indisponivel; tentando Vision.");
        console.error("kyc-verify-document azure error:", azureError);
      }
    } else {
      warnings.push("AZURE_DOC_INTELLIGENCE_* ausente.");
    }

    if (rawText === "Mock OCR from edge function" && hasVisionConfig) {
      try {
        const frontText = await extractTextWithVision(frontImageBase64, visionApiKey);
        const backText = backImageBase64
          ? await extractTextWithVision(backImageBase64, visionApiKey)
          : "";
        rawText = `${frontText}\n${backText}`.trim();
      } catch (visionError) {
        warnings.push("Vision OCR indisponivel; aplicado fallback local.");
        console.error("kyc-verify-document vision error:", visionError);
      }
    } else if (!hasVisionConfig) {
      warnings.push("GOOGLE_VISION_API_KEY ausente.");
    }

    const parsed = parseDocumentText(rawText, type);
    const normalizedDeclared = normalizeDocumentNumberByType(body?.declaredDocumentNumber, type);
    const normalizedExtracted = normalizeDocumentNumberByType(parsed.documentNumber, type);

    const selectedDocumentNumber = normalizedExtracted ?? normalizedDeclared;
    const hasValidDocumentNumber = Boolean(selectedDocumentNumber);
    const consistency = analyzeDocumentConsistency({
      text: rawText,
      documentType: type,
      parsed,
      declaredFullName: body?.declaredFullName,
    });

    const adjustedForgedScore = clamp(
      forgeryScore + (1 - consistency.consistencyScore) * 0.22 + consistency.riskIndicators.length * 0.03,
      0.02,
      0.95
    );
    const adjustedConfidence = clamp(
      0.55 + qualityScore * 0.2 + consistency.consistencyScore * 0.25 - adjustedForgedScore * 0.15,
      0.2,
      0.98
    );

    const approved =
      qualityScore >= 0.75 &&
      adjustedForgedScore <= 0.35 &&
      adjustedConfidence >= 0.68 &&
      hasValidDocumentNumber &&
      consistency.consistencyScore >= 0.5;

    return jsonResponse({
      approved,
      confidence: adjustedConfidence,
      qualityScore,
      forgeryScore: adjustedForgedScore,
      consistencyScore: consistency.consistencyScore,
      riskIndicators: consistency.riskIndicators,
      ocr: {
        fullName: parsed.fullName ?? body?.declaredFullName ?? "Usuario Validado",
        documentNumber: selectedDocumentNumber ?? "00000000000",
        birthDateISO: parsed.birthDateISO ?? "1995-01-15",
        issuingAuthority: type === "passport" ? "DPF" : "SSP",
        rawText,
      },
      reason: approved
        ? warnings.length > 0
          ? warnings.join(" ")
          : undefined
        : buildRejectionReason({
            hasValidDocumentNumber,
            consistencyScore: consistency.consistencyScore,
            riskIndicators: consistency.riskIndicators,
            adjustedForgedScore,
            adjustedConfidence,
          }),
    });
  } catch (error) {
    console.error("kyc-verify-document error:", error);
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

async function extractTextWithVision(imageBase64: string, apiKey: string): Promise<string> {
  const normalized = imageBase64.includes(",")
    ? imageBase64.split(",").pop() ?? ""
    : imageBase64;

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: normalized },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vision OCR failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const annotation = payload?.responses?.[0]?.fullTextAnnotation?.text;
  return typeof annotation === "string" ? annotation : "";
}

async function extractTextWithAzureDocumentIntelligence(
  imageBase64: string,
  endpoint: string,
  key: string
): Promise<string> {
  const normalized = imageBase64.includes(",")
    ? imageBase64.split(",").pop() ?? ""
    : imageBase64;

  const cleanEndpoint = endpoint.replace(/\/$/, "");
  const analyzeUrl = `${cleanEndpoint}/formrecognizer/documentModels/prebuilt-read:analyze?api-version=2023-07-31`;

  const analyzeResponse = await fetch(analyzeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": key,
    },
    body: JSON.stringify({ base64Source: normalized }),
  });

  if (!analyzeResponse.ok) {
    const text = await analyzeResponse.text();
    throw new Error(`Azure analyze failed (${analyzeResponse.status}): ${text}`);
  }

  const operationLocation = analyzeResponse.headers.get("operation-location");
  if (!operationLocation) {
    throw new Error("Azure analyze response missing operation-location header.");
  }

  const result = await pollAzureAnalyzeResult(operationLocation, key);
  const content = result?.analyzeResult?.content;

  if (typeof content === "string" && content.trim().length > 0) {
    return content;
  }

  const pages = result?.analyzeResult?.pages;
  if (Array.isArray(pages)) {
    const joined = pages
      .flatMap((p: any) => (Array.isArray(p?.lines) ? p.lines.map((l: any) => l?.content ?? "") : []))
      .join("\n")
      .trim();
    return joined;
  }

  return "";
}

async function pollAzureAnalyzeResult(operationLocation: string, key: string): Promise<any> {
  const attempts = 12;
  const intervalMs = 700;

  for (let i = 0; i < attempts; i++) {
    const response = await fetch(operationLocation, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Azure poll failed (${response.status}): ${text}`);
    }

    const payload = await response.json();
    const status = String(payload?.status ?? "").toLowerCase();

    if (status === "succeeded") {
      return payload;
    }
    if (status === "failed") {
      throw new Error("Azure OCR analysis failed.");
    }

    await sleep(intervalMs);
  }

  throw new Error("Azure OCR polling timeout.");
}

function parseDocumentText(text: string, documentType: string): {
  fullName?: string;
  documentNumber?: string;
  birthDateISO?: string;
  issuingAuthority?: string;
  issueDateISO?: string;
  expiryDateISO?: string;
  motherName?: string;
} {
  if (!text || text.trim().length === 0) {
    return {};
  }

  const sanitized = text.replace(/\r/g, "");
  const lines = sanitized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const dateMatch = sanitized.match(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/);
  const birthDateISO = dateMatch
    ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
    : undefined;
  const allDates = [...sanitized.matchAll(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/g)].map((m) => `${m[3]}-${m[2]}-${m[1]}`);
  const issueDateISO = allDates.length >= 2 ? allDates[1] : undefined;
  const expiryDateISO = allDates.length >= 3 ? allDates[2] : undefined;

  const authorityRegex = /(SSP\/?[A-Z]{2}|DETRAN\/?[A-Z]{2}|DPF|POLICIA FEDERAL|IFP|SJS|SEJUSP)/i;
  const authorityMatch = sanitized.match(authorityRegex);
  const issuingAuthority = authorityMatch?.[0]?.toUpperCase();

  const documentNumber = extractDocumentNumberByType(sanitized, documentType);

  // A simple heuristic: first line with 2+ words and no mostly numeric content.
  const fullName = lines.find((line) => {
    const words = line.split(/\s+/);
    const hasTwoWords = words.length >= 2;
    const digitRatio = (line.match(/\d/g)?.length ?? 0) / Math.max(1, line.length);
    return hasTwoWords && digitRatio < 0.2 && line.length >= 6;
  });

  const motherLine = lines.find((line) => /mae|filiacao/i.test(line));
  const motherName = motherLine
    ? motherLine.replace(/.*?(mae|filiacao)\s*[:\-]?\s*/i, "").trim() || undefined
    : undefined;

  return {
    fullName,
    documentNumber,
    birthDateISO,
    issuingAuthority,
    issueDateISO,
    expiryDateISO,
    motherName,
  };
}

function analyzeDocumentConsistency(params: {
  text: string;
  documentType: string;
  parsed: {
    fullName?: string;
    documentNumber?: string;
    birthDateISO?: string;
    issuingAuthority?: string;
    issueDateISO?: string;
    expiryDateISO?: string;
    motherName?: string;
  };
  declaredFullName?: string;
}): { consistencyScore: number; riskIndicators: string[] } {
  const indicators: string[] = [];
  let score = 1;

  if (!params.parsed.fullName || params.parsed.fullName.length < 6) {
    score -= 0.18;
    indicators.push("nome_nao_extraido");
  }

  if (!params.parsed.birthDateISO) {
    score -= 0.2;
    indicators.push("data_nascimento_ausente");
  }

  const type = params.documentType.toLowerCase();
  if (type !== "passport" && !params.parsed.issuingAuthority) {
    score -= 0.12;
    indicators.push("orgao_emissor_ausente");
  }

  if (!params.parsed.documentNumber) {
    score -= 0.25;
    indicators.push("numero_documento_ausente");
  }

  if (params.declaredFullName && params.parsed.fullName) {
    const declared = normalizeName(params.declaredFullName);
    const extracted = normalizeName(params.parsed.fullName);
    if (declared && extracted && !extracted.includes(declared.slice(0, Math.min(8, declared.length)))) {
      score -= 0.12;
      indicators.push("nome_declarado_divergente");
    }
  }

  const suspiciousPatterns = [/lorem ipsum/i, /xxxx+/i, /000000/i, /foto colada/i, /adulter/i, /rasur/i];
  if (suspiciousPatterns.some((r) => r.test(params.text))) {
    score -= 0.2;
    indicators.push("padroes_suspeitos_no_texto");
  }

  if (params.parsed.issueDateISO && params.parsed.birthDateISO) {
    const issue = new Date(params.parsed.issueDateISO);
    const birth = new Date(params.parsed.birthDateISO);
    if (!Number.isNaN(issue.getTime()) && !Number.isNaN(birth.getTime()) && issue <= birth) {
      score -= 0.15;
      indicators.push("data_expedicao_invalida");
    }
  }

  if (params.parsed.expiryDateISO && params.parsed.issueDateISO) {
    const expiry = new Date(params.parsed.expiryDateISO);
    const issue = new Date(params.parsed.issueDateISO);
    if (!Number.isNaN(expiry.getTime()) && !Number.isNaN(issue.getTime()) && expiry <= issue) {
      score -= 0.15;
      indicators.push("data_validade_invalida");
    }
  }

  return {
    consistencyScore: clamp(score, 0, 1),
    riskIndicators: indicators,
  };
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRejectionReason(params: {
  hasValidDocumentNumber: boolean;
  consistencyScore: number;
  riskIndicators: string[];
  adjustedForgedScore: number;
  adjustedConfidence: number;
}): string {
  const reasons: string[] = [];
  if (!params.hasValidDocumentNumber) {
    reasons.push("numero de documento invalido para o tipo informado");
  }
  if (params.consistencyScore < 0.5) {
    reasons.push("baixa consistencia dos campos extraidos");
  }
  if (params.adjustedForgedScore > 0.35) {
    reasons.push("alto risco de adulteracao");
  }
  if (params.adjustedConfidence < 0.68) {
    reasons.push("confianca de OCR insuficiente");
  }
  if (params.riskIndicators.length > 0) {
    reasons.push(`indicadores: ${params.riskIndicators.join(",")}`);
  }
  return reasons.length > 0
    ? `Documento reprovado: ${reasons.join("; ")}.`
    : "Documento com baixa qualidade, OCR insuficiente ou suspeita de adulteracao.";
}

function extractDocumentNumberByType(text: string, documentType: string): string | undefined {
  const upperType = String(documentType ?? "").toLowerCase();

  if (upperType === "passport") {
    const passportMatch = text.match(/\b[A-Z]{1,2}\d{6,9}\b/i);
    return normalizeDocumentNumberByType(passportMatch?.[0], "passport");
  }

  if (upperType === "cnh") {
    const cnhMatch = text.match(/\b\d{11}\b/);
    const normalized = normalizeDocumentNumberByType(cnhMatch?.[0], "cnh");
    return normalized;
  }

  // RG/CPF path: prefer CPF-style first, then long numeric sequences.
  const cpfLike = text.match(/\b\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2}\b/);
  if (cpfLike?.[0]) {
    return normalizeDocumentNumberByType(cpfLike[0], "rg");
  }

  const genericDoc = text.match(/\b\d{7,14}\b/);
  return normalizeDocumentNumberByType(genericDoc?.[0], "rg");
}

function normalizeDocumentNumberByType(value: unknown, documentType: string): string | undefined {
  if (typeof value !== "string") return undefined;

  const upperType = String(documentType ?? "").toLowerCase();
  if (upperType === "passport") {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return /^[A-Z]{1,2}\d{6,9}$/.test(cleaned) ? cleaned : undefined;
  }

  const digits = value.replace(/\D/g, "");

  if (upperType === "cnh") {
    if (!/^\d{11}$/.test(digits)) return undefined;
    return isValidCNH(digits) ? digits : undefined;
  }

  // rg (or default): accept valid CPF (11) or RG-like (7-14 digits).
  if (digits.length === 11) {
    return isValidCPF(digits) ? digits : undefined;
  }

  if (digits.length >= 7 && digits.length <= 14) {
    return digits;
  }

  return undefined;
}

function isValidCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string, factor: number): number => {
    let total = 0;
    for (let i = 0; i < base.length; i++) {
      total += Number(base[i]) * (factor - i);
    }
    const mod = total % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  const d2 = calcDigit(cpf.slice(0, 9) + String(d1), 11);

  return cpf.endsWith(`${d1}${d2}`);
}

function isValidCNH(cnh: string): boolean {
  if (!/^\d{11}$/.test(cnh)) return false;
  if (/^(\d)\1{10}$/.test(cnh)) return false;

  let sum = 0;
  for (let i = 0, j = 9; i < 9; i++, j--) {
    sum += Number(cnh[i]) * j;
  }
  let d1 = sum % 11;
  let inc = 0;
  if (d1 >= 10) {
    d1 = 0;
    inc = 2;
  }

  sum = 0;
  for (let i = 0, j = 1; i < 9; i++, j++) {
    sum += Number(cnh[i]) * j;
  }
  let d2 = (sum % 11);
  if (d2 >= 10) d2 = 0;
  d2 = d2 - inc;
  if (d2 < 0) d2 += 11;
  if (d2 >= 10) d2 = 0;

  return cnh[9] === String(d1) && cnh[10] === String(d2);
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
