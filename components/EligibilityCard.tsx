"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Award, AlertTriangle } from "lucide-react";
import type { EligibilityCriterion } from "@/lib/eligibility/scholarship";

interface EligibilityCardProps {
  approved: boolean;
  criteria: EligibilityCriterion[];
  scholarshipAmount?: number;
  applicationRef?: string;
}

export default function EligibilityCard({
  approved,
  criteria,
  scholarshipAmount,
  applicationRef,
}: EligibilityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl border-2 p-6 ${
        approved
          ? "bg-success/5 border-success"
          : "bg-error/5 border-error"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {approved ? (
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <Award className="h-10 w-10 text-success" />
          </motion.div>
        ) : (
          <AlertTriangle className="h-10 w-10 text-error" />
        )}
        <div>
          <h2
            className={`text-2xl font-bold ${
              approved ? "text-success" : "text-error"
            }`}
          >
            {approved ? "APPLICATION APPROVED ✓" : "NOT ELIGIBLE"}
          </h2>
          {approved && scholarshipAmount && (
            <p className="text-lg text-text-primary font-semibold mt-1">
              Scholarship Amount: ₹{scholarshipAmount.toLocaleString("en-IN")}
            </p>
          )}
          {applicationRef && (
            <p className="text-sm text-text-muted mt-1">
              Application Reference: {applicationRef}
            </p>
          )}
        </div>
      </div>

      {/* Criteria */}
      <div className="space-y-3">
        {criteria.map((criterion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-lg ${
              criterion.pass ? "bg-white" : "bg-error/10"
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {criterion.pass ? (
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-error flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                  {criterion.label}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {criterion.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <span className="text-sm font-semibold text-navy">
                {criterion.actualValue}
              </span>
              <span className="text-xs text-text-muted">
                ({criterion.threshold})
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* DBT Notice */}
      {approved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 p-4 bg-white rounded-lg border border-success/20"
        >
          <p className="text-sm text-text-primary">
            <strong>Disbursement:</strong> ₹{scholarshipAmount?.toLocaleString("en-IN")} will be
            transferred to your Aadhaar-linked bank account within 24 hours via
            PFMS (Public Financial Management System).
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
