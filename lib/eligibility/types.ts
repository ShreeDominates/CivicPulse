/**
 * CivicPulse B4 Normalization & Rule Engine Type Definitions.
 * Strict provider-independent domain facts and explainable decision contracts.
 */

export interface EligibilityCriterion {
  label: string;
  actualValue: string;
  threshold: string;
  pass: boolean;
  description: string;
}

export interface ApplicantProfile {
  id?: string;
  name: string;
  mobile?: string;
  aadhaarHash?: string;
  claimedPan?: string;
  claimedCategory?: string;
  claimedDistrict?: string;
  claimedState?: string;
}

export interface NormalizedFactProvenance {
  sourceId: string;
  sourceName: string;
  department?: string;
  mode: "REAL" | "SIMULATED" | "NOT_IMPLEMENTED";
  requestId: string;
  recordId?: string;
  retrievedAt: string;
  isSimulated: boolean;
}

export interface NormalizedIdentityFact {
  verified: boolean;
  claimedName: string;
  matchedSources: string[];
  divergentSources: string[];
}

export interface NormalizedIncomeFact {
  available: boolean;
  annualIncome: number;
  assessmentYear?: string;
  taxFiled?: boolean;
  verificationStatus: "DATA_VERIFIED" | "VERIFICATION_FAILED" | "NOT_VERIFIED";
  freshnessStatus: "FRESH" | "STALE" | "EXPIRED" | "UNKNOWN";
  validityStatus: "VALID" | "EXPIRED" | "REVOKED" | "UNKNOWN";
  provenance?: NormalizedFactProvenance;
}

export interface NormalizedAcademicFact {
  available: boolean;
  percentage: number;
  examinationYear: number;
  resultStatus: "PASS" | "COMPARTMENT" | "ESSENTIAL_REPEAT" | "UNKNOWN";
  candidateName: string;
  identityMatchStatus: "MATCH" | "PARTIAL_MATCH" | "MISMATCH" | "NOT_CHECKED";
  identityMatchConfidence: number;
  verificationStatus: "DATA_VERIFIED" | "VERIFICATION_FAILED" | "NOT_VERIFIED";
  freshnessStatus: "FRESH" | "STALE" | "EXPIRED" | "UNKNOWN";
  authenticityStatus: "SIGNATURE_SIMULATED" | "UNAUTHENTICATED";
  documentReference?: string;
  provenance?: NormalizedFactProvenance;
}

export interface NormalizedCategoryFact {
  available: boolean;
  category: string;
  certificateId: string;
  subCaste?: string;
  nclValidUntil?: string;
  isNclExpired: boolean;
  verificationStatus: "DATA_VERIFIED" | "VERIFICATION_FAILED" | "NOT_VERIFIED";
  freshnessStatus: "FRESH" | "STALE" | "EXPIRED" | "UNKNOWN";
  validityStatus: "VALID" | "EXPIRED" | "REVOKED" | "UNKNOWN";
  provenance?: NormalizedFactProvenance;
}

export interface NormalizedLocationFact {
  resolved: boolean;
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  isMaharashtra: boolean;
  provenance?: NormalizedFactProvenance;
}

export interface NormalizedBankFact {
  available: boolean;
  valid: boolean;
  registeredName: string;
  bankName: string;
  ifsc: string;
  accountLast4: string;
  nameMatchStatus: "MATCH" | "PARTIAL_MATCH" | "MISMATCH";
  nameMatchConfidence: number;
  verificationStatus: "DATA_VERIFIED" | "VERIFICATION_FAILED" | "NOT_VERIFIED";
  provenance?: NormalizedFactProvenance;
}

/**
 * Authoritative normalized facts container passed to the rule engine.
 */
export interface NormalizedApplicationFacts {
  applicant: ApplicantProfile;
  identity: NormalizedIdentityFact;
  income: NormalizedIncomeFact;
  academic: NormalizedAcademicFact;
  category: NormalizedCategoryFact;
  location: NormalizedLocationFact;
  bank: NormalizedBankFact;
  normalizedAt: string;
}

export type RuleStatus = "PASS" | "FAIL" | "UNKNOWN";
export type RuleSeverity = "CRITICAL" | "STANDARD";
export type EligibilityStatus = "ELIGIBLE" | "NOT_ELIGIBLE" | "INCOMPLETE" | "NEEDS_REVIEW";

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  category: "GATE" | "CROSS_SOURCE" | "CRITERION";
  status: RuleStatus;
  severity: RuleSeverity;
  requirement: string;
  actualValue: string;
  explanation: string;
  source: string;
  evidenceReference?: string;
  isSimulated: boolean;
}

export interface RuleSetMetadata {
  ruleSetId: string;
  ruleSetVersion: string;
  schemeId: string;
  schemeName: string;
}

export interface CrossSourceCheckResult {
  checkId: string;
  description: string;
  pass: boolean;
  details: string;
}

/**
 * Authoritative explainable eligibility decision returned by the engine.
 */
export interface ExplainableEligibilityDecision {
  approved: boolean; // Backwards compatibility for UI
  status: EligibilityStatus;
  scholarshipAmount: number;
  confidenceScore: number;
  ruleSet: RuleSetMetadata;
  evaluatedAt: string;
  summary: string;
  criteria: EligibilityCriterion[]; // UI card compatibility
  rules: RuleEvaluationResult[];    // Comprehensive explainable rule trace
  rejectionReasons: string[];
  warnings: string[];
  crossSourceChecks: CrossSourceCheckResult[];
  provenanceSummary: {
    isSimulatedEnvironment: boolean;
    sourcesEvaluated: string[];
    evidenceChain: Record<string, { sourceId: string; requestId: string; mode: string; retrievedAt: string }>;
  };
  normalizedFacts?: NormalizedApplicationFacts;
}
