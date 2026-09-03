import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";

// Safe prisma import
let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

export const GET = withAuth(async (req: NextRequest, session: any) => {
  if (!prisma) {
    return NextResponse.json({ applications: [] });
  }

  try {
    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      applications: applications.map((a: any) => ({
        id: a.id,
        ref: a.applicationRef,
        schemeName: a.schemeName,
        status: a.status,
        amount: a.amount,
        createdAt: a.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ applications: [] });
  }
});
