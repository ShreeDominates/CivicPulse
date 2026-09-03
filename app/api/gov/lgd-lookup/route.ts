import { NextResponse } from "next/server";
import { z } from "zod";
import { lgdAdapter } from "@/lib/govapi/adapters/lgdAdapter";

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

  const result = await lgdAdapter.execute(
    { name: parsed.data.name, state: parsed.data.state },
    { endpoint: "/api/gov/lgd-lookup" }
  );

  // Return canonical adapter result with domain data spread for backward compatibility
  return NextResponse.json({
    ...result,
    ...result.data,
  });
}
