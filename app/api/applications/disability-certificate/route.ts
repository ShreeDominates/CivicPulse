import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  disabilityType: z.string().min(1, "Disability type is required"),
  percentageDisability: z.string().min(1, "Disability percentage is required"),
  hospitalName: z.string().min(1, "Hospital name is required"),
  consentId: z.string(),
});

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "CP-Disa-2026-";
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

  const percentage = parseInt(parsed.data.percentageDisability) || 0;
  const isPwD = percentage >= 40; // 40% minimum for UDID certification under RPwD Act 2016

  const departments = [
    {
      name: "District Medical Board",
      service: "UDID Disability Certificate",
      status: "APPLIED",
      assessmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    {
      name: "Ministry of Social Justice",
      service: "UDID Card (Unique Disability ID)",
      status: isPwD ? "APPLICATION_INITIATED" : "PENDING_ASSESSMENT",
    },
    {
      name: "Dept of Empowerment of PwD",
      service: "Disability Pension (RPwD Act 2016)",
      status: isPwD ? "APPLIED" : "NOT_ELIGIBLE",
      amount: isPwD ? 1500 : 0,
    },
    {
      name: "Ministry of Transport",
      service: "Concession Card (Free/Reduced Travel)",
      status: isPwD ? "APPLIED" : "NOT_ELIGIBLE",
    },
  ];

  const applicationRef = generateRef();

  let applicationId = `disa-${Date.now()}`;
  if (prisma) {
    try {
      const app = await prisma.application.create({
        data: {
          userId: session.user.id,
          schemeId: "DISABILITY-CERT-2026",
          schemeName: "Disability Certificate & Benefits 2026",
          status: "APPROVED",
          eligibilityData: JSON.stringify({
            disabilityType: parsed.data.disabilityType,
            percentage,
            hospitalName: parsed.data.hospitalName,
            isPwD,
            departments,
          }),
          consentId: parsed.data.consentId,
          applicationRef,
          amount: isPwD ? 1500 : undefined,
        },
      });
      applicationId = app.id;

      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DISABILITY_CERT_APPLICATION",
          apiSource: "ORCHESTRATOR",
          responseCode: 200,
          durationMs: Date.now() - start,
          metadata: JSON.stringify({ applicationRef, disabilityType: parsed.data.disabilityType, percentage }),
        },
      }).catch(() => {});
    } catch {
      console.warn("[CivicPulse] DB unavailable for disability application");
    }
  }

  return NextResponse.json({
    success: true,
    application: {
      id: applicationId,
      ref: applicationRef,
      status: "APPROVED",
      schemeName: "Disability Certificate & Benefits 2026",
    },
    eligibility: {
      percentage,
      isPwD,
      udidEligible: percentage >= 40,
      monthlyPension: isPwD ? 1500 : 0,
    },
    departments,
  });
});
