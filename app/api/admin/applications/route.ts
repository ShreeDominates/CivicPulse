import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";

let prisma: any = null;
try { prisma = require("@/lib/prisma").prisma; } catch {}

export const GET = withAuth(async (req: NextRequest, session: any) => {
  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!prisma) {
    return NextResponse.json({ applications: [], pagination: { page: 1, total: 0, pages: 0 } });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: { user: { select: { name: true, email: true, lgdStateCode: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications: applications.map((a: any) => ({
        id: a.id,
        ref: a.applicationRef,
        citizenName: a.user.name,
        schemeName: a.schemeName,
        status: a.status,
        amount: a.amount,
        state: a.user.lgdStateCode,
        createdAt: a.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ applications: [], pagination: { page: 1, total: 0, pages: 0 } });
  }
});
