import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { auditService } from "@/lib/lifecycle/auditService";

export const GET = withAuth(async (req: NextRequest, session: any, context?: any) => {
  const id = context?.params?.id;
  if (!id) {
    return NextResponse.json({ error: "Application ID required" }, { status: 400 });
  }

  try {
    const timeline = await auditService.getTimeline(id);

    return NextResponse.json({
      success: true,
      applicationId: id,
      timeline,
      totalEvents: timeline.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve application timeline",
      },
      { status: 500 }
    );
  }
});
