import { cacheGet, cacheSet } from "../redis";

const DATAGOV_BASE = "https://api.data.gov.in";

interface DataGovResponse {
  success: boolean;
  result: {
    records: Record<string, unknown>[];
    total: number;
  };
}

export async function fetchDataGovStats(
  resourceId: string,
  filters?: Record<string, string>,
  ttl = 3600
): Promise<Record<string, unknown>[]> {
  const cacheKey = `datagov:${resourceId}:${JSON.stringify(filters || {})}`;

  // Check cache
  const cached = await cacheGet<Record<string, unknown>[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    "api-key": process.env.DATA_GOV_IN_API_KEY || "",
    format: "json",
    limit: "100",
  });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      params.append(`filters[${key}]`, value);
    });
  }

  const response = await fetch(`${DATAGOV_BASE}/resource/${resourceId}?${params}`);

  if (!response.ok) {
    console.error(`data.gov.in error: ${response.status}`);
    return [];
  }

  const data: DataGovResponse = await response.json();
  const records = data.result?.records || [];

  // Cache result
  await cacheSet(cacheKey, records, ttl);
  return records;
}

// Real resource IDs from data.gov.in
export const RESOURCES = {
  PM_SCHOLARSHIP: "6176ee09-3d56-4a3b-8115-21841ddeec80",
  PFMS_DBT: "3b81e1e4-d48e-4b1c-b7d3-99f2d0e9e2c1", // placeholder - verify
  CENSUS_POPULATION: "e2f20d1e-5ce0-4e2b-8431-b5e0e0e12e2e", // placeholder - verify
};
