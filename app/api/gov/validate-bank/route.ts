import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { checkRateLimit } from "@/lib/ratelimit";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

const BodySchema = z.object({
  accountNumber: z.string().min(9).max(18),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC"),
  name: z.string().min(1),
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
    const consent = await checkConsent(session.user.id, "BANK_VALIDATION");
    if (!consent.valid) return consent.error!;
  }

  try {
    let data;
    if (process.env.USE_MOCK_APIS === "true") {
      data = {
        valid: true,
        registeredName: parsed.data.name,
        bankName: "State Bank of India",
        ifsc: parsed.data.ifsc,
        accountLast4: parsed.data.accountNumber.slice(-4),
        verifiedAt: new Date().toISOString(),
      };
    } else {
      const creds = Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString("base64");

      const response = await fetch("https://api.razorpay.com/v1/fund_accounts/validations", {
        method: "POST",
        headers: {
          Authorization: `Basic ${creds}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: parsed.data.accountNumber,
          ifsc: parsed.data.ifsc,
          name: parsed.data.name,
        }),
      });
      if (!response.ok) throw new Error("Razorpay validation failed");
      const razorpayData = await response.json();
      data = {
        valid: true,
        registeredName: razorpayData.registered_name || parsed.data.name,
        bankName: razorpayData.bank_name || "Unknown",
        ifsc: parsed.data.ifsc,
        accountLast4: parsed.data.accountNumber.slice(-4),
        verifiedAt: new Date().toISOString(),
      };
    }

    await safeAudit({
      userId: session.user.id, action: "BANK_VALIDATION", apiSource: "RAZORPAY_FAV",
      responseCode: 200, durationMs: Date.now() - start,
      metadata: JSON.stringify({ ifsc: parsed.data.ifsc }), ipAddress: ip,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Bank validation failed", details: error.message }, { status: 502 });
  }
});
