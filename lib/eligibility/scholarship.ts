/**
 * CivicPulse Higher Education Scholarship Eligibility Module.
 * Backwards-compatible facade over the centralized B4 Rule Engine.
 */

import { normalizeApplicationFacts } from "./normalizer.ts";
import { evaluateEligibility, SCHOLARSHIP_RULE_SET } from "./engine.ts";
import type {
  ExplainableEligibilityDecision,
  ApplicantProfile,
  NormalizedApplicationFacts,
} from "./types.ts";

export * from "./types.ts";
export * from "./normalizer.ts";
export * from "./engine.ts";

export interface EligibilityResult {
  approved: boolean;
  criteria: EligibilityCriterion[];
  scholarshipAmount: number;
  rejectionReasons: string[];
}

export interface IncomeData {
  annualIncome: number;
  holderName?: string;
  source?: string;
  digitallyVerified?: boolean;
  verificationStatus?: string;
  freshnessStatus?: string;
  provenance?: any;
}

export interface MarksData {
  percentage: number;
  rollNumber: string;
  studentName: string;
  year?: number;
  class?: number;
  resultStatus?: "PASS" | "COMPARTMENT" | "ESSENTIAL_REPEAT";
  source?: string;
  digitalSignatureValid?: boolean;
  verificationStatus?: string;
  freshnessStatus?: string;
  authenticityStatus?: string;
  identityMatch?: any;
  provenance?: any;
}

export interface CasteData {
  category: string;
  certificateId: string;
  source?: string;
  subCaste?: string;
  nclValidUntil?: string;
  verificationStatus?: string;
  freshnessStatus?: string;
  provenance?: any;
}

export interface LgdData {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  found?: boolean;
  provenance?: any;
}

export interface BankData {
  valid: boolean;
  bankName: string;
  accountLast4: string;
  registeredName: string;
  ifsc?: string;
  verificationStatus?: string;
  provenance?: any;
}

/**
 * Backwards-compatible facade that converts raw or canonical inputs
 * through the B4 Normalization Layer and evaluates them via the B4 Rule Engine.
 */
export function evaluateScholarshipEligibility(
  income: IncomeData,
  marks: MarksData,
  caste: CasteData,
  lgd: LgdData,
  bank: BankData,
  applicant?: Partial<ApplicantProfile>
): ExplainableEligibilityDecision {
  const applicantProfile: ApplicantProfile = {
    name: applicant?.name || marks.studentName || bank.registeredName || "Applicant",
    mobile: applicant?.mobile,
    aadhaarHash: applicant?.aadhaarHash,
    claimedCategory: caste.category,
    claimedDistrict: lgd.districtName,
    claimedState: lgd.stateName,
  };

  // Convert legacy/partially mapped inputs into canonical results for normalizer
  const incomeCanonical = {
    success: income.verificationStatus ? income.verificationStatus === "DATA_VERIFIED" : (income.annualIncome >= 0),
    verificationStatus: (income.verificationStatus || (income.annualIncome >= 0 ? "DATA_VERIFIED" : "VERIFICATION_FAILED")) as any,
    authenticityStatus: "UNAUTHENTICATED" as const,
    freshnessStatus: (income.freshnessStatus || "FRESH") as any,
    validityStatus: "VALID" as const,
    provenance: income.provenance || {
      sourceId: income.source || "INCOME_TAX_DEPT",
      sourceName: "Income Tax Department",
      mode: "SIMULATED" as const,
      requestId: `INC-FACADE-${Date.now()}`,
      retrievedAt: new Date().toISOString(),
    },
    data: {
      annualIncome: income.annualIncome,
      pan: "ABCDE1234F",
      source: income.source || "INCOME_TAX_DEPT",
      verifiedAt: new Date().toISOString(),
    },
  };

  const marksCanonical = {
    success: marks.verificationStatus ? marks.verificationStatus === "DATA_VERIFIED" : true,
    verificationStatus: (marks.verificationStatus || "DATA_VERIFIED") as any,
    authenticityStatus: (marks.authenticityStatus || (marks.digitalSignatureValid ? "SIGNATURE_SIMULATED" : "UNAUTHENTICATED")) as any,
    freshnessStatus: (marks.freshnessStatus || (marks.year && marks.year < 2024 ? "STALE" : "FRESH")) as any,
    validityStatus: "VALID" as const,
    provenance: marks.provenance || {
      sourceId: marks.source || "CBSE_DIGILOCKER",
      sourceName: "Central Board of Secondary Education",
      mode: "SIMULATED" as const,
      requestId: `CBSE-FACADE-${Date.now()}`,
      retrievedAt: new Date().toISOString(),
      signatureMetadata: {
        signerIdentity: "Controller of Examinations, CBSE",
        algorithm: "SHA256withRSA",
        isSimulated: true,
      },
    },
    data: {
      percentage: marks.percentage,
      rollNumber: marks.rollNumber,
      studentName: marks.studentName,
      year: marks.year || 2025,
      class: marks.class || 12,
      resultStatus: marks.resultStatus || "PASS",
      source: marks.source || "CBSE_DIGILOCKER",
      digitalSignatureValid: !!marks.digitalSignatureValid,
      identityMatch: marks.identityMatch,
    },
  };

  const bankCanonical = {
    success: bank.verificationStatus ? bank.verificationStatus === "DATA_VERIFIED" : bank.valid,
    verificationStatus: (bank.verificationStatus || (bank.valid ? "DATA_VERIFIED" : "VERIFICATION_FAILED")) as any,
    authenticityStatus: "UNAUTHENTICATED" as const,
    freshnessStatus: "FRESH" as const,
    validityStatus: "VALID" as const,
    provenance: bank.provenance || {
      sourceId: "RAZORPAY_FAV",
      sourceName: "Fund Account Validation",
      mode: "SIMULATED" as const,
      requestId: `FAV-FACADE-${Date.now()}`,
      retrievedAt: new Date().toISOString(),
    },
    data: {
      valid: bank.valid,
      registeredName: bank.registeredName,
      bankName: bank.bankName,
      ifsc: bank.ifsc || "SBIN0001234",
      accountLast4: bank.accountLast4,
      verifiedAt: new Date().toISOString(),
    },
  };

  const casteCanonical = {
    success: caste.verificationStatus ? caste.verificationStatus === "DATA_VERIFIED" : true,
    verificationStatus: (caste.verificationStatus || "DATA_VERIFIED") as any,
    authenticityStatus: "UNAUTHENTICATED" as const,
    freshnessStatus: (caste.freshnessStatus || "FRESH") as any,
    validityStatus: "VALID" as const,
    provenance: caste.provenance || {
      sourceId: caste.source || "STATE_REVENUE_PORTAL",
      sourceName: "State Revenue Portal",
      mode: "SIMULATED" as const,
      requestId: `CST-FACADE-${Date.now()}`,
      retrievedAt: new Date().toISOString(),
    },
    data: {
      category: caste.category,
      certificateId: caste.certificateId,
      subCaste: caste.subCaste,
      nclValidUntil: caste.nclValidUntil,
      source: caste.source || "STATE_REVENUE_PORTAL",
    },
  };

  const isLgdResolved = lgd.found !== false && lgd.districtCode.length > 0;
  const lgdCanonical = {
    success: isLgdResolved,
    verificationStatus: (isLgdResolved ? "DATA_VERIFIED" : "VERIFICATION_FAILED") as any,
    authenticityStatus: "UNAUTHENTICATED" as const,
    freshnessStatus: "PERMANENT" as const,
    validityStatus: "VALID" as const,
    provenance: lgd.provenance || {
      sourceId: "LGD_DIRECTORY",
      sourceName: "Local Government Directory",
      mode: "REAL" as const,
      requestId: `LGD-FACADE-${Date.now()}`,
      retrievedAt: new Date().toISOString(),
    },
    data: {
      found: isLgdResolved,
      districtCode: lgd.districtCode,
      districtName: lgd.districtName,
      stateCode: lgd.stateCode,
      stateName: lgd.stateName,
      source: "LGD_DIRECTORY",
    },
  };

  const facts: NormalizedApplicationFacts = normalizeApplicationFacts({
    applicant: applicantProfile,
    income: incomeCanonical,
    marks: marksCanonical,
    bank: bankCanonical,
    caste: casteCanonical,
    lgd: lgdCanonical,
  });

  return evaluateEligibility(facts);
}
