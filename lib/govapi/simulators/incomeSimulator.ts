import crypto from "crypto";
import type {
  CanonicalAdapterResult,
  IncomePayload,
  AdapterExecutionContext,
  ProvenanceMetadata,
} from "../types.ts";

export type IncomeSimulatorScenario =
  | "SUCCESS"
  | "RECORD_NOT_FOUND"
  | "INVALID_IDENTIFIER"
  | "CONSENT_REQUIRED"
  | "SOURCE_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "STALE_RECORD";

/**
 * Masks a PAN number for secure logging and metadata representation.
 * Example: ABCDE1234F -> AB*****4F
 */
export function maskPan(pan?: string): string {
  if (!pan || pan.length < 4) return "REDACTED";
  return `${pan.slice(0, 2)}*****${pan.slice(-2)}`;
}

/**
 * Resolves the deterministic scenario based on context override,
 * test PAN conventions, and input structure.
 */
export function resolveIncomeScenario(
  pan: string,
  context?: AdapterExecutionContext
): IncomeSimulatorScenario {
  // Explicit scenario override via context (e.g. automated tests or developer tools)
  if (context?.scenario) {
    return context.scenario as IncomeSimulatorScenario;
  }

  // Format validation
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!panRegex.test(pan)) {
    return "INVALID_IDENTIFIER";
  }

  // Explicit test PAN triggers (strictly adhering to 5 letters + 4 digits + 1 letter format)
  switch (pan.toUpperCase()) {
    case "NOTFD0000X":
      return "RECORD_NOT_FOUND";
    case "DOWNT0000X":
      return "SOURCE_UNAVAILABLE";
    case "TIMEO0000X":
      return "TIMEOUT";
    case "RATEL0000X":
      return "RATE_LIMITED";
    case "STALE0000X":
      return "STALE_RECORD";
    default:
      return "SUCCESS";
  }
}

/**
 * Executes a realistic, deterministic simulation of the API Setu / CBDT Income Tax Gateway.
 */
export async function simulateIncomeVerification(
  request: { pan: string; holderName?: string },
  context?: AdapterExecutionContext
): Promise<CanonicalAdapterResult<IncomePayload>> {
  const pan = (request.pan || "").trim().toUpperCase();
  const requestId = context?.requestId || `ITR-SIM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const retrievedAt = new Date().toISOString();
  const masked = maskPan(pan);

  const scenario = resolveIncomeScenario(pan, context);

  // Realistic bounded simulated latency (skipped in unit test suites if requested)
  if (!context?.skipLatency) {
    const latencyMs = scenario === "TIMEOUT" ? 350 : 120;
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }

  const baseProvenance: ProvenanceMetadata = {
    sourceId: "INCOME_TAX_DEPT_APISETU",
    sourceName: "Income Tax Department (via API Setu Sandbox)",
    department: "Central Board of Direct Taxes, Ministry of Finance",
    mode: "SIMULATED",
    requestId,
    retrievedAt,
    adapterVersion: "2.1.0-sim",
  };

  switch (scenario) {
    case "SUCCESS": {
      const data: IncomePayload = {
        annualIncome: 160000,
        holderName: request.holderName || "Aryan Mehta",
        pan,
        assessmentYear: "2025-26",
        taxFiled: true,
        source: "INCOME_TAX_DEPT_MOCK",
        verifiedAt: retrievedAt,
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED", // API Setu JSON data pull (no document signature)
        freshnessStatus: "FRESH",              // AY 2025-26 matches current academic intake
        validityStatus: "VALID",
        provenance: {
          ...baseProvenance,
          recordId: "CPC-ITR-202526-9812401",
          issuedAt: "2025-07-28T10:15:00Z",
          sourceUpdatedAt: "2025-08-01T14:30:00Z",
          expiresAt: "2027-03-31T23:59:59Z", // Assessment cycle validity
        },
        data,
      };
    }

    case "STALE_RECORD": {
      // Models an outdated assessment year (e.g. filed 4 years ago for AY 2021-22)
      const data: IncomePayload = {
        annualIncome: 180000,
        holderName: request.holderName || "Aryan Mehta",
        pan,
        assessmentYear: "2021-22",
        taxFiled: true,
        source: "INCOME_TAX_DEPT_MOCK",
        verifiedAt: retrievedAt,
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "STALE",              // Stale relative to 2026 intake cycle
        validityStatus: "VALID",
        provenance: {
          ...baseProvenance,
          recordId: "CPC-ITR-202122-4419203",
          issuedAt: "2021-09-15T11:20:00Z",
          sourceUpdatedAt: "2021-09-20T09:00:00Z",
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
          message: `No filed return or assessment record found in Centralized Processing Center (CPC) for PAN ${masked}.`,
          category: "UPSTREAM_ERROR",
          upstreamStatusCode: 404,
          details: {
            panMasked: masked,
            assessmentYearQueried: "2025-26",
            sourceStatus: "NO_RECORD_FOUND",
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
          message: `Malformed PAN format: "${pan}". Permanent Account Number must be exactly 10 alphanumeric characters (5 letters, 4 digits, 1 letter).`,
          category: "VALIDATION",
          upstreamStatusCode: 400,
          details: {
            expectedPattern: "^[A-Z]{5}[0-9]{4}[A-Z]$",
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
          message: "Explicit citizen consent artifact is missing or has expired. DPDP compliance prohibits unauthorized data retrieval.",
          category: "CONSENT",
          upstreamStatusCode: 403,
          details: {
            requiredPurposeCode: "INCOME_VERIFICATION",
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
          message: "Upstream CBDT Income Tax e-Filing Gateway is temporarily unavailable (HTTP 503).",
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
          message: "Upstream gateway connection timed out while querying the Centralized Processing Center (CPC).",
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
          message: "API Setu partner organization throughput quota exceeded. Throttling applied.",
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
