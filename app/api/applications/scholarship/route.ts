import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";
import { evaluateScholarshipEligibility } from "@/lib/eligibility/scholarship";

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

const MOCK_CASTE = {
  category: "OBC",
  certificateId: "MH/CST/2024/887123",
  source: "STATE_REVENUE_MOCK",
};

const MOCK_LGD: Record<string, any> = {
  pune: { districtCode: "519", districtName: "Pune", stateCode: "27", stateName: "Maharashtra" },
  mumbai: { districtCode: "516", districtName: "Mumbai", stateCode: "27", stateName: "Maharashtra" },
};

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

  // Verify consent
  const consent = await prisma.consentLog.findUnique({
    where: { id: parsed.data.consentId },
  });

  if (!consent || !consent.isActive || consent.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Valid consent required", code: "CONSENT_REQUIRED" },
      { status: 403 }
    );
  }

  try {
    // Parallel fetch all data (mock mode)
    const isMock = process.env.USE_MOCK_APIS === "true";

    const [incomeRes, marksRes, bankRes] = await Promise.all([
      // Income
      isMock
        ? Promise.resolve({
            annualIncome: 160000,
            holderName: session.user.name,
            source: "INCOME_TAX_DEPT_MOCK",
            digitallyVerified: true,
          })
        : fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/gov/fetch-income`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pan: parsed.data.pan, consentId: parsed.data.consentId }),
          }).then((r) => r.json()),

      // Marks
      isMock
        ? Promise.resolve({
            percentage: 87.4,
            rollNumber: "23456789",
            studentName: session.user.name,
            source: "CBSE_DIGILOCKER_MOCK",
            digitalSignatureValid: true,
          })
        : fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/gov/fetch-marks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rollNumber: "23456789",
              year: 2025,
              consentId: parsed.data.consentId,
            }),
          }).then((r) => r.json()),

      // Bank
      isMock
        ? Promise.resolve({
            valid: true,
            registeredName: session.user.name,
            bankName: "State Bank of India",
            ifsc: parsed.data.bankIfsc,
            accountLast4: parsed.data.bankAccount.slice(-4),
          })
        : fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/gov/validate-bank`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountNumber: parsed.data.bankAccount,
              ifsc: parsed.data.bankIfsc,
              name: session.user.name,
              consentId: parsed.data.consentId,
            }),
          }).then((r) => r.json()),
    ]);

    // LGD lookup
    const lgdData =
      MOCK_LGD[parsed.data.districtName.toLowerCase()] ||
      MOCK_LGD.pune;

    // Caste (mock)
    const casteData = MOCK_CASTE;

    // Run eligibility engine
    const result = evaluateScholarshipEligibility(
      incomeRes,
      marksRes,
      casteData,
      lgdData,
      bankRes
    );

    // Generate ref
    const applicationRef = generateRef();

    // Save application
    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        schemeId: "SCH-HED-2026",
        schemeName: "Higher Education Scholarship 2026",
        status: result.approved ? "APPROVED" : "REJECTED",
        eligibilityData: JSON.stringify({
          income: incomeRes,
          marks: marksRes,
          caste: casteData,
          lgd: lgdData,
          bank: bankRes,
          criteria: result.criteria,
        }),
        consentId: parsed.data.consentId,
        applicationRef,
        amount: result.scholarshipAmount || undefined,
        rejectionReasons: JSON.stringify(result.rejectionReasons),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SCHOLARSHIP_APPLICATION",
        apiSource: "ORCHESTRATOR",
        responseCode: 200,
        durationMs: Date.now() - start,
        metadata: JSON.stringify({ applicationRef, approved: result.approved }),
      },
    });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        ref: applicationRef,
        status: application.status,
        amount: application.amount,
        schemeName: application.schemeName,
      },
      eligibility: result,
      fetchResults: {
        income: incomeRes,
        marks: marksRes,
        caste: casteData,
        lgd: lgdData,
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
