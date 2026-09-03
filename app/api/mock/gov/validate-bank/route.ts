import { NextResponse } from "next/server";
import { bankAdapter } from "@/lib/govapi/adapters/bankAdapter";

/**
 * @deprecated Legacy mock route preserved for backward compatibility.
 * Authoritative path is /api/gov/validate-bank.
 * Delegates to official bankAdapter to ensure canonical provenance.
 */
export async function POST(req: Request) {
  let accountNumber = "12345678901234";
  let ifsc = "SBIN0001234";
  let name = "Aryan Mehta";
  try {
    const body = await req.json();
    if (body.accountNumber) accountNumber = body.accountNumber;
    if (body.ifsc) ifsc = body.ifsc;
    if (body.name) name = body.name;
  } catch {}

  const result = await bankAdapter.execute(
    { accountNumber, ifsc, name },
    { endpoint: "/api/mock/gov/validate-bank" }
  );

  return NextResponse.json(
    { ...result, ...result.data },
    {
      status: result.success ? 200 : (result.error?.upstreamStatusCode || 502),
      headers: { "x-civicpulse-deprecated": "Use /api/gov/validate-bank instead" },
    }
  );
}
