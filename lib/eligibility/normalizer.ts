/**
 * CivicPulse B4 Normalization Layer.
 * Decouples raw B3 canonical provider results from eligibility rules.
 */

import type {
  CanonicalAdapterResult,
  IncomePayload,
  MarksPayload,
  BankPayload,
  CastePayload,
  LgdPayload,
  ProvenanceMetadata,
} from "../govapi/types.ts";
import type {
  ApplicantProfile,
  NormalizedApplicationFacts,
  NormalizedFactProvenance,
  NormalizedIdentityFact,
  NormalizedIncomeFact,
  NormalizedAcademicFact,
  NormalizedCategoryFact,
  NormalizedLocationFact,
  NormalizedBankFact,
} from "./types.ts";

/**
 * Normalizes provenance metadata into a clean fact-level summary.
 */
function extractProvenance(prov?: ProvenanceMetadata): NormalizedFactProvenance | undefined {
  if (!prov) return undefined;
  return {
    sourceId: prov.sourceId,
    sourceName: prov.sourceName,
    department: prov.department,
    mode: prov.mode,
    requestId: prov.requestId,
    recordId: prov.recordId,
    retrievedAt: prov.retrievedAt,
    isSimulated: prov.mode === "SIMULATED",
  };
}

/**
 * Normalizes tokenized name comparisons between applicant profile and external registry.
 */
export function compareNames(
  nameA?: string,
  nameB?: string
): { match: boolean; status: "MATCH" | "PARTIAL_MATCH" | "MISMATCH"; confidence: number } {
  if (!nameA || !nameB) {
    return { match: false, status: "MISMATCH", confidence: 0 };
  }

  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const tokensA = clean(nameA);
  const tokensB = clean(nameB);

  if (tokensA.join(" ") === tokensB.join(" ")) {
    return { match: true, status: "MATCH", confidence: 1.0 };
  }

  const overlap = tokensA.filter((t) => tokensB.includes(t));
  const maxLen = Math.max(tokensA.length, tokensB.length);
  const ratio = overlap.length / (maxLen || 1);

  if (ratio >= 0.6) {
    return { match: true, status: "PARTIAL_MATCH", confidence: parseFloat(ratio.toFixed(2)) };
  }

  return { match: false, status: "MISMATCH", confidence: parseFloat(ratio.toFixed(2)) };
}

/**
 * Transforms B3 canonical results into provider-independent business facts.
 */
export function normalizeApplicationFacts(inputs: {
  applicant: ApplicantProfile;
  income?: CanonicalAdapterResult<IncomePayload>;
  marks?: CanonicalAdapterResult<MarksPayload>;
  bank?: CanonicalAdapterResult<BankPayload>;
  caste?: CanonicalAdapterResult<CastePayload>;
  lgd?: CanonicalAdapterResult<LgdPayload>;
}): NormalizedApplicationFacts {
  const { applicant, income, marks, bank, caste, lgd } = inputs;
  const now = new Date();

  // 1. Identity Normalization & Cross-Source Tracking
  const matchedSources: string[] = [];
  const divergentSources: string[] = [];

  const candidateName = marks?.data?.studentName || marks?.error?.details?.certificateName;
  if (candidateName) {
    const marksNameCheck = compareNames(applicant.name, candidateName);
    if (marksNameCheck.match) {
      matchedSources.push("CBSE_DIGILOCKER");
    } else {
      divergentSources.push(`CBSE_DIGILOCKER (Certificate issued to "${candidateName}")`);
    }
  }

  const cbsHolderName = bank?.data?.registeredName || bank?.error?.details?.cbsRegisteredName;
  if (cbsHolderName) {
    const bankNameCheck = compareNames(applicant.name, cbsHolderName);
    if (bankNameCheck.match) {
      matchedSources.push("RAZORPAY_FAV");
    } else {
      divergentSources.push(`RAZORPAY_FAV (CBS Account registered to "${cbsHolderName}")`);
    }
  }

  const identityFact: NormalizedIdentityFact = {
    verified: divergentSources.length === 0 && matchedSources.length > 0,
    claimedName: applicant.name,
    matchedSources,
    divergentSources,
  };

  // 2. Income Normalization
  const incomeFact: NormalizedIncomeFact = {
    available: !!income?.success && !!income?.data,
    annualIncome: income?.data?.annualIncome ?? 0,
    assessmentYear: income?.data?.assessmentYear,
    taxFiled: income?.data?.taxFiled,
    verificationStatus: income?.verificationStatus || "NOT_VERIFIED",
    freshnessStatus: income?.freshnessStatus || "UNKNOWN",
    validityStatus: income?.validityStatus || "UNKNOWN",
    provenance: extractProvenance(income?.provenance),
  };

  // 3. Academic Normalization
  const marksData = marks?.data;
  const rawCandidateName = marksData?.studentName || marks?.error?.details?.certificateName || "";
  const academicNameCheck = rawCandidateName
    ? compareNames(applicant.name, rawCandidateName)
    : { status: "NOT_CHECKED" as const, confidence: 0 };

  const isMarksIdentityMismatch = marks?.error?.code === "VERIFICATION_FAILED" && marks?.error?.details?.matchStatus === "MISMATCH";

  const academicFact: NormalizedAcademicFact = {
    available: (!!marks?.success && !!marksData) || isMarksIdentityMismatch,
    percentage: marksData?.percentage ?? 0,
    examinationYear: marksData?.year ?? 0,
    resultStatus: marksData?.resultStatus || (marks?.success ? "PASS" : "UNKNOWN"),
    candidateName: rawCandidateName,
    identityMatchStatus: (marksData?.identityMatch?.status || marks?.error?.details?.matchStatus || academicNameCheck.status) as any,
    identityMatchConfidence: marksData?.identityMatch?.confidence ?? marks?.error?.details?.matchConfidence ?? academicNameCheck.confidence,
    verificationStatus: isMarksIdentityMismatch ? "DATA_VERIFIED" : (marks?.verificationStatus || "NOT_VERIFIED"),
    freshnessStatus: marks?.freshnessStatus || "UNKNOWN",
    authenticityStatus: marks?.authenticityStatus || "UNAUTHENTICATED",
    documentReference: marksData?.documentReference,
    provenance: extractProvenance(marks?.provenance),
  };

  // 4. Category Normalization
  const casteData = caste?.data;
  let isNclExpired = false;
  if (casteData?.nclValidUntil) {
    try {
      const expiry = new Date(casteData.nclValidUntil);
      if (expiry < now) isNclExpired = true;
    } catch {}
  }

  const categoryFact: NormalizedCategoryFact = {
    available: !!caste?.success && !!casteData,
    category: (casteData?.category || applicant.claimedCategory || "").toUpperCase(),
    certificateId: casteData?.certificateId || "",
    subCaste: casteData?.subCaste,
    nclValidUntil: casteData?.nclValidUntil,
    isNclExpired,
    verificationStatus: caste?.verificationStatus || "NOT_VERIFIED",
    freshnessStatus: isNclExpired ? "EXPIRED" : (caste?.freshnessStatus || "UNKNOWN"),
    validityStatus: isNclExpired ? "EXPIRED" : (caste?.validityStatus || "UNKNOWN"),
    provenance: extractProvenance(caste?.provenance),
  };

  // 5. Location Normalization
  const lgdData = lgd?.data;
  const isResolved = !!lgd?.success && !!lgdData && lgdData.found && lgdData.districtCode.length > 0;
  const locationFact: NormalizedLocationFact = {
    resolved: isResolved,
    districtCode: lgdData?.districtCode || "",
    districtName: lgdData?.districtName || applicant.claimedDistrict || "",
    stateCode: lgdData?.stateCode || "",
    stateName: lgdData?.stateName || applicant.claimedState || "",
    isMaharashtra: isResolved && lgdData.stateCode === "27",
    provenance: extractProvenance(lgd?.provenance),
  };

  // 6. Bank Normalization
  const bankData = bank?.data;
  const bankNameCheck = bankData
    ? compareNames(applicant.name, bankData.registeredName)
    : { status: "MISMATCH" as const, confidence: 0 };

  const bankFact: NormalizedBankFact = {
    available: !!bank?.success && !!bankData,
    valid: !!bankData?.valid,
    registeredName: bankData?.registeredName || "",
    bankName: bankData?.bankName || "",
    ifsc: bankData?.ifsc || "",
    accountLast4: bankData?.accountLast4 || "",
    nameMatchStatus: bankNameCheck.status,
    nameMatchConfidence: bankNameCheck.confidence,
    verificationStatus: bank?.verificationStatus || "NOT_VERIFIED",
    provenance: extractProvenance(bank?.provenance),
  };

  return {
    applicant,
    identity: identityFact,
    income: incomeFact,
    academic: academicFact,
    category: categoryFact,
    location: locationFact,
    bank: bankFact,
    normalizedAt: now.toISOString(),
  };
}
