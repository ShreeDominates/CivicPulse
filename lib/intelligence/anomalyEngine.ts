/**
 * CivicPulse B7 Application Integrity & Cross-Evidence Anomaly Intelligence Engine.
 *
 * NOTE: DETERMINISTIC HEURISTIC INTELLIGENCE.
 * Evaluates multi-source token consistency, near-expiry proximity, and evidence completeness.
 *
 * CRITICAL SAFETY BOUNDARY:
 * This engine is strictly advisory and operational.
 * It DOES NOT decide or alter B4 statutory eligibility.
 */

import type { NormalizedApplicationFacts } from "../eligibility/types.ts";
import type {
  ApplicationIntelligenceInsight,
  DetectedAnomaly,
  EvidenceCompleteness,
} from "./types.ts";

export class AnomalyIntelligenceEngine {
  public static readonly VERSION = "1.0.0";
  public static readonly ANALYZER_NAME = "CivicPulse Cross-Evidence Integrity Analyzer";

  /**
   * Analyzes normalized application facts and produces an explainable intelligence insight.
   */
  public static analyze(facts: NormalizedApplicationFacts): ApplicationIntelligenceInsight {
    const anomalies: DetectedAnomaly[] = [];
    let riskScore = 0;

    // ------------------------------------------------------------------------
    // 1. Cross-Source Identity Coherence Analysis
    // ------------------------------------------------------------------------
    const claimedName = ((facts.applicant as any).claimedName || (facts.applicant as any).name || "").trim().toUpperCase();
    const bankName = (facts.bank.accountHolderName || "").trim().toUpperCase();
    const marksName = (facts.academic.candidateName || "").trim().toUpperCase();

    let nameMatches = 0;
    let totalNameSources = 1; // Claimed name is base

    if (marksName) {
      totalNameSources++;
      if (marksName === claimedName) {
        nameMatches++;
      } else if (this.isPartialMatch(claimedName, marksName)) {
        nameMatches += 0.5;
        anomalies.push({
          anomalyCode: "IDENTITY_TOKEN_VARIANCE_ACADEMIC",
          severity: "WARNING",
          description: `Applicant name "${facts.applicant.claimedName}" exhibits token variance with Marksheet name "${facts.academic.candidateName}".`,
          evidenceReference: facts.academic.evidenceReference || "ACADEMIC_CBSE",
          sourceIds: ["CBSE_DIGILOCKER"],
          details: { claimedName, marksName, matchType: "PARTIAL_MATCH" },
        });
        riskScore += 15;
      } else {
        anomalies.push({
          anomalyCode: "IDENTITY_CROSS_SOURCE_CONFLICT_ACADEMIC",
          severity: "CRITICAL",
          description: `Applicant name "${facts.applicant.claimedName}" conflicts with Marksheet name "${facts.academic.candidateName}".`,
          evidenceReference: facts.academic.evidenceReference || "ACADEMIC_CBSE",
          sourceIds: ["CBSE_DIGILOCKER"],
          details: { claimedName, marksName, matchType: "MISMATCH" },
        });
        riskScore += 40;
      }
    }

    if (bankName) {
      totalNameSources++;
      if (bankName === claimedName) {
        nameMatches++;
      } else if (this.isPartialMatch(claimedName, bankName)) {
        nameMatches += 0.5;
        anomalies.push({
          anomalyCode: "IDENTITY_TOKEN_VARIANCE_BANK",
          severity: "WARNING",
          description: `Applicant name "${facts.applicant.claimedName}" exhibits token variance with Bank CBS registered name "${facts.bank.accountHolderName}".`,
          evidenceReference: facts.bank.evidenceReference || "BANK_FAV",
          sourceIds: ["RAZORPAY_FAV"],
          details: { claimedName, bankName, matchType: "PARTIAL_MATCH" },
        });
        riskScore += 15;
      } else {
        anomalies.push({
          anomalyCode: "IDENTITY_CROSS_SOURCE_CONFLICT_BANK",
          severity: "CRITICAL",
          description: `Applicant name "${facts.applicant.claimedName}" conflicts with Bank CBS registered name "${facts.bank.accountHolderName}".`,
          evidenceReference: facts.bank.evidenceReference || "BANK_FAV",
          sourceIds: ["RAZORPAY_FAV"],
          details: { claimedName, bankName, matchType: "MISMATCH" },
        });
        riskScore += 40;
      }
    }

    const coherenceScore = Math.max(0, Math.min(1, nameMatches / Math.max(1, totalNameSources - 1)));

    // ------------------------------------------------------------------------
    // 2. Document Freshness & Near-Expiry Proximity Analysis
    // ------------------------------------------------------------------------
    if (facts.category.nclValidUntil) {
      const expiryDate = new Date(facts.category.nclValidUntil).getTime();
      const now = Date.now();
      const daysRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        anomalies.push({
          anomalyCode: "DOCUMENT_EXPIRED_NCL",
          severity: "CRITICAL",
          description: `Caste Non-Creamy Layer (NCL) certificate expired ${Math.abs(daysRemaining)} days ago.`,
          evidenceReference: facts.category.evidenceReference || "CASTE_SERVICE",
          sourceIds: ["MAHA_CASTE_SERVICE"],
          details: { expiryDate: facts.category.nclValidUntil, daysRemaining },
        });
        riskScore += 30;
      } else if (daysRemaining <= 60) {
        anomalies.push({
          anomalyCode: "DOCUMENT_NEAR_EXPIRY_NCL",
          severity: "WARNING",
          description: `Caste Non-Creamy Layer certificate will expire in ${daysRemaining} days (renewal advised before disbursement cycle).`,
          evidenceReference: facts.category.evidenceReference || "CASTE_SERVICE",
          sourceIds: ["MAHA_CASTE_SERVICE"],
          details: { expiryDate: facts.category.nclValidUntil, daysRemaining },
        });
        riskScore += 15;
      }
    }

    // ------------------------------------------------------------------------
    // 3. Location Resolution Anomaly
    // ------------------------------------------------------------------------
    const isLocationResolved = (facts.location as any).isResolved ?? facts.location.resolved ?? false;
    if (!isLocationResolved) {
      anomalies.push({
        anomalyCode: "LGD_GEOGRAPHY_UNRESOLVED",
        severity: "CRITICAL",
        description: `Applicant home district "${facts.location.districtName}" cannot be validated against Local Government Directory.`,
        evidenceReference: facts.location.evidenceReference || "LGD_DIRECTORY",
        sourceIds: ["LGD_DIRECTORY"],
        details: { districtName: facts.location.districtName },
      });
      riskScore += 30;
    } else if (!facts.location.isMaharashtra) {
      anomalies.push({
        anomalyCode: "OUT_OF_STATE_DOMICILE",
        severity: "WARNING",
        description: `Resolved district "${facts.location.districtName}" is located in State Code ${facts.location.stateCode} (${facts.location.stateName}), outside Maharashtra.`,
        evidenceReference: facts.location.evidenceReference || "LGD_DIRECTORY",
        sourceIds: ["LGD_DIRECTORY"],
        details: { stateCode: facts.location.stateCode, stateName: facts.location.stateName },
      });
      riskScore += 25;
    }

    // ------------------------------------------------------------------------
    // 4. Evidence Completeness Assessment
    // ------------------------------------------------------------------------
    const isBankValid = (facts.bank as any).isValid ?? facts.bank.valid ?? false;
    const requiredSources = [
      { name: "Income (ITR)", verified: facts.income.verificationStatus === "DATA_VERIFIED" },
      { name: "Academic (CBSE/DigiLocker)", verified: facts.academic.verificationStatus === "DATA_VERIFIED" },
      { name: "Category (State Registry)", verified: facts.category.verificationStatus === "DATA_VERIFIED" },
      { name: "Location (LGD)", verified: isLocationResolved },
      { name: "Bank (CBS / FAV)", verified: isBankValid },
    ];

    const missingSources = requiredSources.filter((s) => !s.verified).map((s) => s.name);
    const verifiedCount = requiredSources.length - missingSources.length;
    const completeness: EvidenceCompleteness = {
      totalRequiredSources: requiredSources.length,
      verifiedSourcesCount: verifiedCount,
      verifiedPercentage: Math.round((verifiedCount / requiredSources.length) * 100),
      missingSources,
    };

    if (missingSources.length > 0) {
      anomalies.push({
        anomalyCode: "INCOMPLETE_EVIDENCE_CHAIN",
        severity: missingSources.length >= 3 ? "CRITICAL" : "WARNING",
        description: `Verification evidence incomplete: ${missingSources.length} mandatory source(s) unverified (${missingSources.join(", ")}).`,
        evidenceReference: "SYSTEM_INTEGRITY",
        sourceIds: ["CIVICPULSE_GATEWAY"],
        details: { missingSources, verifiedCount },
      });
      riskScore += missingSources.length * 10;
    }

    // ------------------------------------------------------------------------
    // 5. Synthesis & Explainable Output
    // ------------------------------------------------------------------------
    const finalScore = Math.min(100, Math.max(0, riskScore));
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (finalScore >= 50) riskLevel = "HIGH";
    else if (finalScore >= 20) riskLevel = "MEDIUM";

    let summary = `Integrity Assessment: Risk level ${riskLevel} (score ${finalScore}/100). `;
    if (anomalies.length === 0) {
      summary += "Multi-source evidence is highly coherent with zero discrepancies across government registries.";
    } else {
      summary += `Detected ${anomalies.length} notable pattern(s): ${anomalies.map((a) => a.description).join(" ")}`;
    }

    return {
      insightType: "INTEGRITY_RISK_ASSESSMENT",
      riskLevel,
      riskScore: finalScore,
      summary,
      anomaliesDetected: anomalies,
      coherenceScore: Number(coherenceScore.toFixed(2)),
      evidenceCompleteness: completeness,
      provenance: {
        analyzer: this.ANALYZER_NAME,
        version: this.VERSION,
        mode: "SIMULATED",
        analyzedAt: new Date().toISOString(),
        isAdvisoryOnly: true,
      },
    };
  }

  private static isPartialMatch(a: string, b: string): boolean {
    const tokensA = a.split(/\s+/).filter(Boolean);
    const tokensB = b.split(/\s+/).filter(Boolean);
    const common = tokensA.filter((t) => tokensB.includes(t));
    return common.length > 0 && (tokensA.length !== tokensB.length || common.length < Math.max(tokensA.length, tokensB.length));
  }
}
