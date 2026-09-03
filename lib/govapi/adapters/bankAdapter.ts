import crypto from "crypto";
import type {
  GovernmentAdapter,
  CanonicalAdapterResult,
  BankPayload,
  AdapterExecutionContext,
} from "../types.ts";
import { validateBankAccount as callRazorpayBankValidation } from "../razorpay.ts";
import { simulateBankVerification } from "../simulators/bankSimulator.ts";

export interface BankRequest {
  accountNumber: string;
  ifsc: string;
  name: string;
}

export class BankAdapter implements GovernmentAdapter<BankRequest, BankPayload> {
  readonly sourceId = "RAZORPAY_FAV";
  readonly sourceName = "Fund Account Validation (via RazorpayX)";

  get mode() {
    return process.env.USE_MOCK_APIS === "true" ? "SIMULATED" : "REAL";
  }

  async execute(
    request: BankRequest,
    context?: AdapterExecutionContext
  ): Promise<CanonicalAdapterResult<BankPayload>> {
    if (this.mode === "SIMULATED") {
      return simulateBankVerification(request, context);
    }

    // Real Call via Razorpay Fund Account Validation
    try {
      const response = await callRazorpayBankValidation(
        request.accountNumber,
        request.ifsc,
        request.name
      );

      const data: BankPayload = {
        valid: response.valid,
        registeredName: response.registeredName,
        bankName: response.bankName,
        ifsc: response.ifsc,
        accountLast4: response.accountLast4,
        verifiedAt: response.verifiedAt,
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "FRESH",
        validityStatus: "VALID",
        provenance: {
          sourceId: this.sourceId,
          sourceName: this.sourceName,
          department: "Banking Intermediary (IMPS Penny-Drop via RazorpayX)",
          mode: "REAL",
          requestId,
          retrievedAt,
          adapterVersion: "2.0.0",
        },
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: {
          sourceId: this.sourceId,
          sourceName: this.sourceName,
          department: "Banking Intermediary (IMPS Penny-Drop via RazorpayX)",
          mode: "REAL",
          requestId,
          retrievedAt,
          adapterVersion: "2.0.0",
        },
        error: {
          code: "VERIFICATION_FAILED",
          message: err.message || "Bank account validation failed",
          category: "UPSTREAM_ERROR",
        },
      };
    }
  }
}

export const bankAdapter = new BankAdapter();
