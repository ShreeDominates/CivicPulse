import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { evaluateScholarshipEligibility } from "@/lib/eligibility/scholarship";
import {
  incomeAdapter,
  marksAdapter,
  bankAdapter,
  casteAdapter,
  lgdAdapter,
} from "@/lib/govapi";
import { ApplicationLifecycleEngine } from "@/lib/lifecycle/applicationLifecycle";
import { auditService } from "@/lib/lifecycle/auditService";
import { AnomalyIntelligenceEngine } from "@/lib/intelligence/anomalyEngine";

// Safe prisma import
let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format"),
  aadhaar: z.string().length(12, "Aadhaar must be 12 digits"),
  bankAccount: z.string().min(9).max(18),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC"),
  consentId: z.string(),
  districtName: z.string().default("Pune"),
});

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "CP-2026-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export const POST = withAuth(async (req: NextRequest, session: any) => {
  const start = Date.now();
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: true, code: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Verify consent — DB-first, fallback to accepting any consentId in mock mode
  if (prisma) {
    try {
      const consent = await prisma.consentLog.findUnique({
        where: { id: parsed.data.consentId },
      });
      if (!consent || !consent.isActive || consent.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Valid consent required", code: "CONSENT_REQUIRED" },
          { status: 403 }
        );
      }
    } catch {
      // DB down — in mock mode, accept the consentId
      if (process.env.USE_MOCK_APIS !== "true") {
        return NextResponse.json(
          { error: "Cannot verify consent — database unavailable", code: "DB_UNAVAILABLE" },
          { status: 503 }
        );
      }
    }
  }

  try {
    const adapterContext = {
      userId: session.user.id,
      actorHash: session.user?.aadhaarHash,
      consentId: parsed.data.consentId,
      endpoint: "/api/applications/scholarship",
    };

    // Authoritative B3 Provider Pipeline: Fetch all data via official adapters
    const [incomeRes, marksRes, bankRes, casteRes, lgdRes] = await Promise.all([
      incomeAdapter
        .execute({ pan: parsed.data.pan }, adapterContext)
        .then((res) => ({
          ...res,
          ...res.data,
          annualIncome: res.data?.annualIncome ?? 0,
          holderName: res.data?.holderName ?? session.user.name,
          source: res.data?.source ?? "INCOME_TAX_DEPT",
          digitallyVerified: res.success,
        })),

      marksAdapter
        .execute(
          { rollNumber: "23456789", year: 2025, studentName: session.user.name },
          adapterContext
        )
        .then((res) => ({
          ...res,
          ...res.data,
          percentage: res.data?.percentage ?? 0,
          rollNumber: res.data?.rollNumber ?? "23456789",
          studentName: res.data?.studentName ?? session.user.name,
          source: res.data?.source ?? "CBSE_DIGILOCKER",
          digitalSignatureValid: res.data?.digitalSignatureValid ?? false,
        })),

      bankAdapter
        .execute(
          {
            accountNumber: parsed.data.bankAccount,
            ifsc: parsed.data.bankIfsc,
            name: session.user.name,
          },
          adapterContext
        )
        .then((res) => ({
          ...res,
          ...res.data,
          valid: res.data?.valid ?? false,
          registeredName: res.data?.registeredName ?? session.user.name,
          bankName: res.data?.bankName ?? "State Bank of India",
          ifsc: parsed.data.bankIfsc,
          accountLast4: parsed.data.bankAccount.slice(-4),
        })),

      casteAdapter
        .execute(
          {
            certificateId: "MH/CST/2024/887123",
            category: "OBC",
          },
          adapterContext
        )
        .then((res) => ({
          ...res,
          ...res.data,
          category: res.data?.category ?? "OBC",
          certificateId: res.data?.certificateId ?? "MH/CST/2024/887123",
          source: res.data?.source ?? "STATE_REVENUE_PORTAL",
        })),

      lgdAdapter
        .execute(
          {
            name: parsed.data.districtName,
            state: "maharashtra",
          },
          adapterContext
        )
        .then((res) => ({
          ...res,
          ...res.data,
          districtCode: res.data?.districtCode ?? "",
          districtName: res.data?.districtName ?? parsed.data.districtName,
          stateCode: res.data?.stateCode ?? "",
          stateName: res.data?.stateName ?? "",
          found: res.data?.found ?? false,
        })),
    ]);

    // Authoritative B4 Evaluation: Normalized facts + Versioned Rule Engine
    const result = evaluateScholarshipEligibility(
      incomeRes,
      marksRes,
      casteRes,
      lgdRes,
      bankRes,
      {
        id: session.user.id,
        name: session.user.name,
        aadhaarHash: session.user?.aadhaarHash,
        claimedPan: parsed.data.pan,
        claimedDistrict: parsed.data.districtName,
      }
    );

    // B7 Anomaly & Integrity Intelligence (Deterministic, Non-Overriding)
    const intelligence = result.normalizedFacts
      ? AnomalyIntelligenceEngine.analyze(result.normalizedFacts)
      : null;

    const applicationRef = generateRef();

    // Map application status from authoritative B4 decision
    let applicationId = `app-${Date.now()}`;
    let applicationStatus = result.approved ? "APPROVED" : (result.status === "INCOMPLETE" ? "PENDING" : "REJECTED");

    if (prisma) {
      try {
        const application = await prisma.application.create({
          data: {
            userId: session.user.id,
            schemeId: result.ruleSet.schemeId,
            schemeName: result.ruleSet.schemeName,
            status: applicationStatus,
            eligibilityData: JSON.stringify({
              decision: result.status,
              approved: result.approved,
              ruleSet: result.ruleSet,
              evaluatedAt: result.evaluatedAt,
              summary: result.summary,
              rules: result.rules,
              crossSourceChecks: result.crossSourceChecks,
              provenanceSummary: result.provenanceSummary,
              criteria: result.criteria,
              facts: result.normalizedFacts,
              intelligence,
            }),
            consentId: parsed.data.consentId,
            applicationRef,
            amount: result.scholarshipAmount || undefined,
            rejectionReasons: JSON.stringify(result.rejectionReasons),
          },
        });
        applicationId = application.id;

        // Layer 1 Audit log
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            actorHash: session.user?.aadhaarHash,
            action: "SCHOLARSHIP_APPLICATION",
            apiSource: "CIVICPULSE_ENGINE",
            endpoint: "/api/applications/scholarship",
            responseCode: 200,
            durationMs: Date.now() - start,
            metadata: JSON.stringify({
              applicationRef,
              decision: result.status,
              approved: result.approved,
              ruleSetId: result.ruleSet.ruleSetId,
              ruleSetVersion: result.ruleSet.ruleSetVersion,
            }),
          },
        }).catch(() => {});
      } catch (dbErr) {
        console.warn("[CivicPulse] DB unavailable for application save, using in-memory result");
      }
    }

    // Register with Authoritative Lifecycle Engine
    ApplicationLifecycleEngine.registerApplication({
      id: applicationId,
      userId: session.user.id,
      schemeId: result.ruleSet.schemeId,
      schemeName: result.ruleSet.schemeName,
      status: applicationStatus as any,
      eligibilityData: JSON.stringify({
        decision: result.status,
        approved: result.approved,
        ruleSet: result.ruleSet,
        evaluatedAt: result.evaluatedAt,
        summary: result.summary,
        rules: result.rules,
        crossSourceChecks: result.crossSourceChecks,
        provenanceSummary: result.provenanceSummary,
        criteria: result.criteria,
        facts: result.normalizedFacts,
        intelligence,
      }),
      consentId: parsed.data.consentId,
      applicationRef,
      amount: result.scholarshipAmount,
      rejectionReasons: JSON.stringify(result.rejectionReasons),
      disbursementStatus: "NOT_INITIATED",
      beneficiaryName: session.user.name,
      accountNumber: parsed.data.bankAccount,
      ifsc: parsed.data.bankIfsc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Record Lifecycle Audit Event
    await auditService.recordEvent({
      applicationId,
      applicationRef,
      previousStatus: "DRAFT",
      newStatus: applicationStatus as any,
      action: "APPLICATION_SUBMITTED",
      actorHash: session.user?.aadhaarHash,
      actorRole: "CITIZEN",
      correlationId: applicationRef,
      details: {
        schemeId: result.ruleSet.schemeId,
        amount: result.scholarshipAmount,
        decision: result.status,
        approved: result.approved,
        ruleSetId: result.ruleSet.ruleSetId,
        ruleSetVersion: result.ruleSet.ruleSetVersion,
        intelligenceSummary: intelligence?.summary,
        riskLevel: intelligence?.riskLevel,
      },
      provenance: {
        source: "CIVICPULSE_ENGINE",
        mode: "SIMULATED",
      },
    });

    return NextResponse.json({
      success: true,
      application: {
        id: applicationId,
        ref: applicationRef,
        status: applicationStatus,
        amount: result.scholarshipAmount,
        schemeName: result.ruleSet.schemeName,
        ruleSetVersion: result.ruleSet.ruleSetVersion,
      },
      eligibility: result,
      intelligence,
      fetchResults: {
        income: incomeRes,
        marks: marksRes,
        caste: casteRes,
        lgd: lgdRes,
        bank: bankRes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Application processing failed", details: error.message },
      { status: 500 }
    );
  }
});
