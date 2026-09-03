import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (req: any, session: any) => {
  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Mock API health data (in production, track real response times in Redis)
  const apis = [
    { name: "API Setu - ITR Verification", status: "healthy", lastResponseMs: 342, lastChecked: new Date().toISOString() },
    { name: "DigiLocker - CBSE Marks", status: "healthy", lastResponseMs: 567, lastChecked: new Date().toISOString() },
    { name: "Razorpay - Bank Validation", status: "healthy", lastResponseMs: 189, lastChecked: new Date().toISOString() },
    { name: "LGD - District Lookup", status: "healthy", lastResponseMs: 45, lastChecked: new Date().toISOString() },
    { name: "data.gov.in - PFMS Stats", status: "degraded", lastResponseMs: 2340, lastChecked: new Date().toISOString() },
    { name: "Bhashini - Translation", status: "healthy", lastResponseMs: 234, lastChecked: new Date().toISOString() },
  ];

  return NextResponse.json({ apis });
});
