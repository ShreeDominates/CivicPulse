import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  const cacheKey = "stats:district-map";
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return NextResponse.json(cached);

  // District-wise data for bar chart (mock with realistic Maharashtra data)
  const districtData = [
    { district: "Pune", applications: 1245, disbursed: 1102 },
    { district: "Mumbai", applications: 2340, disbursed: 2100 },
    { district: "Nagpur", applications: 890, disbursed: 780 },
    { district: "Nashik", applications: 678, disbursed: 601 },
    { district: "Aurangabad", applications: 534, disbursed: 467 },
    { district: "Kolhapur", applications: 456, disbursed: 412 },
    { district: "Solapur", applications: 389, disbursed: 340 },
    { district: "Thane", applications: 1890, disbursed: 1756 },
  ];

  await cacheSet(cacheKey, districtData, 3600);
  return NextResponse.json({ districts: districtData });
}
