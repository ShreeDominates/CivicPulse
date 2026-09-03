import crypto from "crypto";

const APISETU_BASE = "https://api.apisetu.gov.in";

interface ApiSetuResponse {
  source: string;
  pan?: string;
  holderName?: string;
  assessmentYear?: string;
  annualIncome?: number;
  taxFiled?: boolean;
  digitallyVerified?: boolean;
  rollNumber?: string;
  studentName?: string;
  year?: number;
  class?: number;
  percentage?: number;
  grade?: string;
  issuedBy?: string;
}

function generateHmacSignature(
  method: string,
  path: string,
  body: string = ""
): { signature: string; timestamp: string } {
  const timestamp = Date.now().toString();
  const payload = `${timestamp}:${method}:${path}`;
  const hmac = crypto.createHmac("sha256", process.env.CIVICPULSE_API_SECRET || "dev-secret");
  hmac.update(payload + body);
  return {
    signature: hmac.digest("hex"),
    timestamp,
  };
}

function getHeaders(method: string, path: string, body?: string) {
  const { signature, timestamp } = generateHmacSignature(method, path, body || "");
  return {
    "X-APISETU-APIKEY": process.env.APISETU_API_KEY || "",
    "X-CivicPulse-Signature": signature,
    "X-CivicPulse-Timestamp": timestamp,
    "Content-Type": "application/json",
  };
}

export async function fetchIncome(pAN: string): Promise<ApiSetuResponse> {
  const path = "/certificate/v3/itrtrace";
  const headers = getHeaders("GET", path);
  const url = `${APISETU_BASE}${path}?pAN=${pAN}`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`API Setu ITR error: ${response.status}`);
  return response.json();
}

export async function fetchCBSE12(
  rollNumber: string,
  year: number
): Promise<ApiSetuResponse> {
  const path = "/certificate/v3/cbse12";
  const headers = getHeaders("GET", path);
  const url = `${APISETU_BASE}${path}?rollNumber=${rollNumber}&year=${year}`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`API Setu CBSE error: ${response.status}`);
  return response.json();
}
