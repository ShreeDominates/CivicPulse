/**
 * CivicPulse B7 Cross-Evidence Anomaly & Intelligence Type Definitions.
 *
 * CRITICAL SAFETY BOUNDARY:
 * B7 intelligence is strictly ADVISORY and analytical.
 * It DOES NOT decide or override B4 statutory eligibility.
 */

export type AnomalySeverity = "INFO" | "WARNING" | "CRITICAL";

export interface DetectedAnomaly {
  anomalyCode: string;
  severity: AnomalySeverity;
  description: string;
  evidenceReference: string;
  sourceIds: string[];
  details: Record<string, any>;
}

export interface EvidenceCompleteness {
  totalRequiredSources: number;
  verifiedSourcesCount: number;
  verifiedPercentage: number;
  missingSources: string[];
}

export interface ApplicationIntelligenceInsight {
  insightType: "INTEGRITY_RISK_ASSESSMENT" | "CROSS_SOURCE_ANOMALY" | "DOCUMENT_FRESHNESS_WARNING";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskScore: number; // 0 to 100 (0 = pristine, 100 = high risk of discrepancy)
  summary: string;
  anomaliesDetected: DetectedAnomaly[];
  coherenceScore: number; // 0.0 to 1.0 (cross-source identity consistency)
  evidenceCompleteness: EvidenceCompleteness;
  provenance: {
    analyzer: string;
    version: string;
    mode: "SIMULATED";
    analyzedAt: string;
    isAdvisoryOnly: true;
  };
}
