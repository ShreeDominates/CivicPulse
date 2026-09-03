import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  landId: z.string().min(1, "Land ID is required"),
  farmSize: z.string().min(1, "Farm size is required"),
  cropType: z.string().min(1, "Crop type is required"),
  consentId: z.string(),
});

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "CP-FARM-2026-";
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

  const applicationRef = generateRef();
  const farmSize = parseFloat(parsed.data.farmSize);

  // Determine eligibility based on farm size
  const pmkisanEligible = farmSize <= 5; // PM-KISAN: up to 5 acres
  const fasalBimaEligible = farmSize > 0;
  const kccEligible = farmSize > 0;
  const landRecordsVerified = true; // Mock verification

  const departments = [
    {
      name: "Ministry of Agriculture",
      service: "PM-KISAN Direct Benefit Transfer",
      status: pmkisanEligible ? "APPLIED" : "NOT_ELIGIBLE",
      amount: pmkisanEligible ? 6000 : 0,
    },
    {
      name: "Fasal Bima Yojana",
      service: "Crop Insurance Scheme",
      status: fasalBimaEligible ? "APPLIED" : "NOT_ELIGIBLE",
      amount: 0,
    },
    {
      name: "State Revenue Department",
      service: "Land Records Verification (7/12 Extract)",
      status: landRecordsVerified ? "VERIFIED" : "PENDING",
      amount: 0,
    },
    {
      name: "NABARD",
      service: "Kisan Credit Card Processing",
      status: kccEligible ? "APPLIED" : "NOT_ELIGIBLE",
      amount: 0,
    },
  ];

  // Try to save to DB
  let applicationId = `farm-${Date.now()}`;
  if (prisma) {
    try {
      const app = await prisma.application.create({
        data: {
          userId: session.user.id,
          schemeId: "FARMER-SUPPORT-2026",
          schemeName: "Farmer Support Services 2026",
          status: pmkisanEligible ? "APPROVED" : "PENDING",
          eligibilityData: JSON.stringify({
            landId: parsed.data.landId,
            farmSize,
            cropType: parsed.data.cropType,
            departments,
          }),
          consentId: parsed.data.consentId,
          applicationRef,
          amount: pmkisanEligible ? 6000 : undefined,
        },
      });
      applicationId = app.id;

      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "FARMER_SUPPORT_APPLICATION",
          apiSource: "ORCHESTRATOR",
          responseCode: 200,
          durationMs: Date.now() - start,
          metadata: JSON.stringify({ applicationRef, pmkisanEligible, farmSize }),
        },
      }).catch(() => {});
    } catch {
      console.warn("[CivicPulse] DB unavailable for farmer application");
    }
  }

  return NextResponse.json({
    success: true,
    application: {
      id: applicationId,
      ref: applicationRef,
      status: pmkisanEligible ? "APPROVED" : "PENDING",
      schemeName: "Farmer Support Services 2026",
    },
    eligibility: {
      pmkisanEligible,
      fasalBimaEligible,
      kccEligible,
      landRecordsVerified,
      annualBenefit: pmkisanEligible ? 6000 : 0,
    },
    departments,
  });
});
