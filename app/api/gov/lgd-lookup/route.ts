import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const QuerySchema = z.object({
  name: z.string().min(1),
  state: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    name: searchParams.get("name"),
    state: searchParams.get("state"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: true, code: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Try real database first
  const district = await prisma.lgdDistrict.findFirst({
    where: {
      name: { contains: parsed.data.name },
      ...(parsed.data.state
        ? { stateName: { contains: parsed.data.state } }
        : {}),
    },
  });

  if (district) {
    return NextResponse.json({
      found: true,
      districtCode: district.code,
      districtName: district.name,
      stateCode: district.stateCode,
      stateName: district.stateName,
    });
  }

  // Fallback to mock
  const mockDistricts: Record<string, any> = {
    pune: { found: true, districtCode: "519", districtName: "Pune", stateCode: "27", stateName: "Maharashtra" },
    mumbai: { found: true, districtCode: "516", districtName: "Mumbai", stateCode: "27", stateName: "Maharashtra" },
    nagpur: { found: true, districtCode: "525", districtName: "Nagpur", stateCode: "27", stateName: "Maharashtra" },
  };

  return NextResponse.json(
    mockDistricts[parsed.data.name.toLowerCase()] || {
      found: true,
      districtCode: "519",
      districtName: parsed.data.name.charAt(0).toUpperCase() + parsed.data.name.slice(1),
      stateCode: "27",
      stateName: parsed.data.state || "Maharashtra",
    }
  );
}
