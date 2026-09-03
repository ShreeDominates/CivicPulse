import crypto from "crypto";
import type {
  CanonicalAdapterResult,
  BankPayload,
  AdapterExecutionContext,
  ProvenanceMetadata,
} from "../types.ts";

export type BankSimulatorScenario =
  | "SUCCESS"
  | "NAME_MISMATCH"
  | "INVALID_IDENTIFIER"
  | "ACCOUNT_NOT_FOUND"
  | "CONSENT_REQUIRED"
  | "SOURCE_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED";

/**
 * Masks a bank account number for secure logging and audit presentation.
 * Example: 12345678901234 -> XXXX-XXXX-1234
 */
export function maskBankAccount(account?: string): string {
  if (!account || account.length < 4) return "REDACTED";
  return `XXXX-XXXX-${account.slice(-4)}`;
}

/**
 * Normalizes and compares applicant claimed name against CBS registered account name.
 */
export function compareBankNames(
  cbsName: string,
  claimedName?: string
): { match: boolean; confidence: number; details: string } {
  if (!claimedName || !claimedName.trim()) {
    return {
      match: true,
      confidence: 1.0,
      details: "No applicant name provided for CBS comparison.",
    };
  }

  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const cbsTokens = clean(cbsName);
  const claimTokens = clean(claimedName);

  if (cbsTokens.join(" ") === claimTokens.join(" ")) {
    return {
      match: true,
      confidence: 1.0,
      details: "Exact match between CBS account name and applicant profile.",
    };
  }

  const overlap = cbsTokens.filter((t) => claimTokens.includes(t));
  const maxLen = Math.max(cbsTokens.length, claimTokens.length);
  const ratio = overlap.length / (maxLen || 1);

  if (ratio >= 0.6) {
    return {
      match: true,
      confidence: parseFloat(ratio.toFixed(2)),
      details: `High-confidence token overlap (${overlap.join(", ")}).`,
    };
  }

  return {
    match: false,
    confidence: parseFloat(ratio.toFixed(2)),
    details: `CBS account name "${cbsName}" diverges from applicant name "${claimedName}".`,
  };
}

/**
 * Resolves deterministic scenario based on context override or test account numbers.
 */
export function resolveBankScenario(
  accountNumber: string,
  ifsc: string,
  context?: AdapterExecutionContext
): BankSimulatorScenario {
  if (context?.scenario) {
    return context.scenario as BankSimulatorScenario;
  }

  // Format validation
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifsc) || accountNumber.length < 9 || accountNumber.length > 18) {
    return "INVALID_IDENTIFIER";
  }

  switch (accountNumber) {
    case "99999999999999":
      return "NAME_MISMATCH";
    case "88888888888888":
      return "ACCOUNT_NOT_FOUND";
    case "55555555555555":
      return "SOURCE_UNAVAILABLE";
    case "44444444444444":
      return "TIMEOUT";
    case "33333333333333":
      return "RATE_LIMITED";
    default:
      return "SUCCESS";
  }
}

/**
 * Executes a realistic, deterministic simulation of IMPS Penny-Drop Fund Account Validation (FAV).
 */
export async function simulateBankVerification(
  request: { accountNumber: string; ifsc: string; name: string },
  context?: AdapterExecutionContext
): Promise<CanonicalAdapterResult<BankPayload>> {
  const accountNumber = (request.accountNumber || "").trim();
  const ifsc = (request.ifsc || "").trim().toUpperCase();
  const requestId = context?.requestId || `FAV-SIM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const retrievedAt = new Date().toISOString();
  const maskedAcc = maskBankAccount(accountNumber);

  const scenario = resolveBankScenario(accountNumber, ifsc, context);

  if (!context?.skipLatency) {
    const latencyMs = scenario === "TIMEOUT" ? 350 : 120;
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }

  const baseProvenance: ProvenanceMetadata = {
    sourceId: "RAZORPAY_FAV",
    sourceName: "Fund Account Validation (via RazorpayX Sandbox)",
    department: "Banking Intermediary (IMPS Penny-Drop via NPCI Member Bank)",
    mode: "SIMULATED",
    requestId,
    recordId: `fav_sim_${Date.now()}`,
    retrievedAt,
    issuedAt: retrievedAt,
    adapterVersion: "2.1.0-sim",
  };

  switch (scenario) {
    case "SUCCESS": {
      const registeredName = request.name || "Aryan Mehta";
      const nameCheck = compareBankNames(registeredName, request.name);

      const data: BankPayload = {
        valid: true,
        registeredName,
        bankName: "State Bank of India",
        ifsc,
        accountLast4: accountNumber.slice(-4),
        verifiedAt: retrievedAt,
        nameMatchConfidence: nameCheck.confidence,
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED", // Commercial banking API response
        freshnessStatus: "FRESH",
        validityStatus: "VALID",
        provenance: baseProvenance,
        data,
      };
    }

    case "NAME_MISMATCH": {
      const cbsRegisteredName = "Suresh Kumar";
      const nameCheck = compareBankNames(cbsRegisteredName, request.name || "Aryan Mehta");

      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "FRESH",
        validityStatus: "VALID",
        provenance: baseProvenance,
        error: {
          code: "VERIFICATION_FAILED",
          message: `Bank account holder name mismatch: Account is registered to "${cbsRegisteredName}", but applicant is "${request.name}".`,
          category: "VALIDATION",
          upstreamStatusCode: 422,
          details: {
            cbsRegisteredName,
            claimedName: request.name,
            confidence: nameCheck.confidence,
            matchStatus: "MISMATCH",
          },
        },
      };
    }

    case "ACCOUNT_NOT_FOUND": {
      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "RECORD_NOT_FOUND",
          message: `Bank account ${maskedAcc} at IFSC ${ifsc} was not found, is inactive, or has been closed.`,
          category: "UPSTREAM_ERROR",
          upstreamStatusCode: 404,
          details: {
            accountMasked: maskedAcc,
            ifsc,
            cbsStatus: "ACCOUNT_DOES_NOT_EXIST",
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
          message: `Invalid bank account number or IFSC code: "${ifsc}". IFSC must be 11 characters starting with 4 alphabetic letters, 0, and 6 alphanumeric characters.`,
          category: "VALIDATION",
          upstreamStatusCode: 400,
          details: {
            accountLength: accountNumber.length,
            ifsc,
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
          message: "Explicit citizen authorization token required to execute penny-drop bank account validation.",
          category: "CONSENT",
          upstreamStatusCode: 403,
          details: {
            requiredPurpose: "BANK_ACCOUNT_VALIDATION",
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
          message: "NPCI / IMPS payment switch or destination bank CBS is temporarily unreachable (HTTP 503).",
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
          message: "IMPS penny-drop verification timed out while waiting for destination bank CBS response.",
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
          message: "Bank verification partner API quota exceeded. Throttling applied.",
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
