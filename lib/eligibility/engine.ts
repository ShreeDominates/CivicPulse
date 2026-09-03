/**
 * CivicPulse B4 Centralized Eligibility Rule Engine.
 * Authoritative, deterministic, versioned, explainable decision-maker.
 */

import type { EligibilityCriterion } from "./scholarship.ts";
import type {
  NormalizedApplicationFacts,
  ExplainableEligibilityDecision,
  RuleEvaluationResult,
  RuleSetMetadata,
  CrossSourceCheckResult,
  EligibilityStatus,
} from "./types.ts";

export const SCHOLARSHIP_RULE_SET: RuleSetMetadata = {
  ruleSetId: "MAHA_HED_SCHOLARSHIP_RULES",
  ruleSetVersion: "2.1.0",
  schemeId: "SCH-HED-2026",
  schemeName: "Maharashtra Higher Education Scholarship 2026 (Merit-cum-Means)",
};

/**
 * Executes the authoritative, deterministic rule set over normalized application facts.
 */
export function evaluateEligibility(facts: NormalizedApplicationFacts): ExplainableEligibilityDecision {
  const evaluatedAt = new Date().toISOString();
  const rules: RuleEvaluationResult[] = [];
  const rejectionReasons: string[] = [];
  const warnings: string[] = [];
  const crossSourceChecks: CrossSourceCheckResult[] = [];

  // Track sources and simulated state
  const sourcesEvaluated: string[] = [];
  let isSimulatedEnvironment = false;
  const evidenceChain: Record<string, { sourceId: string; requestId: string; mode: string; retrievedAt: string }> = {};

  const registerEvidence = (factProv?: { sourceId: string; requestId: string; mode: string; retrievedAt: string; isSimulated: boolean }) => {
    if (factProv) {
      sourcesEvaluated.push(factProv.sourceId);
      if (factProv.isSimulated) isSimulatedEnvironment = true;
      evidenceChain[factProv.sourceId] = {
        sourceId: factProv.sourceId,
        requestId: factProv.requestId,
        mode: factProv.mode,
        retrievedAt: factProv.retrievedAt,
      };
    }
  };

  registerEvidence(facts.income.provenance);
  registerEvidence(facts.academic.provenance);
  registerEvidence(facts.category.provenance);
  registerEvidence(facts.location.provenance);
  registerEvidence(facts.bank.provenance);

  // ============================================================================
  // PHASE 1: VERIFICATION GATES (Data Availability & Upstream Source Integrity)
  // ============================================================================

  // Gate 1: Income Verified
  const incomeGatePass = facts.income.available && facts.income.verificationStatus === "DATA_VERIFIED";
  rules.push({
    ruleId: "GATE_INCOME_VERIFIED",
    ruleName: "Income Source Verification Gate",
    category: "GATE",
    status: incomeGatePass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Income record verified by CBDT / State Revenue",
    actualValue: facts.income.verificationStatus,
    explanation: incomeGatePass
      ? "Income certificate / tax record successfully verified by issuing authority."
      : "Income verification failed or source record not found.",
    source: facts.income.provenance?.sourceName || "Income Gateway",
    evidenceReference: facts.income.provenance?.requestId,
    isSimulated: !!facts.income.provenance?.isSimulated,
  });
  if (!incomeGatePass) rejectionReasons.push("Family income could not be verified with issuing authority");

  // Gate 2: Academic Board Record Verified
  const academicGatePass = facts.academic.available && facts.academic.verificationStatus === "DATA_VERIFIED";
  rules.push({
    ruleId: "GATE_ACADEMIC_VERIFIED",
    ruleName: "Board Marksheet Depository Gate",
    category: "GATE",
    status: academicGatePass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Class 12 record verified in CBSE / DigiLocker National Academic Depository",
    actualValue: facts.academic.verificationStatus,
    explanation: academicGatePass
      ? "Class 12 academic record retrieved and authenticated from board depository."
      : "Class 12 marksheet record was not found or failed depository verification.",
    source: facts.academic.provenance?.sourceName || "Academic Gateway",
    evidenceReference: facts.academic.provenance?.requestId,
    isSimulated: !!facts.academic.provenance?.isSimulated,
  });
  if (!academicGatePass) rejectionReasons.push("Academic marksheet record could not be verified in CBSE depository");

  // Gate 3: Category Certificate Verified
  const categoryGatePass = facts.category.available && facts.category.verificationStatus === "DATA_VERIFIED";
  rules.push({
    ruleId: "GATE_CATEGORY_VERIFIED",
    ruleName: "Category Certificate Verification Gate",
    category: "GATE",
    status: categoryGatePass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Caste / Category certificate verified by State Revenue Department",
    actualValue: facts.category.verificationStatus,
    explanation: categoryGatePass
      ? "Community certificate record verified in state revenue registry."
      : "Community certificate could not be verified in state revenue registry.",
    source: facts.category.provenance?.sourceName || "State Revenue Portal",
    evidenceReference: facts.category.provenance?.requestId,
    isSimulated: !!facts.category.provenance?.isSimulated,
  });
  if (!categoryGatePass) rejectionReasons.push("Category / Caste certificate could not be verified with state registry");

  // Gate 4: Location Resolved via LGD
  const locationGatePass = facts.location.resolved && facts.location.districtCode.length > 0;
  rules.push({
    ruleId: "GATE_LOCATION_RESOLVED",
    ruleName: "LGD Location Normalization Gate",
    category: "GATE",
    status: locationGatePass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "District and State codes successfully resolved in Local Government Directory",
    actualValue: locationGatePass ? `District Code: ${facts.location.districtCode}` : "UNRESOLVED",
    explanation: locationGatePass
      ? `District "${facts.location.districtName}" resolved to LGD code ${facts.location.districtCode}.`
      : `District "${facts.location.districtName}" could not be resolved in LGD directory. Safe rejection applied.`,
    source: facts.location.provenance?.sourceName || "LGD Directory",
    evidenceReference: facts.location.provenance?.requestId,
    isSimulated: false,
  });
  if (!locationGatePass) rejectionReasons.push(`District "${facts.location.districtName}" could not be resolved in Local Government Directory`);

  // Gate 5: Bank Account Validated
  const bankGatePass = facts.bank.available && facts.bank.valid && facts.bank.verificationStatus === "DATA_VERIFIED";
  rules.push({
    ruleId: "GATE_BANK_VALIDATED",
    ruleName: "Bank Account Validation Gate",
    category: "GATE",
    status: bankGatePass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Active bank account verified via NPCI / IMPS Penny-Drop",
    actualValue: bankGatePass ? "ACTIVE_VERIFIED" : "VALIDATION_FAILED",
    explanation: bankGatePass
      ? "Bank account confirmed active and operational by recipient bank CBS."
      : "Bank account validation failed or account is inactive/closed.",
    source: facts.bank.provenance?.sourceName || "Banking Intermediary",
    evidenceReference: facts.bank.provenance?.requestId,
    isSimulated: !!facts.bank.provenance?.isSimulated,
  });
  if (!bankGatePass) rejectionReasons.push("Bank account could not be validated for direct benefit transfer");

  // ============================================================================
  // PHASE 2: CROSS-SOURCE CONSISTENCY & IDENTITY AUDITING
  // ============================================================================

  // Cross-Source 1: Bank Account Holder vs Applicant Identity
  const bankNameMatchPass = facts.bank.nameMatchStatus !== "MISMATCH";
  crossSourceChecks.push({
    checkId: "XSRC_BANK_NAME",
    description: "Bank Account CBS Registered Name vs Applicant Profile",
    pass: bankNameMatchPass,
    details: bankNameMatchPass
      ? `Bank account registered to "${facts.bank.registeredName}" matches applicant "${facts.applicant.name}".`
      : `Bank account registered to "${facts.bank.registeredName}" diverges from applicant "${facts.applicant.name}".`,
  });
  rules.push({
    ruleId: "XSRC_BANK_NAME_MATCH",
    ruleName: "Bank Account Holder Name Consistency",
    category: "CROSS_SOURCE",
    status: bankNameMatchPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Bank account holder name must match applicant profile",
    actualValue: facts.bank.registeredName || "UNKNOWN",
    explanation: bankNameMatchPass
      ? `CBS account name matches applicant "${facts.applicant.name}".`
      : `CBS account name "${facts.bank.registeredName}" does not match applicant "${facts.applicant.name}".`,
    source: "Cross-Source Comparison (Profile vs CBS)",
    isSimulated: false,
  });
  if (!bankNameMatchPass) {
    rejectionReasons.push(`Bank account holder name (${facts.bank.registeredName}) does not match applicant name`);
  } else if (facts.bank.nameMatchStatus === "PARTIAL_MATCH") {
    warnings.push(`Bank account holder name "${facts.bank.registeredName}" is a partial match with applicant "${facts.applicant.name}". Marked for administrative review.`);
  }

  // Cross-Source 2: Academic Candidate vs Applicant Identity
  const academicNameMatchPass = facts.academic.identityMatchStatus !== "MISMATCH";
  crossSourceChecks.push({
    checkId: "XSRC_ACADEMIC_NAME",
    description: "CBSE Marksheet Candidate Name vs Applicant Profile",
    pass: academicNameMatchPass,
    details: academicNameMatchPass
      ? `Marksheet issued to "${facts.academic.candidateName}" matches applicant "${facts.applicant.name}".`
      : `Marksheet issued to "${facts.academic.candidateName}" diverges from applicant "${facts.applicant.name}".`,
  });
  rules.push({
    ruleId: "XSRC_ACADEMIC_NAME_MATCH",
    ruleName: "Academic Candidate Name Consistency",
    category: "CROSS_SOURCE",
    status: academicNameMatchPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Marksheet candidate name must match applicant profile",
    actualValue: facts.academic.candidateName || "UNKNOWN",
    explanation: academicNameMatchPass
      ? `Board certificate name matches applicant "${facts.applicant.name}".`
      : `Board certificate name "${facts.academic.candidateName}" does not match applicant "${facts.applicant.name}".`,
    source: "Cross-Source Comparison (Profile vs CBSE)",
    isSimulated: false,
  });
  if (!academicNameMatchPass) {
    rejectionReasons.push(`Academic marksheet name (${facts.academic.candidateName}) does not match applicant name`);
  } else if (facts.academic.identityMatchStatus === "PARTIAL_MATCH") {
    warnings.push(`Academic candidate name "${facts.academic.candidateName}" is a partial match with applicant "${facts.applicant.name}".`);
  }

  // Cross-Source 3: Academic Freshness Policy (CivicPulse Intake Window >= 2024)
  const academicFreshnessPass = facts.academic.examinationYear >= 2024 && facts.academic.freshnessStatus !== "STALE";
  crossSourceChecks.push({
    checkId: "XSRC_ACADEMIC_FRESHNESS",
    description: "Examination Year Intake Freshness Policy (>= 2024)",
    pass: academicFreshnessPass,
    details: academicFreshnessPass
      ? `Examination year ${facts.academic.examinationYear} is within current scholarship intake cycle.`
      : `Examination year ${facts.academic.examinationYear} is outside current scholarship intake cycle (must be 2024 or 2025).`,
  });
  rules.push({
    ruleId: "XSRC_ACADEMIC_FRESHNESS",
    ruleName: "Academic Record Freshness Window",
    category: "CROSS_SOURCE",
    status: academicFreshnessPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Passing year must be within current scholarship cycle (2024 or 2025)",
    actualValue: `${facts.academic.examinationYear}`,
    explanation: academicFreshnessPass
      ? `Passing year ${facts.academic.examinationYear} meets intake window criteria.`
      : `Passing year ${facts.academic.examinationYear} is stale for this scholarship scheme.`,
    source: "Scholarship Freshness Policy",
    isSimulated: false,
  });
  if (!academicFreshnessPass) rejectionReasons.push(`Class 12 passing year (${facts.academic.examinationYear}) is outside the eligible scholarship cycle`);

  // Cross-Source 4: Category NCL Validity (Non-Creamy Layer Validity)
  const nclValidityPass = !facts.category.isNclExpired && facts.category.freshnessStatus !== "EXPIRED";
  crossSourceChecks.push({
    checkId: "XSRC_CASTE_NCL_VALIDITY",
    description: "Caste Certificate Non-Creamy Layer (NCL) Active Validity",
    pass: nclValidityPass,
    details: nclValidityPass
      ? `Community certificate validity active (Valid until: ${facts.category.nclValidUntil || "N/A"}).`
      : `Community certificate NCL validity expired on ${facts.category.nclValidUntil}.`,
  });
  rules.push({
    ruleId: "XSRC_CASTE_NCL_VALIDITY",
    ruleName: "Non-Creamy Layer Validity Window",
    category: "CROSS_SOURCE",
    status: nclValidityPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Non-Creamy Layer validity must not be expired",
    actualValue: facts.category.nclValidUntil || "N/A",
    explanation: nclValidityPass
      ? "Certificate is within active validity period."
      : `Certificate validity expired on ${facts.category.nclValidUntil}. Renewal required.`,
    source: "State Reservation Rule",
    isSimulated: false,
  });
  if (!nclValidityPass) rejectionReasons.push(`Category certificate validity expired on ${facts.category.nclValidUntil}`);

  // ============================================================================
  // PHASE 3: SCHEME ELIGIBILITY POLICY CRITERIA
  // ============================================================================

  // Criterion 1: Annual Family Income Ceiling (<= 2,50,000)
  const incomeCeilingPass = incomeGatePass && facts.income.annualIncome <= 250000;
  rules.push({
    ruleId: "CRIT_FAMILY_INCOME_CEILING",
    ruleName: "Annual Family Income Ceiling",
    category: "CRITERION",
    status: incomeCeilingPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "≤ ₹2,50,000",
    actualValue: `₹${facts.income.annualIncome.toLocaleString("en-IN")}`,
    explanation: incomeCeilingPass
      ? `Verified income ₹${facts.income.annualIncome.toLocaleString("en-IN")} satisfies economic criteria.`
      : `Income ₹${facts.income.annualIncome.toLocaleString("en-IN")} exceeds the ceiling of ₹2,50,000.`,
    source: facts.income.provenance?.sourceName || "CBDT / Income Tax",
    evidenceReference: facts.income.provenance?.requestId,
    isSimulated: !!facts.income.provenance?.isSimulated,
  });
  if (incomeGatePass && !incomeCeilingPass) {
    rejectionReasons.push(`Income ₹${facts.income.annualIncome.toLocaleString("en-IN")} exceeds the ceiling of ₹2,50,000`);
  }

  // Criterion 2: Academic Merit (>= 75.0% and PASS)
  const academicMeritPass = academicGatePass && facts.academic.percentage >= 75.0 && facts.academic.resultStatus === "PASS";
  rules.push({
    ruleId: "CRIT_BOARD_MERIT_PERCENTAGE",
    ruleName: "12th Board Academic Merit",
    category: "CRITERION",
    status: academicMeritPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "≥ 75.0% and Result: PASS",
    actualValue: `${facts.academic.percentage}% (${facts.academic.resultStatus})`,
    explanation: academicMeritPass
      ? `Aggregate score ${facts.academic.percentage}% meets merit threshold.`
      : `Score ${facts.academic.percentage}% (Result: ${facts.academic.resultStatus}) does not meet merit threshold.`,
    source: facts.academic.provenance?.sourceName || "CBSE Parinam Manjusha",
    evidenceReference: facts.academic.provenance?.requestId,
    isSimulated: !!facts.academic.provenance?.isSimulated,
  });
  if (academicGatePass && !academicMeritPass) {
    if (facts.academic.resultStatus !== "PASS") {
      rejectionReasons.push(`Candidate result is ${facts.academic.resultStatus}; only PASS results are eligible`);
    } else {
      rejectionReasons.push(`Board score ${facts.academic.percentage}% is below the required 75.0% threshold`);
    }
  }

  // Criterion 3: Affirmative Category (SC, ST, OBC, EWS)
  const validCategories = ["SC", "ST", "OBC", "EWS"];
  const categoryMatchPass = categoryGatePass && validCategories.includes(facts.category.category.toUpperCase());
  rules.push({
    ruleId: "CRIT_ELIGIBLE_CATEGORY",
    ruleName: "Affirmative Action Community Category",
    category: "CRITERION",
    status: categoryMatchPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "SC, ST, OBC, or EWS",
    actualValue: facts.category.category,
    explanation: categoryMatchPass
      ? `Community "${facts.category.category}" is eligible for post-matric scholarship.`
      : `Community "${facts.category.category}" is not eligible for this targeted scheme.`,
    source: facts.category.provenance?.sourceName || "State Revenue Department",
    evidenceReference: facts.category.provenance?.requestId,
    isSimulated: !!facts.category.provenance?.isSimulated,
  });
  if (categoryGatePass && !categoryMatchPass) {
    rejectionReasons.push(`Category "${facts.category.category}" is not eligible for this scholarship scheme`);
  }

  // Criterion 4: Maharashtra State Domicile (LGD State Code 27)
  const domicilePass = locationGatePass && facts.location.isMaharashtra;
  rules.push({
    ruleId: "CRIT_MAHARASHTRA_DOMICILE",
    ruleName: "Maharashtra State Domicile",
    category: "CRITERION",
    status: domicilePass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "LGD State Code 27 (Maharashtra)",
    actualValue: `${facts.location.districtName} (${facts.location.stateName || "State " + facts.location.stateCode})`,
    explanation: domicilePass
      ? `District ${facts.location.districtName} is confirmed within Maharashtra (LGD Code 27).`
      : `District ${facts.location.districtName} belongs to state code ${facts.location.stateCode || "UNRESOLVED"} (Maharashtra required).`,
    source: facts.location.provenance?.sourceName || "Local Government Directory",
    evidenceReference: facts.location.provenance?.requestId,
    isSimulated: false,
  });
  if (locationGatePass && !domicilePass) {
    rejectionReasons.push(`Applicant location (${facts.location.stateName || "Outside State"}) does not satisfy Maharashtra domicile criteria`);
  }

  // Criterion 5: Active Bank Account for DBT Disbursement
  const bankAccountPass = bankGatePass && bankNameMatchPass;
  rules.push({
    ruleId: "CRIT_ACTIVE_DBT_BANK_ACCOUNT",
    ruleName: "Valid DBT-Linked Bank Account",
    category: "CRITERION",
    status: bankAccountPass ? "PASS" : "FAIL",
    severity: "CRITICAL",
    requirement: "Active bank account with verified name match",
    actualValue: `${facts.bank.bankName} XXXX${facts.bank.accountLast4}`,
    explanation: bankAccountPass
      ? `Account verified and operational for Direct Benefit Transfer.`
      : "Bank account failed validation or name mismatch detected.",
    source: facts.bank.provenance?.sourceName || "Banking Gateway",
    evidenceReference: facts.bank.provenance?.requestId,
    isSimulated: !!facts.bank.provenance?.isSimulated,
  });

  // ============================================================================
  // PHASE 4: DECISION SYNTHESIS & EXPLANATION
  // ============================================================================

  const allGatesPassed = incomeGatePass && academicGatePass && categoryGatePass && locationGatePass && bankGatePass;
  const allCrossSourcePassed = bankNameMatchPass && academicNameMatchPass && academicFreshnessPass && nclValidityPass;
  const allCriteriaPassed = incomeCeilingPass && academicMeritPass && categoryMatchPass && domicilePass && bankAccountPass;

  const approved = allGatesPassed && allCrossSourcePassed && allCriteriaPassed;

  let status: EligibilityStatus;
  if (approved) {
    status = "ELIGIBLE";
  } else if (!allGatesPassed) {
    // If a required gate failed because of an upstream timeout or service downtime
    const isUpstreamDowntime =
      facts.income.verificationStatus === "NOT_VERIFIED" ||
      facts.academic.verificationStatus === "NOT_VERIFIED" ||
      facts.bank.verificationStatus === "NOT_VERIFIED" ||
      facts.category.verificationStatus === "NOT_VERIFIED";
    status = isUpstreamDowntime ? "INCOMPLETE" : "NOT_ELIGIBLE";
  } else {
    status = "NOT_ELIGIBLE";
  }

  const scholarshipAmount = approved ? 48000 : 0;
  const confidenceScore = approved ? 1.0 : 0.0;

  // Summary generation with transparent provenance disclosure
  let summary = "";
  if (approved) {
    if (isSimulatedEnvironment) {
      summary = `Eligible for scholarship grant of ₹${scholarshipAmount.toLocaleString("en-IN")} based on simulated verification evidence across ${sourcesEvaluated.length} authorized sources.`;
    } else {
      summary = `Eligible for scholarship grant of ₹${scholarshipAmount.toLocaleString("en-IN")} based on live verified government records.`;
    }
  } else {
    summary = `Application evaluated as ${status.replace("_", " ")}: ${rejectionReasons.length} requirement(s) failed or unverified.`;
  }

  // Format criteria for backwards-compatible UI rendering in EligibilityCard
  const criteria: EligibilityCriterion[] = [
    {
      label: "Annual Family Income ≤ ₹2,50,000",
      actualValue: `₹${facts.income.annualIncome.toLocaleString("en-IN")}`,
      threshold: "≤ ₹2,50,000",
      pass: incomeCeilingPass,
      description: `Verified by ${facts.income.provenance?.sourceId || "INCOME_TAX_DEPT"}`,
    },
    {
      label: "12th Board Percentage ≥ 75%",
      actualValue: `${facts.academic.percentage}%`,
      threshold: "≥ 75%",
      pass: academicMeritPass,
      description: `Score from ${facts.academic.provenance?.sourceId || "CBSE_DIGILOCKER"}${facts.academic.authenticityStatus === "SIGNATURE_SIMULATED" ? " (Digitally Signed ✓)" : ""}`,
    },
    {
      label: "Category: SC / ST / OBC / EWS",
      actualValue: facts.category.category,
      threshold: "SC, ST, OBC, or EWS",
      pass: categoryMatchPass,
      description: `Certificate: ${facts.category.certificateId || "N/A"}`,
    },
    {
      label: "Maharashtra Domicile (LGD State 27)",
      actualValue: `${facts.location.districtName} (${facts.location.stateName || "State " + facts.location.stateCode})`,
      threshold: "LGD State Code 27",
      pass: domicilePass,
      description: `LGD District Code: ${facts.location.districtCode || "UNRESOLVED"}`,
    },
    {
      label: "Valid Bank Account",
      actualValue: `${facts.bank.bankName || "Bank"} XXXX${facts.bank.accountLast4}`,
      threshold: "Verified & name matches",
      pass: bankAccountPass,
      description: `Registered to: ${facts.bank.registeredName || "Unknown"}`,
    },
  ];

  return {
    approved,
    status,
    scholarshipAmount,
    confidenceScore,
    ruleSet: SCHOLARSHIP_RULE_SET,
    evaluatedAt,
    summary,
    criteria,
    rules,
    rejectionReasons,
    warnings,
    crossSourceChecks,
    provenanceSummary: {
      isSimulatedEnvironment,
      sourcesEvaluated,
      evidenceChain,
    },
    normalizedFacts: facts,
  };
}
