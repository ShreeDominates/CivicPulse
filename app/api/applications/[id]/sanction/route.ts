import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { ApplicationLifecycleEngine } from "@/lib/lifecycle/applicationLifecycle";

export const POST = withAuth(async (req: NextRequest, session: any, context?: any) => {
  const id = context?.params?.id;
  if (!id) {
    return NextResponse.json({ error: "Application ID required" }, { status: 400 });
  }

  try {
    const sanction = await ApplicationLifecycleEngine.generateSanction(
      id,
      session.user?.aadhaarHash || session.user?.id
    );

    return NextResponse.json({
      success: true,
      sanction,
    });
  } catch (error: any) {
    const isPrereq = error.message?.includes("PREREQUISITE_FAILED") || error.message?.includes("ELIGIBILITY_GATE_BLOCKED");
    const status = isPrereq ? 422 : 400;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate sanction order",
      },
      { status }
    );
  }
});
