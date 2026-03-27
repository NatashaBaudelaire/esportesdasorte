import { supabase } from '@/integrations/supabase/client';

export type DocumentType = 'rg' | 'cnh' | 'passport';

export interface DocumentInput {
  type: DocumentType;
  frontImage: Blob;
  backImage?: Blob;
  declaredFullName?: string;
  declaredDocumentNumber?: string;
}

export interface OCRData {
  fullName?: string;
  documentNumber?: string;
  birthDateISO?: string;
  issuingAuthority?: string;
  rawText?: string;
}

export interface DocumentVerificationResult {
  approved: boolean;
  confidence: number;
  ocr: OCRData;
  qualityScore: number;
  forgeryScore: number;
  consistencyScore?: number;
  riskIndicators?: string[];
  reason?: string;
}

export interface LivenessSignals {
  blinkDetected: boolean;
  headTurnDetected: boolean;
  mouthMovementDetected: boolean;
  challengePassed?: boolean;
}

export interface FaceVerificationInput {
  selfieImage: Blob;
  documentFaceImage?: Blob;
  livenessSignals: LivenessSignals;
}

export interface FaceVerificationResult {
  approved: boolean;
  confidence: number;
  faceMatchScore: number;
  livenessScore: number;
  deepfakeRisk: number;
  estimatedAge?: number;
  reason?: string;
}

export interface DeepfakeVerificationResult {
  approved: boolean;
  confidence: number;
  deepfakeProbability: number;
  inconsistencies: string[];
  reason?: string;
}

export interface AgeVerificationResult {
  approved: boolean;
  confidence: number;
  estimatedAge: number;
  isAdult: boolean;
  reason?: string;
}

export interface KYCFinalResult {
  approved: boolean;
  document: DocumentVerificationResult;
  face: FaceVerificationResult;
  deepfake: DeepfakeVerificationResult;
  age: AgeVerificationResult;
  failureReasons: string[];
  completedAt: string;
}

export interface KYCProvider {
  verifyDocument(input: DocumentInput): Promise<DocumentVerificationResult>;
  verifyFace(input: FaceVerificationInput): Promise<FaceVerificationResult>;
  detectDeepfake(selfieImage: Blob): Promise<DeepfakeVerificationResult>;
  verifyAge(params: { selfieImage: Blob; birthDateISO?: string }): Promise<AgeVerificationResult>;
}

const KYC_THRESHOLDS = {
  minDocumentConfidence: 0.82,
  minFaceConfidence: 0.85,
  minFaceMatchScore: 0.82,
  minLivenessScore: 0.9,
  maxDeepfakeRisk: 0.18,
  maxForgeryScore: 0.2,
  minAgeConfidence: 0.8,
  minLegalAge: 18,
};

class MockKYCProvider implements KYCProvider {
  async verifyDocument(input: DocumentInput): Promise<DocumentVerificationResult> {
    await delay(300);

    const qualityScore = clamp(normalizeBlobSize(input.frontImage.size, 150_000, 4_500_000), 0.6, 0.98);
    const forgeryScore = clamp(1 - qualityScore + 0.08, 0.02, 0.35);

    const approved = qualityScore >= 0.75 && forgeryScore <= KYC_THRESHOLDS.maxForgeryScore;

    return {
      approved,
      confidence: approved ? 0.92 : 0.61,
      qualityScore,
      forgeryScore,
      consistencyScore: approved ? 0.9 : 0.55,
      riskIndicators: approved ? [] : ['mock_document_quality_low'],
      ocr: {
        fullName: input.declaredFullName ?? 'Usuário Validado',
        documentNumber: input.declaredDocumentNumber ?? '00000000000',
        birthDateISO: '1995-01-15',
        issuingAuthority: input.type === 'passport' ? 'DPF' : 'SSP',
        rawText: 'Mock OCR text',
      },
      reason: approved ? undefined : 'Qualidade do documento insuficiente ou suspeita de adulteração.',
    };
  }

  async verifyFace(input: FaceVerificationInput): Promise<FaceVerificationResult> {
    await delay(300);

    const livenessScore = computeLivenessFromSignals(input.livenessSignals);
    const faceMatchScore = clamp(normalizeBlobSize(input.selfieImage.size, 80_000, 2_500_000), 0.72, 0.96);
    const deepfakeRisk = clamp(1 - livenessScore + 0.04, 0.01, 0.4);

    const approved =
      livenessScore >= KYC_THRESHOLDS.minLivenessScore &&
      faceMatchScore >= KYC_THRESHOLDS.minFaceMatchScore &&
      deepfakeRisk <= KYC_THRESHOLDS.maxDeepfakeRisk;

    return {
      approved,
      confidence: approved ? 0.9 : 0.57,
      faceMatchScore,
      livenessScore,
      deepfakeRisk,
      estimatedAge: 28,
      reason: approved ? undefined : 'Falha na prova de vida ou baixa correspondência facial.',
    };
  }

  async detectDeepfake(selfieImage: Blob): Promise<DeepfakeVerificationResult> {
    await delay(250);

    const deepfakeProbability = clamp(0.22 - normalizeBlobSize(selfieImage.size, 90_000, 2_000_000) * 0.18, 0.01, 0.4);
    const approved = deepfakeProbability <= KYC_THRESHOLDS.maxDeepfakeRisk;

    return {
      approved,
      confidence: approved ? 0.91 : 0.6,
      deepfakeProbability,
      inconsistencies: approved ? [] : ['inconsistencia em contorno facial', 'artefatos de compressao anormal'],
      reason: approved ? undefined : 'Risco elevado de manipulacao/deepfake detectado.',
    };
  }

  async verifyAge(params: { selfieImage: Blob; birthDateISO?: string }): Promise<AgeVerificationResult> {
    await delay(250);

    let estimatedAge = 26;
    if (params.birthDateISO) {
      estimatedAge = computeAgeFromISO(params.birthDateISO);
    } else {
      estimatedAge = Math.round(20 + normalizeBlobSize(params.selfieImage.size, 80_000, 2_000_000) * 16);
    }

    const isAdult = estimatedAge >= KYC_THRESHOLDS.minLegalAge;

    return {
      approved: isAdult,
      confidence: 0.9,
      estimatedAge,
      isAdult,
      reason: isAdult ? undefined : 'Idade estimada menor que 18 anos.',
    };
  }
}

class SupabaseEdgeKYCProvider implements KYCProvider {
  async verifyDocument(input: DocumentInput): Promise<DocumentVerificationResult> {
    const payload = {
      type: input.type,
      frontImageBase64: await blobToBase64(input.frontImage),
      backImageBase64: input.backImage ? await blobToBase64(input.backImage) : undefined,
      declaredFullName: input.declaredFullName,
      declaredDocumentNumber: input.declaredDocumentNumber,
    };

    const { data, error } = await supabase.functions.invoke('kyc-verify-document', {
      body: payload,
    });

    if (error || !data) {
      throw new Error('Falha ao verificar documento no provider remoto.');
    }

    return data as DocumentVerificationResult;
  }

  async verifyFace(input: FaceVerificationInput): Promise<FaceVerificationResult> {
    const payload = {
      selfieImageBase64: await blobToBase64(input.selfieImage),
      documentFaceImageBase64: input.documentFaceImage ? await blobToBase64(input.documentFaceImage) : undefined,
      livenessSignals: input.livenessSignals,
    };

    const { data, error } = await supabase.functions.invoke('kyc-verify-face', {
      body: payload,
    });

    if (error || !data) {
      throw new Error('Falha ao verificar face no provider remoto.');
    }

    return data as FaceVerificationResult;
  }

  async detectDeepfake(selfieImage: Blob): Promise<DeepfakeVerificationResult> {
    const { data, error } = await supabase.functions.invoke('kyc-detect-deepfake', {
      body: { selfieImageBase64: await blobToBase64(selfieImage) },
    });

    if (error || !data) {
      throw new Error('Falha ao executar analise de deepfake no provider remoto.');
    }

    return data as DeepfakeVerificationResult;
  }

  async verifyAge(params: { selfieImage: Blob; birthDateISO?: string }): Promise<AgeVerificationResult> {
    const { data, error } = await supabase.functions.invoke('kyc-verify-age', {
      body: {
        selfieImageBase64: await blobToBase64(params.selfieImage),
        birthDateISO: params.birthDateISO,
      },
    });

    if (error || !data) {
      throw new Error('Falha ao executar verificacao de idade no provider remoto.');
    }

    return data as AgeVerificationResult;
  }
}

export class KYCService {
  constructor(private provider: KYCProvider) {}

  async runFullVerification(input: {
    document: DocumentInput;
    face: FaceVerificationInput;
  }): Promise<KYCFinalResult> {
    const documentResult = await this.provider.verifyDocument(input.document);
    const faceResult = await this.provider.verifyFace(input.face);
    const deepfakeResult = await this.provider.detectDeepfake(input.face.selfieImage);
    const ageResult = await this.provider.verifyAge({
      selfieImage: input.face.selfieImage,
      birthDateISO: documentResult.ocr.birthDateISO,
    });

    const reasons: string[] = [];

    if (!documentResult.approved || documentResult.confidence < KYC_THRESHOLDS.minDocumentConfidence) {
      reasons.push(documentResult.reason ?? 'Documento nao aprovado.');
    }
    if (documentResult.forgeryScore > KYC_THRESHOLDS.maxForgeryScore) {
      reasons.push('Risco de falsificacao de documento acima do limite.');
    }

    if (!faceResult.approved || faceResult.confidence < KYC_THRESHOLDS.minFaceConfidence) {
      reasons.push(faceResult.reason ?? 'Verificacao facial nao aprovada.');
    }
    if (faceResult.faceMatchScore < KYC_THRESHOLDS.minFaceMatchScore) {
      reasons.push('Correspondencia facial abaixo do minimo exigido.');
    }
    if (faceResult.livenessScore < KYC_THRESHOLDS.minLivenessScore) {
      reasons.push('Prova de vida insuficiente.');
    }

    if (!deepfakeResult.approved || deepfakeResult.deepfakeProbability > KYC_THRESHOLDS.maxDeepfakeRisk) {
      reasons.push(deepfakeResult.reason ?? 'Risco de deepfake acima do permitido.');
    }

    if (!ageResult.approved || !ageResult.isAdult || ageResult.confidence < KYC_THRESHOLDS.minAgeConfidence) {
      reasons.push(ageResult.reason ?? 'Verificacao de idade nao aprovada.');
    }

    const finalResult: KYCFinalResult = {
      approved: reasons.length === 0,
      document: documentResult,
      face: faceResult,
      deepfake: deepfakeResult,
      age: ageResult,
      failureReasons: reasons,
      completedAt: new Date().toISOString(),
    };

    await this.persistAuditAttempt(finalResult, input.document.type);

    return finalResult;
  }

  private async persistAuditAttempt(result: KYCFinalResult, documentType: DocumentType): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const payload = {
        user_id: user.id,
        document_type: documentType,
        approved: result.approved,
        failure_reasons: result.failureReasons,
        document_confidence: result.document.confidence,
        facial_confidence: result.face.confidence,
        deepfake_confidence: result.deepfake.confidence,
        age_confidence: result.age.confidence,
        deepfake_probability: result.deepfake.deepfakeProbability,
        face_match_score: result.face.faceMatchScore,
        liveness_score: result.face.livenessScore,
        estimated_age: result.age.estimatedAge,
        consistency_score: result.document.consistencyScore ?? null,
        risk_indicators: result.document.riskIndicators ?? [],
        details: result,
      };

      await (supabase as any).from('kyc_attempt_audit').insert(payload);
    } catch (error) {
      // Never break the user flow because of audit persistence.
      console.error('KYC audit persistence failed:', error);
    }
  }
}

const providerMode = (import.meta.env.VITE_KYC_PROVIDER ?? 'mock').toLowerCase();

const activeProvider: KYCProvider =
  providerMode === 'edge'
    ? new SupabaseEdgeKYCProvider()
    : new MockKYCProvider();

export const kycService = new KYCService(activeProvider);

function computeAgeFromISO(isoDate: string): number {
  const birthDate = new Date(isoDate);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

function computeLivenessFromSignals(signals: LivenessSignals): number {
  const checks = [
    signals.blinkDetected,
    signals.headTurnDetected,
    signals.mouthMovementDetected,
    signals.challengePassed ?? true,
  ];

  const passed = checks.filter(Boolean).length;
  return clamp(passed / checks.length, 0, 1);
}

function normalizeBlobSize(size: number, min: number, max: number): number {
  if (size <= min) return 0;
  if (size >= max) return 1;
  return (size - min) / (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default kycService;
