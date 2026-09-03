import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { checkRateLimit } from "@/lib/ratelimit";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format"),
  consentId: z.string(),
});

async function safeAudit(data: any) {
  if (!prisma) return;
  try { await prisma.auditLog.create({ data }); } catch {}
}

export const POST = withAuth(async (req: NextRequest, session: any) => {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  const { success } = await checkRateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: true, code: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Skip consent check in mock mode
  if (process.env.USE_MOCK_APIS !== "true") {
    const { checkConsent } = require("@/lib/middleware/withConsent");
    const consent = await checkConsent(session.user.id, "INCOME_VERIFICATION");
    if (!consent.valid) return consent.error!;
  }

  try {
    let data;
    if (process.env.USE_MOCK_APIS === "true") {
      data = {
        source: "INCOME_TAX_DEPT_MOCK",
        pan: parsed.data.pan,
        holderName: session.user.name,
        assessmentYear: "2025-26",
        annualIncome: 160000,
        taxFiled: true,
        digitallyVerified: true,
        verifiedAt: new Date().toISOString(),
      };
    } else {
      const response = await fetch(
        `https://api.apisetu.gov.in/certificate/v3/itrtrace?pAN=${parsed.data.pan}`,
        { headers: { "X-APISETU-APIKEY": process.env.APISETU_API_KEY || "" } }
      );
      if (!response.ok) throw new Error(`API Setu returned ${response.status}`);
      data = await response.json();
    }

    await safeAudit({
      userId: session.user.id, action: "INCOME_FETCH", apiSource: "API_SETU_ITR",
      responseCode: 200, durationMs: Date.now() - start,
      metadata: JSON.stringify({ pan: parsed.data.pan }), ipAddress: ip,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    await safeAudit({
      userId: session.user.id, action: "INCOME_FETCH_FAILED", apiSource: "API_SETU_ITR",
      responseCode: 500, durationMs: Date.now() - start,
      metadata: JSON.stringify({ error: error.message }), ipAddress: ip,
    });
    return NextResponse.json({ error: "Failed to fetch income data", details: error.message }, { status: 502 });
  }
});
