import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { ApplicationLifecycleEngine } from "@/lib/lifecycle/applicationLifecycle";

export const POST = withAuth(async (req: NextRequest, session: any, context?: any) => {
  const id = context?.params?.id;
  if (!id) {
    return NextResponse.json({ error: "Application ID required" }, { status: 400 });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const result = await ApplicationLifecycleEngine.executeDisbursement(id, {
      scenario: body.scenario,
      idempotencyKey: body.idempotencyKey || req.headers.get("x-idempotency-key") || undefined,
      actorHash: session.user?.aadhaarHash || session.user?.id,
      beneficiaryName: session.user?.name,
      accountNumber: body.accountNumber,
      ifsc: body.ifsc,
    });

    const httpStatus = result.status === "FAILED" ? 422 : 200;

    return NextResponse.json(
      {
        success: result.success,
        disbursement: result,
      },
      { status: httpStatus }
    );
  } catch (error: any) {
    const isTransition = error.message?.includes("ILLEGAL_LIFECYCLE_TRANSITION");
    const status = isTransition ? 409 : 400;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Disbursement execution failed",
      },
      { status }
    );
  }
});
