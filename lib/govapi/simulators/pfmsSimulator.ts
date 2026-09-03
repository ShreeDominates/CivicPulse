/**
 * CivicPulse PFMS / DBT Government Disbursement Simulator.
 * Realistic local simulation of Public Financial Management System (PFMS)
 * and Direct Benefit Transfer (DBT) via Aadhaar Payment Bridge System (APBS).
 *
 * NOTE: SIMULATION ONLY.
 * Does not connect to live Ministry of Finance or NPCI payment rails.
 */

import crypto from "crypto";
import type {
  CanonicalAdapterResult,
  ProvenanceMetadata,
  AdapterExecutionContext,
  VerificationStatus,
  FreshnessStatus,
  ValidityStatus,
} from "../types.ts";

export type PfmsScenario =
  | "SUCCESS"
  | "PROCESSING"
  | "BENEFICIARY_VALIDATION_FAILED"
  | "PAYMENT_REJECTED"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT";

export interface PfmsDisbursementRequest {
  applicationRef: string;
  sanctionOrderRef: string;
  schemeId: string;
  amount: number;
  beneficiaryName: string;
  accountNumber: string;
  ifsc: string;
  aadhaarHash?: string;
  idempotencyKey?: string;
}

export interface PfmsDisbursementPayload {
  transactionId: string;
  pfmsRef: string;
  sanctionOrderRef: string;
  applicationRef: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  accountMasked: string;
  ifsc: string;
  status: "INITIATED" | "PROCESSING" | "CREDITED" | "REJECTED";
  creditedAt?: string;
  utrNumber?: string;
  clearingMode: "NPCI_APBS" | "ACH_CREDIT" | "PFMS_INTERNAL";
  departmentCode: string;
  treasuryBillNo: string;
  simulationNote: string;
}

export class PfmsSimulator {
  private static readonly DEPARTMENT = "Department of Expenditure, Ministry of Finance, Government of India";
  private static readonly SCHEME_CODE = "MH-HED-2026-DBT";

  /**
   * Deterministically resolves test scenario based on account number or context override.
   */
  public static resolveScenario(
    request: PfmsDisbursementRequest,
    context?: AdapterExecutionContext
  ): PfmsScenario {
    if (context?.scenario) {
      const s = context.scenario.toUpperCase();
      if (
        s === "SUCCESS" ||
        s === "PROCESSING" ||
        s === "BENEFICIARY_VALIDATION_FAILED" ||
        s === "PAYMENT_REJECTED" ||
        s === "RATE_LIMITED" ||
        s === "SERVICE_UNAVAILABLE" ||
        s === "TIMEOUT"
      ) {
        return s as PfmsScenario;
      }
    }

    const acc = request.accountNumber.replace(/\D/g, "");
    if (acc.endsWith("5555")) return "SERVICE_UNAVAILABLE";
    if (acc.endsWith("4444")) return "TIMEOUT";
    if (acc.endsWith("3333")) return "RATE_LIMITED";
    if (acc.endsWith("2222")) return "BENEFICIARY_VALIDATION_FAILED";
    if (acc.endsWith("1111")) return "PAYMENT_REJECTED";
    if (acc.endsWith("6666")) return "PROCESSING";

    return "SUCCESS";
  }

  /**
   * Executes the deterministic PFMS disbursement simulation.
   */
  public static async execute(
    request: PfmsDisbursementRequest,
    context?: AdapterExecutionContext
  ): Promise<CanonicalAdapterResult<PfmsDisbursementPayload>> {
    const scenario = this.resolveScenario(request, context);
    const requestId = context?.requestId || `PFMS-REQ-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const retrievedAt = new Date().toISOString();

    const baseProvenance: ProvenanceMetadata = {
      sourceId: "PFMS_DBT_PORTAL",
      sourceName: "Public Financial Management System (PFMS)",
      department: this.DEPARTMENT,
      mode: "SIMULATED",
      requestId,
      retrievedAt,
      adapterVersion: "2.0.0",
      isSimulated: true,
    };

    const accountMasked = `XXXX-XXXX-${request.accountNumber.slice(-4)}`;

    switch (scenario) {
      case "SUCCESS": {
        const hash = crypto
          .createHash("sha256")
          .update(`${request.applicationRef}-${request.amount}`)
          .digest("hex")
          .slice(0, 8)
          .toUpperCase();

        const pfmsRef = `C${new Date().getFullYear()}MH${hash}`;
        const utrNumber = `RBI${Date.now()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
        const treasuryBillNo = `TB-MH-2026-${hash}`;

        const data: PfmsDisbursementPayload = {
          transactionId: `TXN-PFMS-${Date.now()}`,
          pfmsRef,
          sanctionOrderRef: request.sanctionOrderRef,
          applicationRef: request.applicationRef,
          amount: request.amount,
          currency: "INR",
          beneficiaryName: request.beneficiaryName,
          accountMasked,
          ifsc: request.ifsc,
          status: "CREDITED",
          creditedAt: retrievedAt,
          utrNumber,
          clearingMode: "NPCI_APBS",
          departmentCode: this.SCHEME_CODE,
          treasuryBillNo,
          simulationNote: "SIMULATED DBT CREDIT: Beneficiary account credited via NPCI APBS simulator.",
        };

        return {
          success: true,
          verificationStatus: "DATA_VERIFIED",
          authenticityStatus: "UNAUTHENTICATED",
          freshnessStatus: "FRESH",
          validityStatus: "VALID",
          provenance: {
            ...baseProvenance,
            recordId: pfmsRef,
          },
          data,
        };
      }

      case "PROCESSING": {
        const hash = crypto
          .createHash("sha256")
          .update(`${request.applicationRef}-proc`)
          .digest("hex")
          .slice(0, 8)
          .toUpperCase();

        const pfmsRef = `P${new Date().getFullYear()}MH${hash}`;

        const data: PfmsDisbursementPayload = {
          transactionId: `TXN-PFMS-${Date.now()}`,
          pfmsRef,
          sanctionOrderRef: request.sanctionOrderRef,
          applicationRef: request.applicationRef,
          amount: request.amount,
          currency: "INR",
          beneficiaryName: request.beneficiaryName,
          accountMasked,
          ifsc: request.ifsc,
          status: "PROCESSING",
          clearingMode: "NPCI_APBS",
          departmentCode: this.SCHEME_CODE,
          treasuryBillNo: `TB-MH-2026-${hash}`,
          simulationNote: "SIMULATED IN-TRANSIT: Payment order transmitted to RBI Clearing House.",
        };

        return {
          success: true,
          verificationStatus: "DATA_VERIFIED",
          authenticityStatus: "UNAUTHENTICATED",
          freshnessStatus: "FRESH",
          validityStatus: "VALID",
          provenance: {
            ...baseProvenance,
            recordId: pfmsRef,
          },
          data,
        };
      }

      case "BENEFICIARY_VALIDATION_FAILED": {
        return {
          success: false,
          verificationStatus: "VERIFICATION_FAILED",
          authenticityStatus: "UNAUTHENTICATED",
          freshnessStatus: "FRESH",
          validityStatus: "UNKNOWN",
          provenance: baseProvenance,
          error: {
            code: "VERIFICATION_FAILED",
            message: "PFMS Beneficiary Validation Rejected: Aadhaar-bank account mapping inactive in NPCI mapper.",
            category: "VALIDATION",
            upstreamStatusCode: 422,
            details: {
              accountMasked,
              npciStatusCode: "NPCI_ABPS_ERR_04",
              rejectionReason: "Account not seeded with Aadhaar for Direct Benefit Transfer.",
            },
          },
        };
      }

      case "PAYMENT_REJECTED": {
        return {
          success: false,
          verificationStatus: "VERIFICATION_FAILED",
          authenticityStatus: "UNAUTHENTICATED",
          freshnessStatus: "FRESH",
          validityStatus: "UNKNOWN",
          provenance: baseProvenance,
          error: {
            code: "VERIFICATION_FAILED",
            message: "Treasury bill rejected: Scheme allocation budget quota exhausted for the current disbursement cycle.",
            category: "UPSTREAM_ERROR",
            upstreamStatusCode: 400,
            details: {
              treasuryCode: "MH_PUNE_TREASURY_01",
              budgetHead: "2202-03-107-01-01",
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
            message: "PFMS Central Switch rate limit exceeded (429). Batch request queued.",
            category: "RATE_LIMIT",
            upstreamStatusCode: 429,
          },
        };
      }

      case "SERVICE_UNAVAILABLE": {
        return {
          success: false,
          verificationStatus: "NOT_VERIFIED",
          authenticityStatus: "UNAUTHENTICATED",
          freshnessStatus: "UNKNOWN",
          validityStatus: "UNKNOWN",
          provenance: baseProvenance,
          error: {
            code: "SOURCE_UNAVAILABLE",
            message: "PFMS APBS Settlement Service undergoing scheduled maintenance (503).",
            category: "UPSTREAM_ERROR",
            upstreamStatusCode: 503,
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
            message: "PFMS Clearing Gateway connection timed out (504).",
            category: "TIMEOUT",
            upstreamStatusCode: 504,
          },
        };
      }
    }
  }
}
