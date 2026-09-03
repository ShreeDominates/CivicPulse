/**
 * CivicPulse B5 & B6 Lifecycle & Audit Type Definitions.
 * Strict government service workflow, sanction, and DBT clearing contracts.
 */

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "VERIFICATION_IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "SANCTIONED"
  | "DISBURSEMENT_INITIATED"
  | "DISBURSEMENT_PROCESSING"
  | "DISBURSED"
  | "DISBURSEMENT_FAILED"
  | "COMPLETED";

export type DisbursementStatus =
  | "NOT_INITIATED"
  | "INITIATED"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED";

export interface LifecycleEvent {
  id: string;
  applicationId: string;
  applicationRef: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  action: string;
  actorHash?: string;
  actorRole: "CITIZEN" | "SYSTEM" | "OFFICER";
  timestamp: string;
  correlationId: string;
  details?: Record<string, any>;
  provenance: {
    source: string;
    mode: "REAL" | "SIMULATED";
  };
}

export interface SanctionOrder {
  sanctionOrderRef: string;
  applicationRef: string;
  schemeId: string;
  schemeName: string;
  sanctionedAmount: number;
  ruleSetId: string;
  ruleSetVersion: string;
  issuingAuthority: string;
  sanctionedAt: string;
  status: "ACTIVE" | "REVOKED";
  mode: "SIMULATED";
  disbursementMode: "PFMS_APBS";
}

export interface DisbursementResult {
  success: boolean;
  status: DisbursementStatus;
  pfmsRef?: string;
  sanctionOrderRef: string;
  applicationRef: string;
  utrNumber?: string;
  transferredAt?: string;
  amount: number;
  beneficiaryAccountMasked: string;
  clearingMode?: string;
  failureReason?: string;
  isIdempotentReplay?: boolean;
  provenance: {
    sourceId: string;
    sourceName: string;
    mode: "SIMULATED";
    requestId: string;
    retrievedAt: string;
  };
}
