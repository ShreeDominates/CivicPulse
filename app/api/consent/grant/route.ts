import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  purposeCode: z.string().min(1),
  dataSources: z.array(z.string()).min(1),
  expiresInDays: z.number().min(1).max(30).default(7),
});

export const POST = withAuth(async (req: NextRequest, session: any) => {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: true, code: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

  const consent = await prisma.consentLog.create({
    data: {
      userId: session.user.id,
      purposeCode: parsed.data.purposeCode,
      dataSources: JSON.stringify(parsed.data.dataSources),
      expiresAt,
    },
  });

  return NextResponse.json({
    success: true,
    consentId: consent.id,
    purposeCode: consent.purposeCode,
    expiresAt: consent.expiresAt,
    message: "Consent granted successfully under DPDP Act 2023",
  });
});
