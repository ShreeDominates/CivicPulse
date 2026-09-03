import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { checkRateLimit } from "@/lib/ratelimit";
import { incomeAdapter } from "@/lib/govapi/adapters/incomeAdapter";

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

  const actorHash = session.user?.aadhaarHash || undefined;

  try {
    const result = await incomeAdapter.execute(
      { pan: parsed.data.pan, holderName: session.user?.name },
      {
        userId: session.user.id,
        actorHash,
        consentId: parsed.data.consentId,
        endpoint: "/api/gov/fetch-income",
        ipAddress: ip,
      }
    );

    if (!result.success) {
      const statusCode = result.error?.upstreamStatusCode || 502;
      await safeAudit({
        userId: session.user.id,
        actorHash,
        action: "INCOME_FETCH_FAILED",
        apiSource: result.provenance.sourceId,
        endpoint: "/api/gov/fetch-income",
        responseCode: statusCode,
        durationMs: Date.now() - start,
        metadata: JSON.stringify({
          pan: parsed.data.pan.slice(0, 2) + "*****" + parsed.data.pan.slice(-2),
          errorCode: result.error?.code,
          error: result.error?.message,
        }),
        ipAddress: ip,
      });
      return NextResponse.json(
        {
          error: result.error?.message || "Failed to fetch income data",
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
      action: "INCOME_FETCH",
      apiSource: result.provenance.sourceId,
      endpoint: "/api/gov/fetch-income",
      responseCode: 200,
      durationMs: Date.now() - start,
      metadata: JSON.stringify({
        pan: parsed.data.pan.slice(0, 2) + "*****" + parsed.data.pan.slice(-2),
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
      action: "INCOME_FETCH_FAILED",
      apiSource: "INCOME_TAX_DEPT_APISETU",
      endpoint: "/api/gov/fetch-income",
      responseCode: 500,
      durationMs: Date.now() - start,
      metadata: JSON.stringify({ error: error.message }),
      ipAddress: ip,
    });
    return NextResponse.json({ error: "Failed to fetch income data", details: error.message }, { status: 502 });
  }
});
