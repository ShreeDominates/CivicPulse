import crypto from "crypto";
import type {
  CanonicalAdapterResult,
  MarksPayload,
  AdapterExecutionContext,
  ProvenanceMetadata,
  SubjectScore,
  IdentityMatchStatus,
} from "../types.ts";

export type MarksSimulatorScenario =
  | "SUCCESS"
  | "RECORD_NOT_FOUND"
  | "INVALID_IDENTIFIER"
  | "CONSENT_REQUIRED"
  | "CONSENT_REVOKED"
  | "SOURCE_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "IDENTITY_MISMATCH"
  | "INVALID_DOCUMENT"
  | "STALE_ACADEMIC_RECORD";

/**
 * Masks a CBSE roll number for secure logging and audit presentation.
 * Example: 23456789 -> 23****89
 */
export function maskRollNumber(roll?: string): string {
  if (!roll || roll.length < 4) return "REDACTED";
  return `${roll.slice(0, 2)}****${roll.slice(-2)}`;
}

/**
 * CivicPulse Application-Level Identity Comparison.
 * Compares the candidate name returned by the board against the applicant's profile name.
 * NOTE: This matching is executed by CivicPulse application logic, NOT by DigiLocker or CBSE.
 */
export function performApplicationIdentityMatch(
  certificateName: string,
  claimedName?: string
): { status: IdentityMatchStatus; confidence: number; details: string } {
  if (!claimedName || !claimedName.trim()) {
    return {
      status: "NOT_CHECKED",
      confidence: 1.0,
      details: "No applicant name provided for identity matching comparison.",
    };
  }

  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const certTokens = clean(certificateName);
  const claimTokens = clean(claimedName);

  if (certTokens.join(" ") === claimTokens.join(" ")) {
    return {
      status: "MATCH",
      confidence: 1.0,
      details: "Exact full name token match between certificate and applicant profile.",
    };
  }

  const overlap = certTokens.filter((t) => claimTokens.includes(t));
  const maxLen = Math.max(certTokens.length, claimTokens.length);
  const ratio = overlap.length / (maxLen || 1);

  if (ratio >= 0.6) {
    return {
      status: "PARTIAL_MATCH",
      confidence: parseFloat(ratio.toFixed(2)),
      details: `Partial name token match (${overlap.join(", ")} matched).`,
    };
  }

  return {
    status: "MISMATCH",
    confidence: parseFloat(ratio.toFixed(2)),
    details: `Name mismatch: certificate contains "${certificateName}", applicant claimed "${claimedName}".`,
  };
}

/**
 * Resolves the deterministic scenario based on context override,
 * test roll number conventions, and input structure.
 */
export function resolveMarksScenario(
  rollNumber: string,
  context?: AdapterExecutionContext
): MarksSimulatorScenario {
  // Explicit scenario override via context (for test suites and developer tools)
  if (context?.scenario) {
    return context.scenario as MarksSimulatorScenario;
  }

  // Format validation: standard CBSE roll numbers are 8 numeric digits
  const rollRegex = /^\d{8}$/;
  if (!rollRegex.test(rollNumber)) {
    return "INVALID_IDENTIFIER";
  }

  // Explicit test roll number triggers
  switch (rollNumber) {
    case "99999999":
      return "RECORD_NOT_FOUND";
    case "88888888":
      return "INVALID_DOCUMENT"; // Returns COMPARTMENT
    case "77777777":
      return "STALE_ACADEMIC_RECORD"; // Exam year 2018 (outside intake window)
    case "66666666":
      return "IDENTITY_MISMATCH"; // Returns "Rohan Verma"
    case "55555555":
      return "SOURCE_UNAVAILABLE";
    case "44444444":
      return "TIMEOUT";
    case "33333333":
      return "RATE_LIMITED";
    default:
      return "SUCCESS";
  }
}

/**
 * Realistic CBSE Science Stream subject marks breakdown.
 */
const DEFAULT_SUCCESS_SUBJECTS: SubjectScore[] = [
  { code: "301", name: "English Core", theoryMarks: 72, practicalMarks: 16, totalMarks: 88, grade: "A2" },
  { code: "041", name: "Mathematics", theoryMarks: 73, practicalMarks: 18, totalMarks: 91, grade: "A1" },
  { code: "042", name: "Physics", theoryMarks: 56, practicalMarks: 28, totalMarks: 84, grade: "A2" },
  { code: "043", name: "Chemistry", theoryMarks: 58, practicalMarks: 28, totalMarks: 86, grade: "A2" },
  { code: "083", name: "Computer Science", theoryMarks: 60, practicalMarks: 28, totalMarks: 88, grade: "A1" },
];

/**
 * Executes a realistic, deterministic simulation of the DigiLocker / CBSE Academic Gateway.
 */
export async function simulateMarksVerification(
  request: { rollNumber: string; year: number; studentName?: string },
  context?: AdapterExecutionContext
): Promise<CanonicalAdapterResult<MarksPayload>> {
  const rollNumber = (request.rollNumber || "").trim();
  const requestId = context?.requestId || `CBSE-SIM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const retrievedAt = new Date().toISOString();
  const masked = maskRollNumber(rollNumber);

  const scenario = resolveMarksScenario(rollNumber, context);

  // Realistic bounded simulated latency (skipped in unit test suites if requested)
  if (!context?.skipLatency) {
    const latencyMs = scenario === "TIMEOUT" ? 350 : 120;
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }

  // Simulated Document Reference (DocURI representation)
  // NOTE: This represents a simulation example of the tripartite <orgId>-<doctype>-<docId> format
  const simulatedDocRef = `in.gov.cbse-HSMRK-${rollNumber}_${request.year}`;

  const baseProvenance: ProvenanceMetadata = {
    sourceId: "CBSE_DIGILOCKER",
    sourceName: "Central Board of Secondary Education (via DigiLocker Sandbox)",
    department: "Ministry of Education, Government of India",
    mode: "SIMULATED",
    requestId,
    recordId: simulatedDocRef,
    retrievedAt,
    adapterVersion: "2.1.0-sim",
    signatureMetadata: {
      signerIdentity: "Controller of Examinations, CBSE, Preet Vihar, Delhi",
      algorithm: "SHA256withRSA (W3C XML-DSig)",
      isSimulated: true, // EXPLICIT SIMULATION DISCLOSURE
    },
  };

  switch (scenario) {
    case "SUCCESS": {
      const studentName = request.studentName || "Aryan Mehta";
      const idMatch = performApplicationIdentityMatch(studentName, request.studentName);

      const data: MarksPayload = {
        percentage: 87.4,
        rollNumber,
        studentName,
        motherName: "Sunita Mehta",
        fatherName: "Rajesh Mehta",
        year: request.year || 2025,
        class: 12,
        grade: "A+",
        schoolCode: "25142",
        schoolName: "Delhi Public School, R.K. Puram, New Delhi",
        subjects: DEFAULT_SUCCESS_SUBJECTS,
        resultStatus: "PASS",
        source: "CBSE_DIGILOCKER_MOCK",
        digitalSignatureValid: true, // Compatibility flag only (authenticityStatus is authoritative)
        issuedBy: "CENTRAL BOARD OF SECONDARY EDUCATION",
        issuedOn: "2025-05-13",
        documentReference: simulatedDocRef,
        identityMatch: {
          status: idMatch.status,
          confidence: idMatch.confidence,
          matchedName: studentName,
          claimedName: request.studentName,
          details: idMatch.details,
        },
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "SIGNATURE_SIMULATED", // Not genuine X.509 cryptographic validation
        freshnessStatus: "FRESH",                  // Year 2025 matches current academic intake
        validityStatus: "VALID",
        provenance: {
          ...baseProvenance,
          issuedAt: "2025-05-13T00:00:00Z",
          sourceUpdatedAt: "2025-05-15T12:00:00Z",
        },
        data,
      };
    }

    case "STALE_ACADEMIC_RECORD": {
      // Models an authentic record from 2018 (outside CivicPulse 2024-2025 scholarship intake window)
      const studentName = request.studentName || "Aryan Mehta";
      const idMatch = performApplicationIdentityMatch(studentName, request.studentName);

      const data: MarksPayload = {
        percentage: 82.0,
        rollNumber,
        studentName,
        motherName: "Sunita Mehta",
        fatherName: "Rajesh Mehta",
        year: 2018,
        class: 12,
        grade: "A",
        schoolCode: "25142",
        schoolName: "Delhi Public School, R.K. Puram, New Delhi",
        resultStatus: "PASS",
        source: "CBSE_DIGILOCKER_MOCK",
        digitalSignatureValid: true,
        issuedBy: "CENTRAL BOARD OF SECONDARY EDUCATION",
        issuedOn: "2018-05-26",
        documentReference: `in.gov.cbse-HSMRK-${rollNumber}_2018`,
        identityMatch: {
          status: idMatch.status,
          confidence: idMatch.confidence,
          matchedName: studentName,
          claimedName: request.studentName,
          details: idMatch.details,
        },
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "SIGNATURE_SIMULATED",
        freshnessStatus: "STALE",                  // Stale relative to scholarship scheme policy
        validityStatus: "VALID",                   // Document itself remains permanently valid at source
        provenance: {
          ...baseProvenance,
          issuedAt: "2018-05-26T00:00:00Z",
          sourceUpdatedAt: "2018-05-28T10:00:00Z",
        },
        data,
      };
    }

    case "INVALID_DOCUMENT": {
      // Models an authentic board record with a result of COMPARTMENT (46.2% score)
      const studentName = request.studentName || "Aryan Mehta";
      const idMatch = performApplicationIdentityMatch(studentName, request.studentName);

      const compartmentSubjects: SubjectScore[] = [
        { code: "301", name: "English Core", theoryMarks: 45, practicalMarks: 12, totalMarks: 57, grade: "C1" },
        { code: "041", name: "Mathematics", theoryMarks: 35, practicalMarks: 10, totalMarks: 45, grade: "D" },
        { code: "042", name: "Physics", theoryMarks: 18, practicalMarks: 10, totalMarks: 28, grade: "E" }, // Compartment
        { code: "043", name: "Chemistry", theoryMarks: 38, practicalMarks: 14, totalMarks: 52, grade: "C2" },
        { code: "083", name: "Computer Science", theoryMarks: 35, practicalMarks: 14, totalMarks: 49, grade: "D" },
      ];

      const data: MarksPayload = {
        percentage: 46.2,
        rollNumber,
        studentName,
        year: request.year || 2025,
        class: 12,
        grade: "D",
        schoolCode: "25142",
        schoolName: "Delhi Public School, R.K. Puram, New Delhi",
        subjects: compartmentSubjects,
        resultStatus: "COMPARTMENT",
        source: "CBSE_DIGILOCKER_MOCK",
        digitalSignatureValid: true,
        issuedBy: "CENTRAL BOARD OF SECONDARY EDUCATION",
        issuedOn: "2025-05-13",
        documentReference: simulatedDocRef,
        identityMatch: {
          status: idMatch.status,
          confidence: idMatch.confidence,
          matchedName: studentName,
          claimedName: request.studentName,
          details: idMatch.details,
        },
      };

      return {
        success: true,
        verificationStatus: "DATA_VERIFIED",
        authenticityStatus: "SIGNATURE_SIMULATED",
        freshnessStatus: "FRESH",
        validityStatus: "VALID", // Document is valid, but resultStatus fails merit threshold
        provenance: {
          ...baseProvenance,
          issuedAt: "2025-05-13T00:00:00Z",
        },
        data,
      };
    }

    case "IDENTITY_MISMATCH": {
      // Document belongs to a different student ("Rohan Verma")
      const certName = "Rohan Verma";
      const idMatch = performApplicationIdentityMatch(certName, request.studentName || "Aryan Mehta");

      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "SIGNATURE_SIMULATED",
        freshnessStatus: "FRESH",
        validityStatus: "VALID",
        provenance: baseProvenance,
        error: {
          code: "VERIFICATION_FAILED",
          message: `Application identity mismatch: Academic certificate is issued to "${certName}", but applicant is "${request.studentName || "Aryan Mehta"}".`,
          category: "VALIDATION",
          upstreamStatusCode: 422,
          details: {
            certificateName: certName,
            claimedName: request.studentName,
            matchConfidence: idMatch.confidence,
            matchStatus: idMatch.status,
          },
        },
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
          message: `No Class XII academic marksheet record found in CBSE Parinam Manjusha registry for roll number ${masked} and year ${request.year}.`,
          category: "UPSTREAM_ERROR",
          upstreamStatusCode: 404,
          details: {
            rollNumberMasked: masked,
            year: request.year,
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
          message: `Malformed CBSE roll number: "${rollNumber}". Roll number must be exactly 8 numeric digits.`,
          category: "VALIDATION",
          upstreamStatusCode: 400,
          details: {
            expectedFormat: "^\\d{8}$",
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
          message: "Explicit citizen authorization token required. Educational records cannot be retrieved without DPDP-compliant consent.",
          category: "CONSENT",
          upstreamStatusCode: 403,
          details: {
            requiredPurpose: "ACADEMIC_RECORD_FETCH",
          },
        },
      };
    }

    case "CONSENT_REVOKED": {
      return {
        success: false,
        verificationStatus: "VERIFICATION_FAILED",
        authenticityStatus: "UNAUTHENTICATED",
        freshnessStatus: "UNKNOWN",
        validityStatus: "UNKNOWN",
        provenance: baseProvenance,
        error: {
          code: "CONSENT_REQUIRED",
          message: "The citizen has revoked consent for academic record verification. Operation aborted.",
          category: "CONSENT",
          upstreamStatusCode: 403,
          details: {
            consentStatus: "REVOKED",
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
          message: "CBSE Parinam Manjusha / DigiLocker National Academic Depository service is temporarily unavailable (HTTP 503).",
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
          message: "Connection to DigiLocker repository gateway timed out after 5000ms.",
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
          message: "API Setu / DigiLocker partner throughput quota exceeded. Throttling applied.",
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
