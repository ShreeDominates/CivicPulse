import crypto from "crypto";
import type {
  CanonicalAdapterResult,
  CastePayload,
  AdapterExecutionContext,
  ProvenanceMetadata,
} from "../types.ts";

export type CasteSimulatorScenario =
  | "SUCCESS"
  | "RECORD_NOT_FOUND"
  | "INVALID_IDENTIFIER"
  | "CONSENT_REQUIRED"
  | "EXPIRED_NCL"
  | "SOURCE_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED";

// Masks a caste certificate identifier for secure logging (e.g. MH/CST/2024/887123 to MH/CST/****/887123)
export function maskCertificateId(certId?: string): string {
  if (!certId || certId.length < 6) return "REDACTED";
  const parts = certId.split("/");
  if (parts.length >= 4) {
    return `${parts[0]}/${parts[1]}/****/${parts[3]}`;
  }
  return `${certId.slice(0, 3)}****${certId.slice(-4)}`;
}

/**
 * Resolves deterministic scenario based on context override or test certificate IDs.
 */
export function resolveCasteScenario(
  certificateId: string,
  context?: AdapterExecutionContext
): CasteSimulatorScenario {
  if (context?.scenario) {
    return context.scenario as CasteSimulatorScenario;
  }

  const cert = certificateId.trim().toUpperCase();

  if (cert.includes("999999")) return "RECORD_NOT_FOUND";
  if (cert.includes("777777")) return "EXPIRED_NCL";
  if (cert.includes("555555")) return "SOURCE_UNAVAILABLE";
  if (cert.includes("444444")) return "TIMEOUT";
  if (cert.includes("333333")) return "RATE_LIMITED";

  // Simple format validation: standard state revenue formats e.g. MH/CST/2024/887123
  if (cert.length < 8) {
    return "INVALID_IDENTIFIER";
  }

  return "SUCCESS";
}

/**
 * Executes a realistic, deterministic simulation of State Revenue Caste & Category Certificate Verification.
 */
export async function simulateCasteVerification(
  request: { certificateId: string; category?: string },
  context?: AdapterExecutionContext
): Promise<CanonicalAdapterResult<CastePayload>> {
  const certificateId = (request.certificateId || "").trim().toUpperCase();
  const requestId = context?.requestId || `CST-SIM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const retrievedAt = new Date().toISOString();
  const maskedId = maskCertificateId(certificateId);

  const scenario = resolveCasteScenario(certificateId, context);

  if (!context?.skipLatency) {
    const latencyMs = scenario === "TIMEOUT" ? 350 : 120;
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }

  const baseProvenance: ProvenanceMetadata = {
    sourceId: "STATE_REVENUE_PORTAL",
    sourceName: "Department of Revenue & Forest, Government of Maharashtra (MahaOnline/Aaple Sarkar)",
    department: "Divisional Caste Scrutiny Committee & Revenue Department",
    mode: "SIMULATED",
    requestId,
    recordId: certificateId,
    retrievedAt,
    issuedAt: "2024-06-15T00:00:00Z",
    adapterVersion: "2.1.0-sim",
  };

  switch (scenario) {
    case "SUCCESS": {
      const category = request.category?.toUpperCase() || "OBC";
      const data: CastePayload = {
        category,
        certificateId,
        subCaste: category === "OBC" ? "Kunbi" : "General",
        source: "STATE_REVENUE_PORTAL_MOCK",
        issuingAuthority: "Sub-Divisional Officer (SDO), Revenue Division Pune",
        nclValidUntil: "2027-03-31", // Valid for 3 financial years per state rules
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED", // Government portal barcode record lookup
        freshnessStatus: "FRESH",
        validityStatus: "VALID",
        provenance: {
          ...baseProvenance,
          expiresAt: "2027-03-31T23:59:59Z",
        },
        data,
      };
    }

    case "EXPIRED_NCL": {
      // Certificate is authentic, but Non-Creamy Layer expired
      const data: CastePayload = {
        category: "OBC",
        certificateId,
        subCaste: "Kunbi",
        source: "STATE_REVENUE_PORTAL_MOCK",
        issuingAuthority: "Sub-Divisional Officer (SDO), Revenue Division Pune",
        nclValidUntil: "2023-03-31", // Expired
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "EXPIRED",
        validityStatus: "EXPIRED",
        provenance: {
          ...baseProvenance,
          issuedAt: "2020-04-10T00:00:00Z",
          expiresAt: "2023-03-31T23:59:59Z",
        },
        data,
      };
    }

    case "RECORD_NOT_FOUND": {
      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "RECORD_NOT_FOUND",
          message: `No caste or community certificate found in State Revenue registry for application barcode ${maskedId}.`,
          category: "UPSTREAM_ERROR",
          upstreamStatusCode: 404,
          details: {
            certificateMasked: maskedId,
            registry: "CCVIS_MAHAONLINE",
          },
        },
      };
    }

    case "INVALID_IDENTIFIER": {
      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "INVALID_IDENTIFIER",
          message: `Malformed caste certificate identifier: "${certificateId}". Expected state certificate barcode format.`,
          category: "VALIDATION",
          upstreamStatusCode: 400,
          details: {
            formatExpected: "STATE/TYPE/YEAR/NUMBER",
          },
        },
      };
    }

    case "CONSENT_REQUIRED": {
      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "CONSENT_REQUIRED",
          message: "Explicit citizen authorization token required to verify caste certificate records.",
          category: "CONSENT",
          upstreamStatusCode: 403,
          details: {
            requiredPurpose: "CASTE_VERIFICATION",
          },
        },
      };
    }

    case "SOURCE_UNAVAILABLE": {
      return {
        success: false,
        verificationStatus: "NOT_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "SOURCE_UNAVAILABLE",
          message: "State Revenue CCVIS verification portal is temporarily down for maintenance (HTTP 503).",
          category: "UPSTREAM_ERROR",
          upstreamStatusCode: 503,
          details: {
            retryAfterSeconds: 60,
          },
        },
      };
    }

    case "TIMEOUT": {
      return {
        success: false,
        verificationStatus: "NOT_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "TIMEOUT",
          message: "Connection to State Revenue portal timed out after 5000ms.",
          category: "UPSTREAM_ERROR",
          upstreamStatusCode: 504,
          details: {
            timeoutThresholdMs: 5000,
          },
        },
      };
    }

    case "RATE_LIMITED": {
      return {
        success: false,
        verificationStatus: "NOT_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "RATE_LIMITED",
          message: "State portal query throughput limit exceeded. Throttling applied.",
          category: "UPSTREAM_ERROR",
          upstreamStatusCode: 429,
          details: {
            retryAfterSeconds: 30,
          },
        },
      };
    }
  }
}
