import crypto from "crypto";
import type {
  GovernmentAdapter,
  CanonicalAdapterResult,
  MarksPayload,
  AdapterExecutionContext,
} from "../types.ts";
import { fetchCBSE12 as callApiSetuMarks } from "../apisetu.ts";
import { simulateMarksVerification } from "../simulators/marksSimulator.ts";

export interface MarksRequest {
  rollNumber: string;
  year: number;
  studentName?: string;
}

export class MarksAdapter implements GovernmentAdapter<MarksRequest, MarksPayload> {
  readonly sourceId = "CBSE_DIGILOCKER";
  readonly sourceName = "Central Board of Secondary Education (via DigiLocker)";

  get mode() {
    return process.env.USE_MOCK_APIS === "true" ? "SIMULATED" : "REAL";
  }

  async execute(
    request: MarksRequest,
    context?: AdapterExecutionContext
  ): Promise<CanonicalAdapterResult<MarksPayload>> {
    if (this.mode === "SIMULATED") {
      return simulateMarksVerification(request, context);
    }

    // Real API Call via API Setu / DigiLocker
    try {
      const response = await callApiSetuMarks(request.rollNumber, request.year);
      const data: MarksPayload = {
        percentage: response.percentage ?? 0,
        rollNumber: response.rollNumber ?? request.rollNumber,
        studentName: response.studentName ?? request.studentName ?? "",
        year: response.year ?? request.year,
        class: response.class ?? 12,
        grade: response.grade ?? "A",
        source: "CBSE_DIGILOCKER",
        digitalSignatureValid: response.digitallyVerified ?? false,
        issuedBy: response.issuedBy ?? "CENTRAL BOARD OF SECONDARY EDUCATION",
        issuedOn: new Date().toISOString().split("T")[0],
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "AUTHENTICITY_CONFIRMED",
        freshnessStatus: "FRESH",
        validityStatus: "VALID",
        provenance: {
          sourceId: this.sourceId,
          sourceName: this.sourceName,
          department: "Ministry of Education, Government of India",
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
          department: "Ministry of Education, Government of India",
          mode: "REAL",
          requestId,
          retrievedAt,
          adapterVersion: "2.0.0",
        },
        error: {
          code: "SOURCE_UNAVAILABLE",
          message: err.message || "Failed to fetch marks from CBSE/DigiLocker",
          category: "UPSTREAM_ERROR",
        },
      };
    }
  }
}

export const marksAdapter = new MarksAdapter();
