import { NextResponse } from "next/server";
import { incomeAdapter } from "@/lib/govapi/adapters/incomeAdapter";

/**
 * @deprecated Legacy mock route preserved for backward compatibility.
 * Authoritative path is /api/gov/fetch-income.
 * Delegates to official incomeAdapter to ensure canonical provenance.
 */
export async function POST(req: Request) {
  let pan = "ABCDE1234F";
  try {
    const body = await req.json();
    if (body.pan) pan = body.pan;
  } catch {}

  const result = await incomeAdapter.execute(
    { pan },
    { endpoint: "/api/mock/gov/fetch-income" }
  );

  return NextResponse.json(
    { ...result, ...result.data },
    {
      status: result.success ? 200 : (result.error?.upstreamStatusCode || 502),
      headers: { "x-civicpulse-deprecated": "Use /api/gov/fetch-income instead" },
    }
  );
}
