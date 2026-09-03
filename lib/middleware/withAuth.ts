import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type AuthenticatedHandler = (
  req: NextRequest,
  session: any
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return handler(req, session);
  };
}
