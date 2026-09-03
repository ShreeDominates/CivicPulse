import { NextResponse } from "next/server";
import { marksAdapter } from "@/lib/govapi/adapters/marksAdapter";

/**
 * @deprecated Legacy mock route preserved for backward compatibility.
 * Authoritative path is /api/gov/fetch-marks.
 * Delegates to official marksAdapter to ensure canonical provenance.
 */
export async function POST(req: Request) {
  let rollNumber = "23456789";
  let year = 2025;
  try {
    const body = await req.json();
    if (body.rollNumber) rollNumber = body.rollNumber;
    if (body.year) year = body.year;
  } catch {}

  const result = await marksAdapter.execute(
    { rollNumber, year },
    { endpoint: "/api/mock/gov/fetch-marks" }
  );

  return NextResponse.json(
    { ...result, ...result.data },
    {
      status: result.success ? 200 : (result.error?.upstreamStatusCode || 502),
      headers: { "x-civicpulse-deprecated": "Use /api/gov/fetch-marks instead" },
    }
  );
}
