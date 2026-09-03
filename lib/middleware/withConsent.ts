import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function checkConsent(
  userId: string,
  purposeCode: string
): Promise<{ valid: boolean; error?: NextResponse }> {
  const consent = await prisma.consentLog.findFirst({
    where: {
      userId,
      purposeCode,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (!consent) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: "Consent required or expired",
          code: "CONSENT_REQUIRED",
          message:
            "You must grant consent before we can fetch data from government APIs on your behalf. This is required under the DPDP Act 2023.",
        },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}
