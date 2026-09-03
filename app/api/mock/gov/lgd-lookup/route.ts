import { NextResponse } from "next/server";
import { lgdAdapter } from "@/lib/govapi/adapters/lgdAdapter";

/**
 * @deprecated Legacy mock route preserved for backward compatibility.
 * Authoritative path is /api/gov/lgd-lookup.
 * Delegates to official lgdAdapter to ensure canonical provenance.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "pune";
  const state = searchParams.get("state") || "maharashtra";

  const result = await lgdAdapter.execute(
    { name, state },
    { endpoint: "/api/mock/gov/lgd-lookup" }
  );

  return NextResponse.json(
    { ...result, ...result.data },
    {
      status: result.success ? 200 : (result.error?.upstreamStatusCode || 502),
      headers: { "x-civicpulse-deprecated": "Use /api/gov/lgd-lookup instead" },
    }
  );
}
