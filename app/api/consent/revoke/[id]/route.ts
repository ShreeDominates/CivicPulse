import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";

export const DELETE = withAuth(async (req: NextRequest, session: any, context?: any) => {
  const id = context?.params?.id;

  if (!id) {
    return NextResponse.json({ error: "Consent ID required" }, { status: 400 });
  }

  const consent = await prisma.consentLog.findUnique({ where: { id } });

  if (!consent) {
    return NextResponse.json({ error: "Consent not found" }, { status: 404 });
  }

  if (consent.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.consentLog.update({
    where: { id },
    data: { isActive: false, revokedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "Consent revoked" });
});
