import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { checkRateLimit } from "@/lib/ratelimit";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  rollNumber: z.string().min(1, "Roll number required"),
  year: z.number().min(2020).max(2030),
  consentId: z.string(),
});

// Safe audit log — never crashes the request
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
    const consent = await checkConsent(session.user.id, "MARKSHEET_FETCH");
    if (!consent.valid) return consent.error!;
  }

  try {
    let data;
    if (process.env.USE_MOCK_APIS === "true") {
      data = {
        source: "CBSE_DIGILOCKER_MOCK",
        rollNumber: parsed.data.rollNumber,
        studentName: session.user.name,
        year: parsed.data.year,
        class: 12,
        percentage: 87.4,
        grade: "A+",
        digitalSignatureValid: true,
        issuedBy: "CENTRAL BOARD OF SECONDARY EDUCATION",
        issuedOn: "2025-06-01",
      };
    } else {
      const response = await fetch(
        `https://api.apisetu.gov.in/certificate/v3/cbse12?rollNumber=${parsed.data.rollNumber}&year=${parsed.data.year}`,
        { headers: { "X-APISETU-APIKEY": process.env.APISETU_API_KEY || "" } }
      );
      if (!response.ok) throw new Error(`API Setu CBSE returned ${response.status}`);
      data = await response.json();
    }

    await safeAudit({
      userId: session.user.id, action: "MARKS_FETCH", apiSource: "DIGILOCKER_CBSE",
      responseCode: 200, durationMs: Date.now() - start,
      metadata: JSON.stringify({ rollNumber: parsed.data.rollNumber }), ipAddress: ip,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    await safeAudit({
      userId: session.user.id, action: "MARKS_FETCH_FAILED", apiSource: "DIGILOCKER_CBSE",
      responseCode: 500, durationMs: Date.now() - start,
      metadata: JSON.stringify({ error: error.message }), ipAddress: ip,
    });
    return NextResponse.json({ error: "Failed to fetch marks", details: error.message }, { status: 502 });
  }
});
