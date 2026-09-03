import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "pune";

  const districts: Record<string, any> = {
    pune: { found: true, districtCode: "519", districtName: "Pune", stateCode: "27", stateName: "Maharashtra" },
    mumbai: { found: true, districtCode: "516", districtName: "Mumbai", stateCode: "27", stateName: "Maharashtra" },
    nagpur: { found: true, districtCode: "525", districtName: "Nagpur", stateCode: "27", stateName: "Maharashtra" },
    delhi: { found: true, districtCode: "75", districtName: "Central Delhi", stateCode: "10", stateName: "Delhi" },
    bangalore: { found: true, districtCode: "572", districtName: "Bangalore Urban", stateCode: "15", stateName: "Karnataka" },
  };

  const result = districts[name.toLowerCase()] || {
    found: true,
    districtCode: "519",
    districtName: name.charAt(0).toUpperCase() + name.slice(1),
    stateCode: "27",
    stateName: "Maharashtra",
  };

  return NextResponse.json(result);
}
