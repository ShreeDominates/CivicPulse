import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { checkRateLimit } from "@/lib/ratelimit";
import { casteAdapter } from "@/lib/govapi/adapters/casteAdapter";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  certificateId: z.string().min(1, "Certificate identifier required"),
  category: z.string().optional(),
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
    const consent = await checkConsent(session.user.id, "CASTE_VERIFICATION");
    if (!consent.valid) return consent.error!;
  }

  const actorHash = session.user?.aadhaarHash || undefined;

  try {
    const result = await casteAdapter.execute(
      {
        certificateId: parsed.data.certificateId,
        category: parsed.data.category,
      },
      {
        userId: session.user.id,
        actorHash,
        consentId: parsed.data.consentId,
        endpoint: "/api/gov/fetch-caste",
        ipAddress: ip,
      }
    );

    if (!result.success) {
      const statusCode = result.error?.upstreamStatusCode || 502;
      await safeAudit({
        userId: session.user.id,
        actorHash,
        action: "CASTE_FETCH_FAILED",
        apiSource: result.provenance.sourceId,
        endpoint: "/api/gov/fetch-caste",
        responseCode: statusCode,
        durationMs: Date.now() - start,
        metadata: JSON.stringify({
          certificateId: parsed.data.certificateId,
          errorCode: result.error?.code,
          error: result.error?.message,
        }),
        ipAddress: ip,
      });
      return NextResponse.json(
        {
          error: result.error?.message || "Failed to fetch caste certificate",
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
      action: "CASTE_FETCH",
      apiSource: result.provenance.sourceId,
      endpoint: "/api/gov/fetch-caste",
      responseCode: 200,
      durationMs: Date.now() - start,
      metadata: JSON.stringify({
        certificateId: parsed.data.certificateId,
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
      action: "CASTE_FETCH_FAILED",
      apiSource: "STATE_REVENUE_PORTAL",
      endpoint: "/api/gov/fetch-caste",
      responseCode: 500,
      durationMs: Date.now() - start,
      metadata: JSON.stringify({ error: error.message }),
      ipAddress: ip,
    });
    return NextResponse.json({ error: "Failed to fetch caste certificate", details: error.message }, { status: 502 });
  }
});
