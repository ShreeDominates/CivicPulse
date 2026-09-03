import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    source: "INCOME_TAX_DEPT_MOCK",
    pan: "ABCDE1234F",
    holderName: "Aryan Mehta",
    assessmentYear: "2025-26",
    annualIncome: 160000,
    taxFiled: true,
    digitallyVerified: true,
    verifiedAt: new Date().toISOString(),
  });
}
