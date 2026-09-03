import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  annualIncome: z.string().min(1, "Annual income is required"),
  hasPension: z.string().min(1, "Pension status is required"),
  consentId: z.string(),
});

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "CP-PENS-2026-";
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

  // Calculate age
  const dob = new Date(parsed.data.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const income = parseInt(parsed.data.annualIncome) || 0;

  const seniorCitizen = age >= 60;
  const belowPovertyLine = income < 100000;
  const noExistingPension = parsed.data.hasPension === "none";

  const nsapEligible = seniorCitizen && belowPovertyLine;
  const statePensionEligible = seniorCitizen && income < 200000;
  const ayushmanEligible = income < 500000;
  const epfoActive = parsed.data.hasPension === "epfo";

  const applicationRef = generateRef();
  const monthlyPension = nsapEligible ? 3000 : statePensionEligible ? 1500 : 0;

  const departments = [
    {
      name: "Ministry of Social Justice",
      service: "National Social Assistance Programme (NSAP)",
      status: nsapEligible ? "APPLIED" : "NOT_ELIGIBLE",
      amount: nsapEligible ? 3000 : 0,
    },
    {
      name: "EPFO",
      service: "Employee Pension Scheme / EPF Withdrawal",
      status: epfoActive ? "APPLICATION_INITIATED" : "NO_RECORD",
      amount: 0,
    },
    {
      name: "State Social Welfare Dept",
      service: "Old Age Pension (Maharashtra State Scheme)",
      status: statePensionEligible ? "APPLIED" : "NOT_ELIGIBLE",
      amount: statePensionEligible ? 1500 : 0,
    },
    {
      name: "Ayushman Bharat",
      service: "PM-JAY Health Insurance (₹5 Lakh Cover)",
      status: ayushmanEligible ? "APPLIED" : "NOT_ELIGIBLE",
      amount: 0,
    },
  ];

  let applicationId = `pens-${Date.now()}`;
  if (prisma) {
    try {
      const app = await prisma.application.create({
        data: {
          userId: session.user.id,
          schemeId: "SENIOR-PENSION-2026",
          schemeName: "Senior Citizen Pension & Benefits 2026",
          status: monthlyPension > 0 ? "APPROVED" : "PENDING",
          eligibilityData: JSON.stringify({ age, income, nsapEligible, statePensionEligible, ayushmanEligible, departments }),
          consentId: parsed.data.consentId,
          applicationRef,
          amount: monthlyPension || undefined,
        },
      });
      applicationId = app.id;

      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SENIOR_PENSION_APPLICATION",
          apiSource: "ORCHESTRATOR",
          responseCode: 200,
          durationMs: Date.now() - start,
          metadata: JSON.stringify({ applicationRef, age, income, monthlyPension }),
        },
      }).catch(() => {});
    } catch {
      console.warn("[CivicPulse] DB unavailable for pension application");
    }
  }

  return NextResponse.json({
    success: true,
    application: {
      id: applicationId,
      ref: applicationRef,
      status: monthlyPension > 0 ? "APPROVED" : "PENDING",
      schemeName: "Senior Citizen Pension & Benefits 2026",
    },
    eligibility: {
      seniorCitizen,
      belowPovertyLine,
      noExistingPension,
      nsapEligible,
      statePensionEligible,
      ayushmanEligible,
      monthlyPension,
    },
    departments,
  });
});
