import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    valid: true,
    registeredName: "Aryan Mehta",
    bankName: "State Bank of India",
    ifsc: "SBIN0001234",
    accountLast4: "1234",
    verifiedAt: new Date().toISOString(),
  });
}
