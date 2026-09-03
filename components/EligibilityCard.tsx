"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Award, AlertTriangle, Sparkles, Lock, FileSearch } from "lucide-react";
import type { EligibilityCriterion } from "@/lib/eligibility/scholarship";
import type { ApplicationIntelligenceInsight } from "@/lib/intelligence/types";

interface EligibilityCardProps {
  approved: boolean;
  criteria: EligibilityCriterion[];
  scholarshipAmount?: number;
  applicationRef?: string;
  intelligence?: ApplicationIntelligenceInsight;
}

export default function EligibilityCard({
  approved,
  criteria,
  scholarshipAmount,
  applicationRef,
  intelligence,
}: EligibilityCardProps) {
  return (
    <div className="space-y-6">
      {/* B4 Authoritative Statutory Decision Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${
          approved
            ? "bg-success/5 border-success/80"
            : "bg-error/5 border-error/80"
        }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {approved ? (
              <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center text-success flex-shrink-0">
                <Award className="h-7 w-7" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-error/15 flex items-center justify-center text-error flex-shrink-0">
                <AlertTriangle className="h-7 w-7" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Statutory Eligibility Decision (B4 Engine)
              </span>
              <h2
                className={`text-2xl font-extrabold tracking-tight ${
                  approved ? "text-success" : "text-error"
                }`}
              >
                {approved ? "APPLICATION APPROVED ✓" : "NOT ELIGIBLE ✗"}
              </h2>
            </div>
          </div>

          {approved && scholarshipAmount && (
            <div className="sm:text-right">
              <span className="text-xs text-text-muted block">Direct Benefit Grant</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-navy">
                ₹{scholarshipAmount.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {applicationRef && (
          <div className="mb-6 p-2.5 rounded-lg bg-white/80 border border-card-border flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted">Application Ref:</span>
            <span className="font-bold text-accent">{applicationRef}</span>
          </div>
        )}

        {/* Criteria List */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block mb-1">
            Statutory Rule Breakdown (MAHA_HED_RULES v2.1.0)
          </span>
          {criteria.map((criterion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                criterion.pass ? "bg-white border-card-border" : "bg-error/10 border-error/30"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {criterion.pass ? (
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-error flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-navy truncate">
                    {criterion.label}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">
                    {criterion.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0 text-xs">
                <span className="font-semibold text-navy">
                  {criterion.actualValue}
                </span>
                <span className="text-text-muted text-[11px]">
                  ({criterion.threshold})
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* B7 Advisory Intelligence Card */}
      {intelligence && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-card-border bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-card-border mb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-accent" />
              <div>
                <h3 className="text-sm font-bold text-navy">
                  B7 Cross-Evidence Anomaly Intelligence
                </h3>
                <span className="text-[11px] text-text-muted">
                  Heuristic Cross-Source Analysis • Analyzer v{intelligence.provenance.version}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold self-start sm:self-auto">
              Advisory Only
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-background border border-card-border">
              <span className="text-text-muted block text-[10px] uppercase font-bold">Integrity Risk</span>
              <span className={`text-base font-extrabold ${
                intelligence.riskLevel === "LOW" ? "text-success" : intelligence.riskLevel === "MEDIUM" ? "text-warning" : "text-error"
              }`}>
                {intelligence.riskLevel} ({intelligence.riskScore}/100)
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-card-border">
              <span className="text-text-muted block text-[10px] uppercase font-bold">Token Coherence</span>
              <span className="text-base font-extrabold text-navy">
                {Math.round(intelligence.coherenceScore * 100)}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-card-border">
              <span className="text-text-muted block text-[10px] uppercase font-bold">Completeness</span>
              <span className="text-base font-extrabold text-accent">
                {intelligence.evidenceCompleteness.verifiedSourcesCount}/{intelligence.evidenceCompleteness.totalRequiredSources} Sources
              </span>
            </div>
          </div>

          {/* Anomalies List */}
          <div className="space-y-2">
            {intelligence.anomaliesDetected.length === 0 ? (
              <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-success text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Zero cross-source anomalies detected. Application data is fully coherent across all 5 verification providers.
              </div>
            ) : (
              intelligence.anomaliesDetected.map((ano, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs ${
                    ano.severity === "CRITICAL"
                      ? "bg-error/10 border-error/30"
                      : ano.severity === "WARNING"
                      ? "bg-warning/10 border-warning/30"
                      : "bg-navy-50 border-card-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold text-white ${
                      ano.severity === "CRITICAL" ? "bg-error" : ano.severity === "WARNING" ? "bg-warning" : "bg-navy"
                    }`}>
                      {ano.severity}
                    </span>
                    <span className="font-mono font-bold text-navy">{ano.anomalyCode}</span>
                  </div>
                  <p className="text-navy-700">{ano.description}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-card-border text-[11px] text-text-muted flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>
              <strong>Statutory Boundary:</strong> B7 intelligence provides advisory anomaly flags. Final benefit approval is governed exclusively by B4 deterministic rules.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
