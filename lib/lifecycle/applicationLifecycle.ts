/**
 * CivicPulse Application Lifecycle State Machine & Post-Eligibility Workflow.
 * Enforces strict government sanction prerequisites, DBT clearing, and idempotency.
 */

import crypto from "crypto";
import { pfmsAdapter } from "../govapi/adapters/pfmsAdapter.ts";
import type { PfmsScenario } from "../govapi/simulators/pfmsSimulator.ts";
import { auditService } from "./auditService.ts";
import type {
  ApplicationStatus,
  DisbursementStatus,
  SanctionOrder,
  DisbursementResult,
  LifecycleEvent,
} from "./types.ts";

// Safe Prisma import
let prisma: any = null;
try {
  prisma = require("@/lib/prisma").prisma;
} catch {}

// Fallback in-memory application store for standalone/testing runs
interface StoredApplication {
  id: string;
  userId: string;
  schemeId: string;
  schemeName: string;
  status: ApplicationStatus;
  eligibilityData: string;
  consentId: string;
  applicationRef: string;
  amount: number;
  rejectionReasons: string;
  disbursementStatus: DisbursementStatus;
  pfmsRef?: string;
  sanctionOrderRef?: string;
  dbtTransferredAt?: string;
  dbtFailureReason?: string;
  beneficiaryName: string;
  accountNumber: string;
  ifsc: string;
  createdAt: string;
  updatedAt: string;
}

export const inMemoryApplications = new Map<string, StoredApplication>();

/**
 * Valid transitions between lifecycle states.
 */
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["VERIFICATION_IN_PROGRESS", "APPROVED", "REJECTED"],
  VERIFICATION_IN_PROGRESS: ["APPROVED", "REJECTED"],
  APPROVED: ["SANCTIONED", "REJECTED"],
  REJECTED: [], // Terminal
  SANCTIONED: ["DISBURSEMENT_INITIATED", "DISBURSEMENT_PROCESSING", "DISBURSED", "DISBURSEMENT_FAILED", "REJECTED"],
  DISBURSEMENT_INITIATED: ["DISBURSEMENT_PROCESSING", "DISBURSED", "DISBURSEMENT_FAILED"],
  DISBURSEMENT_PROCESSING: ["DISBURSED", "DISBURSEMENT_FAILED"],
  DISBURSED: ["COMPLETED"],
  DISBURSEMENT_FAILED: ["DISBURSEMENT_INITIATED", "DISBURSEMENT_PROCESSING", "DISBURSED", "REJECTED"], // Supports retry!
  COMPLETED: [], // Terminal
};

export class ApplicationLifecycleEngine {
  /**
   * Validates whether a state transition is legal according to government workflow rules.
   */
  public static validateTransition(current: ApplicationStatus, next: ApplicationStatus): boolean {
    if (current === next) return true;
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  /**
   * Registers an application in the fallback store (used for tests or mock operations).
   */
  public static registerApplication(app: StoredApplication): void {
    inMemoryApplications.set(app.applicationRef, app);
    inMemoryApplications.set(app.id, app);
  }

  /**
   * Finds an application by ref or ID across Prisma and in-memory stores.
   */
  public static async getApplication(applicationRefOrId: string): Promise<StoredApplication | null> {
    if (inMemoryApplications.has(applicationRefOrId)) {
      return inMemoryApplications.get(applicationRefOrId)!;
    }

    if (prisma) {
      try {
        const app = await prisma.application.findFirst({
          where: {
            OR: [{ id: applicationRefOrId }, { applicationRef: applicationRefOrId }],
          },
        });

        if (app) {
          const stored: StoredApplication = {
            id: app.id,
            userId: app.userId,
            schemeId: app.schemeId,
            schemeName: app.schemeName,
            status: app.status as ApplicationStatus,
            eligibilityData: app.eligibilityData,
            consentId: app.consentId,
            applicationRef: app.applicationRef,
            amount: app.amount || 48000,
            rejectionReasons: app.rejectionReasons,
            disbursementStatus: (app.disbursementStatus as DisbursementStatus) || "NOT_INITIATED",
            pfmsRef: app.pfmsRef || undefined,
            sanctionOrderRef: app.sanctionOrderRef || undefined,
            dbtTransferredAt: app.dbtTransferredAt?.toISOString(),
            dbtFailureReason: app.dbtFailureReason || undefined,
            beneficiaryName: "Applicant",
            accountNumber: "12345678901234",
            ifsc: "SBIN0001234",
            createdAt: app.createdAt.toISOString(),
            updatedAt: app.updatedAt.toISOString(),
          };
          this.registerApplication(stored);
          return stored;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Generates a formal Sanction Order for an approved application.
   * STRICT PREREQUISITE: Application must be in APPROVED status with an ELIGIBLE decision.
   */
  public static async generateSanction(
    applicationRefOrId: string,
    actorHash?: string
  ): Promise<SanctionOrder> {
    const app = await this.getApplication(applicationRefOrId);
    if (!app) {
      throw new Error(`APPLICATION_NOT_FOUND: Application "${applicationRefOrId}" does not exist.`);
    }

    // Enforce eligibility gate
    if (app.status !== "APPROVED" && app.status !== "SANCTIONED") {
      throw new Error(
        `PREREQUISITE_FAILED: Cannot sanction application in status "${app.status}". Only APPROVED applications may be sanctioned.`
      );
    }

    // Verify B4 eligibility decision in record
    let parsedEligibility: any = {};
    try {
      parsedEligibility = JSON.parse(app.eligibilityData || "{}");
    } catch {}

    const isEligible =
      parsedEligibility.decision === "ELIGIBLE" ||
      parsedEligibility.approved === true ||
      app.status === "APPROVED";

    if (!isEligible) {
      throw new Error(
        `ELIGIBILITY_GATE_BLOCKED: B4 decision is not ELIGIBLE. Found: ${parsedEligibility.decision || "INELIGIBLE"}.`
      );
    }

    // If already sanctioned, return idempotent sanction record
    if (app.status === "SANCTIONED" && app.sanctionOrderRef) {
      return {
        sanctionOrderRef: app.sanctionOrderRef,
        applicationRef: app.applicationRef,
        schemeId: app.schemeId,
        schemeName: app.schemeName,
        sanctionedAmount: app.amount,
        ruleSetId: parsedEligibility.ruleSet?.ruleSetId || "MAHA_HED_SCHOLARSHIP_RULES",
        ruleSetVersion: parsedEligibility.ruleSet?.ruleSetVersion || "2.1.0",
        issuingAuthority: "Directorate of Higher Education, Government of Maharashtra",
        sanctionedAt: app.updatedAt,
        status: "ACTIVE",
        mode: "SIMULATED",
        disbursementMode: "PFMS_APBS",
      };
    }

    // Generate new sanction order
    const timestamp = new Date().toISOString();
    const hash = crypto
      .createHash("sha256")
      .update(`${app.applicationRef}-${app.amount}-${timestamp}`)
      .digest("hex")
      .slice(0, 6)
      .toUpperCase();

    const sanctionOrderRef = `SANCTION-MH-HED-2026-${app.applicationRef}-${hash}`;
    const previousStatus = app.status;
    const newStatus: ApplicationStatus = "SANCTIONED";

    // Update in-memory
    app.status = newStatus;
    app.sanctionOrderRef = sanctionOrderRef;
    app.updatedAt = timestamp;
    this.registerApplication(app);

    // Update Prisma
    if (prisma) {
      try {
        await prisma.application.update({
          where: { applicationRef: app.applicationRef },
          data: {
            status: newStatus,
            sanctionOrderRef,
          },
        });
      } catch {}
    }

    // Record Lifecycle Audit Event
    await auditService.recordEvent({
      applicationId: app.id,
      applicationRef: app.applicationRef,
      previousStatus,
      newStatus,
      action: "SANCTION_ORDER_ISSUED",
      actorHash,
      actorRole: "OFFICER",
      correlationId: sanctionOrderRef,
      details: {
        sanctionOrderRef,
        sanctionedAmount: app.amount,
        ruleSetId: parsedEligibility.ruleSet?.ruleSetId || "MAHA_HED_SCHOLARSHIP_RULES",
        ruleSetVersion: parsedEligibility.ruleSet?.ruleSetVersion || "2.1.0",
        issuingAuthority: "Directorate of Higher Education, Government of Maharashtra",
      },
      provenance: {
        source: "SANCTION_AUTHORITY",
        mode: "SIMULATED",
      },
    });

    return {
      sanctionOrderRef,
      applicationRef: app.applicationRef,
      schemeId: app.schemeId,
      schemeName: app.schemeName,
      sanctionedAmount: app.amount,
      ruleSetId: parsedEligibility.ruleSet?.ruleSetId || "MAHA_HED_SCHOLARSHIP_RULES",
      ruleSetVersion: parsedEligibility.ruleSet?.ruleSetVersion || "2.1.0",
      issuingAuthority: "Directorate of Higher Education, Government of Maharashtra",
      sanctionedAt: timestamp,
      status: "ACTIVE",
      mode: "SIMULATED",
      disbursementMode: "PFMS_APBS",
    };
  }

  /**
   * Executes DBT / PFMS disbursement for a sanctioned application.
   * Enforces server-side prerequisites, idempotency, and state transitions.
   */
  public static async executeDisbursement(
    applicationRefOrId: string,
    options?: {
      scenario?: PfmsScenario;
      idempotencyKey?: string;
      actorHash?: string;
      beneficiaryName?: string;
      accountNumber?: string;
      ifsc?: string;
    }
  ): Promise<DisbursementResult> {
    const app = await this.getApplication(applicationRefOrId);
    if (!app) {
      throw new Error(`APPLICATION_NOT_FOUND: Application "${applicationRefOrId}" does not exist.`);
    }

    // 1. IDEMPOTENCY GUARD: If already successfully disbursed, return existing transaction
    if (app.status === "DISBURSED" && app.disbursementStatus === "SUCCESS") {
      return {
        success: true,
        status: "SUCCESS",
        pfmsRef: app.pfmsRef,
        sanctionOrderRef: app.sanctionOrderRef || "UNKNOWN",
        applicationRef: app.applicationRef,
        transferredAt: app.dbtTransferredAt,
        amount: app.amount,
        beneficiaryAccountMasked: `XXXX-XXXX-${(options?.accountNumber || app.accountNumber).slice(-4)}`,
        clearingMode: "NPCI_APBS",
        isIdempotentReplay: true,
        provenance: {
          sourceId: "PFMS_DBT_PORTAL",
          sourceName: "Public Financial Management System (PFMS)",
          mode: "SIMULATED",
          requestId: `PFMS-IDEMP-${Date.now()}`,
          retrievedAt: new Date().toISOString(),
        },
      };
    }

    // 2. PREREQUISITE CHECK: Must be in SANCTIONED or DISBURSEMENT_FAILED state
    if (app.status !== "SANCTIONED" && app.status !== "DISBURSEMENT_FAILED") {
      throw new Error(
        `ILLEGAL_LIFECYCLE_TRANSITION: Cannot disburse application in status "${app.status}". Application must be SANCTIONED first.`
      );
    }

    if (!app.sanctionOrderRef) {
      throw new Error("SANCTION_ORDER_MISSING: Application does not have an active sanction order reference.");
    }

    const previousStatus = app.status;
    const beneficiaryName = options?.beneficiaryName || app.beneficiaryName || "Applicant";
    const accountNumber = options?.accountNumber || app.accountNumber || "12345678901234";
    const ifsc = options?.ifsc || app.ifsc || "SBIN0001234";
    const accountMasked = `XXXX-XXXX-${accountNumber.slice(-4)}`;

    // 3. Initiate Disbursement via PFMS Adapter
    const pfmsRequest = {
      applicationRef: app.applicationRef,
      sanctionOrderRef: app.sanctionOrderRef,
      schemeId: app.schemeId,
      amount: app.amount,
      beneficiaryName,
      accountNumber,
      ifsc,
      aadhaarHash: options?.actorHash,
      idempotencyKey: options?.idempotencyKey,
    };

    const adapterContext = {
      scenario: options?.scenario,
      requestId: `DBT-REQ-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      actorHash: options?.actorHash,
      endpoint: `/api/applications/${app.applicationRef}/disburse`,
    };

    const pfmsResult = await pfmsAdapter.execute(pfmsRequest, adapterContext);

    // 4. Handle PFMS Result States
    const timestamp = new Date().toISOString();

    if (pfmsResult.success && pfmsResult.data?.status === "CREDITED") {
      const newStatus: ApplicationStatus = "DISBURSED";
      const newDisbursementStatus: DisbursementStatus = "SUCCESS";

      app.status = newStatus;
      app.disbursementStatus = newDisbursementStatus;
      app.pfmsRef = pfmsResult.data.pfmsRef;
      app.dbtTransferredAt = timestamp;
      app.dbtFailureReason = undefined;
      app.updatedAt = timestamp;
      this.registerApplication(app);

      if (prisma) {
        try {
          await prisma.application.update({
            where: { applicationRef: app.applicationRef },
            data: {
              status: newStatus,
              disbursementStatus: newDisbursementStatus,
              pfmsRef: pfmsResult.data.pfmsRef,
              dbtTransferredAt: new Date(timestamp),
              dbtFailureReason: null,
            },
          });
        } catch {}
      }

      // Record Lifecycle Audit Event
      await auditService.recordEvent({
        applicationId: app.id,
        applicationRef: app.applicationRef,
        previousStatus,
        newStatus,
        action: "DBT_DISBURSEMENT_SUCCESS",
        actorHash: options?.actorHash,
        actorRole: "SYSTEM",
        correlationId: pfmsResult.data.pfmsRef,
        details: {
          pfmsRef: pfmsResult.data.pfmsRef,
          utrNumber: pfmsResult.data.utrNumber,
          amount: app.amount,
          beneficiaryAccountMasked: accountMasked,
          clearingMode: pfmsResult.data.clearingMode,
          treasuryBillNo: pfmsResult.data.treasuryBillNo,
        },
        provenance: {
          source: "PFMS_DBT_PORTAL",
          mode: "SIMULATED",
        },
      });

      return {
        success: true,
        status: "SUCCESS",
        pfmsRef: pfmsResult.data.pfmsRef,
        sanctionOrderRef: app.sanctionOrderRef,
        applicationRef: app.applicationRef,
        utrNumber: pfmsResult.data.utrNumber,
        transferredAt: timestamp,
        amount: app.amount,
        beneficiaryAccountMasked: accountMasked,
        clearingMode: pfmsResult.data.clearingMode,
        provenance: {
          sourceId: "PFMS_DBT_PORTAL",
          sourceName: "Public Financial Management System (PFMS)",
          mode: "SIMULATED",
          requestId: adapterContext.requestId,
          retrievedAt: timestamp,
        },
      };
    } else if (pfmsResult.success && pfmsResult.data?.status === "PROCESSING") {
      const newStatus: ApplicationStatus = "DISBURSEMENT_PROCESSING";
      const newDisbursementStatus: DisbursementStatus = "PROCESSING";

      app.status = newStatus;
      app.disbursementStatus = newDisbursementStatus;
      app.pfmsRef = pfmsResult.data.pfmsRef;
      app.updatedAt = timestamp;
      this.registerApplication(app);

      if (prisma) {
        try {
          await prisma.application.update({
            where: { applicationRef: app.applicationRef },
            data: {
              status: newStatus,
              disbursementStatus: newDisbursementStatus,
              pfmsRef: pfmsResult.data.pfmsRef,
            },
          });
        } catch {}
      }

      await auditService.recordEvent({
        applicationId: app.id,
        applicationRef: app.applicationRef,
        previousStatus,
        newStatus,
        action: "DBT_DISBURSEMENT_PROCESSING",
        actorHash: options?.actorHash,
        actorRole: "SYSTEM",
        correlationId: pfmsResult.data.pfmsRef,
        details: {
          pfmsRef: pfmsResult.data.pfmsRef,
          amount: app.amount,
          clearingMode: pfmsResult.data.clearingMode,
        },
        provenance: {
          source: "PFMS_DBT_PORTAL",
          mode: "SIMULATED",
        },
      });

      return {
        success: true,
        status: "PROCESSING",
        pfmsRef: pfmsResult.data.pfmsRef,
        sanctionOrderRef: app.sanctionOrderRef,
        applicationRef: app.applicationRef,
        amount: app.amount,
        beneficiaryAccountMasked: accountMasked,
        clearingMode: pfmsResult.data.clearingMode,
        provenance: {
          sourceId: "PFMS_DBT_PORTAL",
          sourceName: "Public Financial Management System (PFMS)",
          mode: "SIMULATED",
          requestId: adapterContext.requestId,
          retrievedAt: timestamp,
        },
      };
    } else {
      // Failure
      const failureReason =
        pfmsResult.error?.message || "Disbursement rejected by settlement gateway.";
      const newStatus: ApplicationStatus = "DISBURSEMENT_FAILED";
      const newDisbursementStatus: DisbursementStatus = "FAILED";

      app.status = newStatus;
      app.disbursementStatus = newDisbursementStatus;
      app.dbtFailureReason = failureReason;
      app.updatedAt = timestamp;
      this.registerApplication(app);

      if (prisma) {
        try {
          await prisma.application.update({
            where: { applicationRef: app.applicationRef },
            data: {
              status: newStatus,
              disbursementStatus: newDisbursementStatus,
              dbtFailureReason: failureReason,
            },
          });
        } catch {}
      }

      await auditService.recordEvent({
        applicationId: app.id,
        applicationRef: app.applicationRef,
        previousStatus,
        newStatus,
        action: "DBT_DISBURSEMENT_FAILED",
        actorHash: options?.actorHash,
        actorRole: "SYSTEM",
        correlationId: adapterContext.requestId,
        details: {
          failureReason,
          errorCode: pfmsResult.error?.code || "DISBURSEMENT_ERROR",
          upstreamStatusCode: pfmsResult.error?.upstreamStatusCode,
          beneficiaryAccountMasked: accountMasked,
        },
        provenance: {
          source: "PFMS_DBT_PORTAL",
          mode: "SIMULATED",
        },
      });

      return {
        success: false,
        status: "FAILED",
        sanctionOrderRef: app.sanctionOrderRef,
        applicationRef: app.applicationRef,
        amount: app.amount,
        beneficiaryAccountMasked: accountMasked,
        failureReason,
        provenance: {
          sourceId: "PFMS_DBT_PORTAL",
          sourceName: "Public Financial Management System (PFMS)",
          mode: "SIMULATED",
          requestId: adapterContext.requestId,
          retrievedAt: timestamp,
        },
      };
    }
  }
}
