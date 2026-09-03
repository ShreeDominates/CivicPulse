import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { checkRateLimit } from "@/lib/ratelimit";
import { marksAdapter } from "@/lib/govapi/adapters/marksAdapter";

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

  const actorHash = session.user?.aadhaarHash || undefined;

  try {
    const result = await marksAdapter.execute(
      { rollNumber: parsed.data.rollNumber, year: parsed.data.year, studentName: session.user?.name },
      {
        userId: session.user.id,
        actorHash,
        consentId: parsed.data.consentId,
        endpoint: "/api/gov/fetch-marks",
        ipAddress: ip,
      }
    );

    if (!result.success) {
      const statusCode = result.error?.upstreamStatusCode || 502;
      await safeAudit({
        userId: session.user.id,
        actorHash,
        action: "MARKS_FETCH_FAILED",
        apiSource: result.provenance.sourceId,
        endpoint: "/api/gov/fetch-marks",
        responseCode: statusCode,
        durationMs: Date.now() - start,
        metadata: JSON.stringify({
          rollNumber: parsed.data.rollNumber.slice(0, 2) + "****" + parsed.data.rollNumber.slice(-2),
          errorCode: result.error?.code,
          error: result.error?.message,
        }),
        ipAddress: ip,
      });
      return NextResponse.json(
        {
          error: result.error?.message || "Failed to fetch marks",
          code: result.error?.code,
          details: result.error,
          ...result,
        },
        { status: statusCode }
      );
    }

    await safeAudit({
      userId: session.user.id,
      actorHash,
      action: "MARKS_FETCH",
      apiSource: result.provenance.sourceId,
      endpoint: "/api/gov/fetch-marks",
      responseCode: 200,
      durationMs: Date.now() - start,
      metadata: JSON.stringify({
        rollNumber: parsed.data.rollNumber.slice(0, 2) + "****" + parsed.data.rollNumber.slice(-2),
        requestId: result.provenance.requestId,
        verificationStatus: result.verificationStatus,
      }),
      ipAddress: ip,
    });

    // Return canonical adapter result with domain data spread for backward compatibility
    return NextResponse.json({
      ...result,
      ...result.data,
    });
  } catch (error: any) {
    await safeAudit({
      userId: session.user.id,
      actorHash,
      action: "MARKS_FETCH_FAILED",
      apiSource: "CBSE_DIGILOCKER",
      endpoint: "/api/gov/fetch-marks",
      responseCode: 500,
      durationMs: Date.now() - start,
      metadata: JSON.stringify({ error: error.message }),
      ipAddress: ip,
    });
    return NextResponse.json({ error: "Failed to fetch marks", details: error.message }, { status: 502 });
  }
});
