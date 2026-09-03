import crypto from "crypto";
import type {
  GovernmentAdapter,
  CanonicalAdapterResult,
  IncomePayload,
  AdapterExecutionContext,
} from "../types.ts";
import { fetchIncome as callApiSetuIncome } from "../apisetu.ts";

import { simulateIncomeVerification } from "../simulators/incomeSimulator.ts";

export interface IncomeRequest {
  pan: string;
  holderName?: string;
}

export class IncomeAdapter implements GovernmentAdapter<IncomeRequest, IncomePayload> {
  readonly sourceId = "INCOME_TAX_DEPT_APISETU";
  readonly sourceName = "Income Tax Department (via API Setu)";

  get mode() {
    return process.env.USE_MOCK_APIS === "true" ? "SIMULATED" : "REAL";
  }

  async execute(
    request: IncomeRequest,
    context?: AdapterExecutionContext
  ): Promise<CanonicalAdapterResult<IncomePayload>> {
    if (this.mode === "SIMULATED") {
      return simulateIncomeVerification(request, context);
    }

    // Real API Setu Call
    try {
      const response = await callApiSetuIncome(request.pan);
      const data: IncomePayload = {
        annualIncome: response.annualIncome ?? 0,
        holderName: response.holderName ?? request.holderName ?? "",
        pan: request.pan,
        assessmentYear: response.assessmentYear ?? "2025-26",
        taxFiled: response.taxFiled ?? true,
        source: "INCOME_TAX_DEPT_APISETU",
        verifiedAt: retrievedAt,
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
          department: "Central Board of Direct Taxes, Ministry of Finance",
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
          department: "Central Board of Direct Taxes, Ministry of Finance",
          mode: "REAL",
          requestId,
          retrievedAt,
          adapterVersion: "2.0.0",
        },
        error: {
          code: "SOURCE_UNAVAILABLE",
          message: err.message || "Failed to fetch income data from API Setu",
          category: "UPSTREAM_ERROR",
        },
      };
    }
  }
}

export const incomeAdapter = new IncomeAdapter();
