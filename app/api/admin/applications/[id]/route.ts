import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "DISBURSED", "PENDING"]),
  reason: z.string().min(1, "Override reason required"),
});

export const PATCH = withAuth(async (req: NextRequest, session: any, context?: any) => {
  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const id = context?.params?.id;
  if (!id) {
    return NextResponse.json({ error: "Application ID required" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: true, code: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const previousStatus = application.status;

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: parsed.data.status,
      rejectionReasons: parsed.data.status === "REJECTED"
        ? JSON.stringify([parsed.data.reason])
        : application.rejectionReasons,
    },
  });

  // Audit the override
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_OVERRIDE",
      apiSource: "ADMIN",
      responseCode: 200,
      durationMs: 0,
      metadata: JSON.stringify({
        applicationId: id,
        previousStatus,
        newStatus: parsed.data.status,
        reason: parsed.data.reason,
      }),
    },
  });

  return NextResponse.json({ success: true, application: { id: updated.id, status: updated.status } });
});
