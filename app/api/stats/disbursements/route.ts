import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cacheKey = "stats:disbursements";
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Get real data from database
  const [total, approved, pending, disbursed] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: "APPROVED" } }),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.application.count({ where: { status: "DISBURSED" } }),
  ]);

  // Mock national stats (in production, fetch from data.gov.in PFMS API)
  const stats = {
    totalScholarshipsDisbursed: 482134,
    studentsBenefited2026: 156892,
    oldProcessingDays: 21,
    jansetsuProcessingSeconds: 3,
    // Real data from our DB
    localApplications: total,
    localApproved: approved,
    localPending: pending,
    localDisbursed: disbursed,
    source: total > 0 ? "LIVE_DATABASE" : "PLACEHOLDER",
  };

  await cacheSet(cacheKey, stats, 300);
  return NextResponse.json(stats);
}
