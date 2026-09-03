import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    source: "CBSE_DIGILOCKER_MOCK",
    rollNumber: "23456789",
    studentName: "Aryan Mehta",
    year: 2025,
    class: 12,
    percentage: 87.4,
    grade: "A+",
    digitalSignatureValid: true,
    issuedBy: "CENTRAL BOARD OF SECONDARY EDUCATION",
    issuedOn: "2025-06-01",
  });
}
