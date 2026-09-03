import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req: NextRequest, session: any) => {
  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    applications: applications.map((a) => ({
      id: a.id,
      ref: a.applicationRef,
      schemeName: a.schemeName,
      status: a.status,
      amount: a.amount,
      createdAt: a.createdAt,
    })),
  });
});
