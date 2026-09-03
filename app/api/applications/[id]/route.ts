import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req: NextRequest, session: any, context?: any) => {
  const id = context?.params?.id;
  if (!id) {
    return NextResponse.json({ error: "Application ID required" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Citizens can only see their own
  const role = (session.user as any).role;
  if (role !== "ADMIN" && application.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    application: {
      ...application,
      eligibilityData: JSON.parse(application.eligibilityData as string),
      rejectionReasons: JSON.parse(application.rejectionReasons as string),
    },
  });
});
